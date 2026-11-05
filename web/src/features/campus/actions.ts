"use server";

import { refresh } from "next/cache";
import sharp from "sharp";
import { exigerPermission } from "@/features/auth/acces";
import { exigerMessagerie, moderateurs } from "@/features/messagerie/acces";
import { MOTIFS_SIGNALEMENT } from "@/features/messagerie/regles";
import { notifier } from "@/features/notifications/emettre";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { CLE_REGLAGES_CAMPUS, lireReglagesCampus } from "./reglages";
import { lecteurDe } from "./requetes";
import {
  type Audience,
  audiencePermise,
  COMMENTAIRES_PAR_HEURE,
  LONGUEUR_COMMENTAIRE,
  LONGUEUR_PUBLICATION,
  peutVoir,
  PHOTOS_MAX,
  PUBLICATIONS_PAR_HEURE,
  SEUIL_MASQUAGE,
  verifierTexte,
} from "./regles";

const TYPES_PHOTOS = ["image/jpeg", "image/png", "image/webp"];
const TAILLE_MAX_PHOTO = 4 * 1024 * 1024;

/** Auteur connecté, avec ses droits de lecture sur le Campus. */
async function lecteur() {
  const { u, profil } = await exigerMessagerie("/");
  return { u, profil, l: lecteurDe(profil, u.permissions) };
}

/** Publication visible par le lecteur (sinon null). */
async function visible(id: string, l: ReturnType<typeof lecteurDe>) {
  const p = await db.publication.findUnique({ where: { id } });
  if (
    !p ||
    !peutVoir(
      {
        auteurId: p.auteurId,
        audience: p.audience,
        filiereId: p.filiereId,
        promotionId: p.promotionId,
        statut: p.statut,
        supprime: !!p.supprimeLe,
        masque: !!p.masqueLe,
      },
      l,
    )
  )
    return null;
  return p;
}

const lien = (base: string, id: string) => `${base}/${id}`;
/** Espace d'où l'auteur d'un contenu le consultera (pour le lien des notifications). */
async function baseDe(utilisateurId: string) {
  const roles = (
    await db.utilisateurRole.findMany({
      where: { utilisateurId },
      select: { role: { select: { code: true } } },
    })
  ).map((r) => r.role.code);
  if (roles.includes("etudiant")) return "/etudiant/campus";
  if (roles.includes("enseignant")) return "/enseignant/campus";
  return "/admin/campus";
}

export async function accepterRegles(): Promise<EtatFormulaire> {
  const { u } = await lecteur();
  await db.utilisateur.update({ where: { id: u.id }, data: { reglesCampusLe: new Date() } });
  refresh();
  return succes("Merci. Vous pouvez publier sur le Campus.");
}

export async function publier(_e: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  const { u, profil, l } = await lecteur();
  const compte = await db.utilisateur.findUnique({
    where: { id: u.id },
    select: { reglesCampusLe: true },
  });
  if (!compte?.reglesCampusLe) return echec("Acceptez d'abord les règles du Campus.");

  const photos = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > PHOTOS_MAX) return echec(`${PHOTOS_MAX} photos au plus.`);
  if (photos.some((f) => !TYPES_PHOTOS.includes(f.type)))
    return echec("Photos acceptées : JPEG, PNG ou WebP.");
  if (photos.some((f) => f.size > TAILLE_MAX_PHOTO))
    return echec("Photo trop lourde (4 Mo au plus).");

  const contenu = String(fd.get("contenu") ?? "").trim();
  const probleme = verifierTexte(contenu, LONGUEUR_PUBLICATION, photos.length > 0);
  if (probleme) return echec(probleme);

  const choix = String(fd.get("audience") ?? "INSTITUT");
  const [type, cible] = choix.includes(":") ? choix.split(":", 2) : [choix, null];
  if (!["INSTITUT", "FILIERE", "PROMOTION"].includes(type)) return echec("Audience invalide.");
  const audience = type as Audience;
  if (!audiencePermise(l, audience, cible))
    return echec("Vous ne pouvez pas publier pour ce public.");

  const recentes = await db.publication.count({
    where: { auteurId: u.id, creeLe: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (recentes >= PUBLICATIONS_PAR_HEURE)
    return echec("Vous avez beaucoup publié cette dernière heure. Réessayez un peu plus tard.");

  const { validationPrealable } = await lireReglagesCampus();
  // Validation préalable : s'applique aux étudiants ; le personnel et les enseignants publient directement.
  const enAttente = validationPrealable && !profil.personnel && !profil.enseignant;

  const p = await db.publication.create({
    data: {
      auteurId: u.id,
      contenu,
      audience,
      filiereId: audience === "FILIERE" ? cible : null,
      promotionId: audience === "PROMOTION" ? cible : null,
      statut: enAttente ? "EN_ATTENTE" : "PUBLIEE",
    },
  });
  for (const [ordre, photo] of photos.entries()) {
    try {
      const image = sharp(Buffer.from(await photo.arrayBuffer()), { limitInputPixels: 60e6 })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 });
      const { data, info } = await image.toBuffer({ resolveWithObject: true });
      const cle = `prive/campus/${p.id}/${jetonAleatoire(8).toLowerCase()}.webp`;
      await stockage().enregistrer(cle, data, "image/webp");
      await db.publicationMedia.create({
        data: {
          publication: { connect: { id: p.id } },
          ordre,
          media: {
            create: {
              cle,
              nomFichier: `photo-${ordre + 1}.webp`,
              typeMime: "image/webp",
              taille: data.length,
              largeur: info.width,
              hauteur: info.height,
              texteAlternatif: `Photo ${ordre + 1} publiée sur le Campus`,
              dossier: "campus",
              creeParId: u.id,
            },
          },
        },
      });
    } catch {
      // Une photo illisible n'empêche pas la publication du texte.
    }
  }
  if (enAttente)
    await notifier(await moderateurs(), {
      type: "MODERATION",
      titre: "Publication à valider sur le Campus",
      message: contenu.slice(0, 120) || "Publication avec photos",
      lien: "/admin/messagerie/signalements#campus-a-valider",
    });
  refresh();
  return succes(
    enAttente
      ? "Publication envoyée : elle paraîtra après validation par la modération."
      : "Publié.",
  );
}

export async function modifierPublication(
  id: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const { u } = await lecteur();
  const p = await db.publication.findUnique({ where: { id } });
  if (!p || p.auteurId !== u.id || p.supprimeLe) return echec("Publication introuvable.");
  const contenu = String(fd.get("contenu") ?? "").trim();
  const avecPhotos = (await db.publicationMedia.count({ where: { publicationId: id } })) > 0;
  const probleme = verifierTexte(contenu, LONGUEUR_PUBLICATION, avecPhotos);
  if (probleme) return echec(probleme);
  await db.publication.update({ where: { id }, data: { contenu, modifieLe: new Date() } });
  refresh();
  return succes("Publication modifiée.");
}

export async function supprimerPublication(id: string): Promise<EtatFormulaire> {
  const { u, l } = await lecteur();
  const p = await db.publication.findUnique({
    where: { id },
    include: { medias: { include: { media: true } } },
  });
  if (!p || p.supprimeLe || (p.auteurId !== u.id && !l.moderateur))
    return echec("Publication introuvable.");
  await db.publication.update({
    where: { id },
    data: { supprimeLe: new Date(), contenu: "" },
  });
  for (const m of p.medias) {
    await db.media.delete({ where: { id: m.media.id } }).catch(() => undefined);
    await stockage()
      .supprimer(m.media.cle)
      .catch(() => undefined);
  }
  if (p.auteurId !== u.id)
    await journaliser({
      auteurId: u.id,
      action: "publication_supprimee",
      entite: "Publication",
      entiteId: id,
    });
  refresh();
  return succes("Publication supprimée.");
}

/** J'aime / Je n'aime plus ; renvoie l'état et le total à jour. */
export async function basculerJaime(id: string) {
  const { u, l } = await lecteur();
  if (!(await visible(id, l))) return null;
  const cle = { publicationId_utilisateurId: { publicationId: id, utilisateurId: u.id } };
  const deja = await db.reactionPublication.findUnique({ where: cle });
  if (deja) await db.reactionPublication.delete({ where: cle });
  else
    await db.reactionPublication
      .create({ data: { publicationId: id, utilisateurId: u.id } })
      .catch(() => undefined);
  const total = await db.reactionPublication.count({ where: { publicationId: id } });
  return { aime: !deja, total };
}

export async function basculerEnregistrement(id: string) {
  const { u, l } = await lecteur();
  if (!(await visible(id, l))) return null;
  const cle = { publicationId_utilisateurId: { publicationId: id, utilisateurId: u.id } };
  const deja = await db.enregistrementPublication.findUnique({ where: cle });
  if (deja) await db.enregistrementPublication.delete({ where: cle });
  else
    await db.enregistrementPublication
      .create({ data: { publicationId: id, utilisateurId: u.id } })
      .catch(() => undefined);
  return { enregistre: !deja };
}

export async function commenter(
  publicationId: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const { u, l } = await lecteur();
  const p = await visible(publicationId, l);
  if (!p || p.statut !== "PUBLIEE" || p.masqueLe) return echec("Publication introuvable.");
  if (p.commentairesFermes) return echec("Les commentaires sont fermés.");
  const contenu = String(fd.get("contenu") ?? "").trim();
  const probleme = verifierTexte(contenu, LONGUEUR_COMMENTAIRE);
  if (probleme) return echec(probleme);
  const recents = await db.commentaire.count({
    where: { auteurId: u.id, creeLe: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (recents >= COMMENTAIRES_PAR_HEURE) return echec("Trop de commentaires. Réessayez plus tard.");

  let parentId = String(fd.get("parentId") ?? "") || null;
  let parentAuteur: string | null = null;
  if (parentId) {
    const parent = await db.commentaire.findUnique({ where: { id: parentId } });
    if (parent?.publicationId !== publicationId) return echec("Commentaire introuvable.");
    // Un seul niveau de réponse : répondre à une réponse revient à répondre à son commentaire.
    parentId = parent.parentId ?? parent.id;
    parentAuteur = parent.auteurId;
  }
  await db.commentaire.create({
    data: { publicationId, auteurId: u.id, contenu, parentId },
  });

  const extrait = contenu.length > 100 ? `${contenu.slice(0, 99)}…` : contenu;
  if (p.auteurId && p.auteurId !== u.id)
    await notifier([p.auteurId], {
      type: "CAMPUS",
      titre: `${u.nomComplet} a commenté votre publication`,
      message: extrait,
      lien: lien(await baseDe(p.auteurId), publicationId),
    });
  if (parentAuteur && parentAuteur !== u.id && parentAuteur !== p.auteurId)
    await notifier([parentAuteur], {
      type: "CAMPUS",
      titre: `${u.nomComplet} a répondu à votre commentaire`,
      message: extrait,
      lien: lien(await baseDe(parentAuteur), publicationId),
    });
  refresh();
  return succes("Commentaire publié.");
}

export async function supprimerCommentaire(id: string): Promise<EtatFormulaire> {
  const { u, l } = await lecteur();
  const c = await db.commentaire.findUnique({ where: { id }, include: { publication: true } });
  if (!c || c.supprimeLe) return echec("Commentaire introuvable.");
  // L'auteur du commentaire, l'auteur de la publication ou la modération.
  if (c.auteurId !== u.id && c.publication.auteurId !== u.id && !l.moderateur)
    return echec("Commentaire introuvable.");
  await db.commentaire.update({ where: { id }, data: { supprimeLe: new Date(), contenu: "" } });
  refresh();
  return succes("Commentaire supprimé.");
}

export async function basculerCommentaires(id: string): Promise<EtatFormulaire> {
  const { u } = await lecteur();
  const p = await db.publication.findUnique({ where: { id } });
  if (!p || p.auteurId !== u.id || p.supprimeLe) return echec("Publication introuvable.");
  await db.publication.update({
    where: { id },
    data: { commentairesFermes: !p.commentairesFermes },
  });
  refresh();
  return succes(p.commentairesFermes ? "Commentaires rouverts." : "Commentaires fermés.");
}

export async function basculerEpingle(id: string): Promise<EtatFormulaire> {
  const u = await exigerPermission("messagerie.moderer");
  const p = await db.publication.findUnique({ where: { id } });
  if (!p || p.supprimeLe || p.statut !== "PUBLIEE") return echec("Publication introuvable.");
  await db.publication.update({
    where: { id },
    data: { epingleLe: p.epingleLe ? null : new Date() },
  });
  await journaliser({
    auteurId: u.id,
    action: p.epingleLe ? "publication_desepinglee" : "publication_epinglee",
    entite: "Publication",
    entiteId: id,
  });
  refresh();
  return succes(
    p.epingleLe ? "Publication désépinglée." : "Publication épinglée en tête du Campus.",
  );
}

/** Signalement d'une publication ou d'un commentaire ; masquage automatique au-delà du seuil. */
export async function signalerContenu(
  type: "publication" | "commentaire",
  id: string,
  motif: string,
): Promise<EtatFormulaire> {
  const { u, l } = await lecteur();
  if (!(motif in MOTIFS_SIGNALEMENT)) return echec("Choisissez un motif.");
  let publicationId: string;
  let auteurId: string | null;
  if (type === "publication") {
    const p = await visible(id, l);
    if (!p) return echec("Publication introuvable.");
    publicationId = p.id;
    auteurId = p.auteurId;
  } else {
    const c = await db.commentaire.findUnique({ where: { id } });
    if (!c || !(await visible(c.publicationId, l))) return echec("Commentaire introuvable.");
    publicationId = c.publicationId;
    auteurId = c.auteurId;
  }
  if (auteurId === u.id) return echec("Vous ne pouvez pas signaler votre propre contenu.");
  const cible = `${type}:${id}`;
  const deja = await db.signalementCampus.findUnique({
    where: { cible_auteurId: { cible, auteurId: u.id } },
  });
  if (deja) return succes("Vous avez déjà signalé ce contenu. La modération l'examine.");
  await db.signalementCampus.create({
    data: {
      cible,
      auteurId: u.id,
      motif,
      ...(type === "publication" ? { publicationId } : { commentaireId: id }),
    },
  });
  const total = await db.signalementCampus.count({ where: { cible, traiteLe: null } });
  if (total >= SEUIL_MASQUAGE) {
    const maintenant = new Date();
    if (type === "publication")
      await db.publication.updateMany({
        where: { id, masqueLe: null },
        data: { masqueLe: maintenant },
      });
    else
      await db.commentaire.updateMany({
        where: { id, masqueLe: null },
        data: { masqueLe: maintenant },
      });
  }
  await journaliser({
    auteurId: u.id,
    action: "contenu_signale",
    entite: type === "publication" ? "Publication" : "Commentaire",
    entiteId: id,
    apres: { motif },
  });
  if (total === 1 || total === SEUIL_MASQUAGE)
    await notifier(await moderateurs(), {
      type: "MODERATION",
      titre:
        total >= SEUIL_MASQUAGE
          ? "Contenu du Campus masqué après plusieurs signalements"
          : "Contenu du Campus signalé",
      message: MOTIFS_SIGNALEMENT[motif as keyof typeof MOTIFS_SIGNALEMENT],
      lien: "/admin/messagerie/signalements#campus",
    });
  refresh();
  return succes("Merci : la modération va examiner ce contenu.");
}

/* ---------- Modération ---------- */

/** Décision sur un contenu signalé : le masquer, ou classer (et le rétablir s'il avait été masqué). */
export async function traiterSignalementCampus(
  cible: string,
  decision: "MASQUE" | "CLASSE",
): Promise<EtatFormulaire> {
  const u = await exigerPermission("messagerie.moderer");
  const [type, id] = cible.split(":", 2);
  if (!id || !(await db.signalementCampus.findFirst({ where: { cible } })))
    return echec("Aucun signalement pour ce contenu.");
  const masqueLe = decision === "MASQUE" ? new Date() : null;
  await db.$transaction([
    type === "publication"
      ? db.publication.update({ where: { id }, data: { masqueLe } })
      : db.commentaire.update({ where: { id }, data: { masqueLe } }),
    db.signalementCampus.updateMany({
      where: { cible, traiteLe: null },
      data: { traiteLe: new Date(), traiteParId: u.id, decision },
    }),
  ]);
  await journaliser({
    auteurId: u.id,
    action: decision === "MASQUE" ? "contenu_masque" : "signalement_classe",
    entite: type === "publication" ? "Publication" : "Commentaire",
    entiteId: id,
  });
  refresh();
  return succes(
    decision === "MASQUE" ? "Contenu masqué." : "Signalement classé ; contenu visible.",
  );
}

/** Validation préalable : publier ou refuser une publication en attente. */
export async function validerPublication(
  id: string,
  decision: "PUBLIEE" | "REFUSEE",
): Promise<EtatFormulaire> {
  const u = await exigerPermission("messagerie.moderer");
  const { count } = await db.publication.updateMany({
    where: { id, statut: "EN_ATTENTE" },
    data: { statut: decision, ...(decision === "PUBLIEE" ? { creeLe: new Date() } : {}) },
  });
  if (!count) return echec("Cette publication a déjà été traitée.");
  const p = await db.publication.findUniqueOrThrow({ where: { id } });
  await journaliser({
    auteurId: u.id,
    action: decision === "PUBLIEE" ? "publication_validee" : "publication_refusee",
    entite: "Publication",
    entiteId: id,
  });
  if (p.auteurId)
    await notifier([p.auteurId], {
      type: "CAMPUS",
      titre:
        decision === "PUBLIEE"
          ? "Votre publication est en ligne sur le Campus"
          : "Votre publication n'a pas été retenue",
      message: p.contenu.slice(0, 120),
      lien: lien(await baseDe(p.auteurId), id),
    });
  refresh();
  return succes(decision === "PUBLIEE" ? "Publication validée." : "Publication refusée.");
}

export async function enregistrerReglagesCampus(
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerPermission("messagerie.moderer");
  const regles = String(fd.get("regles") ?? "")
    .trim()
    .slice(0, 3000);
  if (regles.length < 20) return echec("Rédigez les règles du Campus (20 caractères au moins).");
  const valeur = { validationPrealable: fd.get("validationPrealable") === "on", regles };
  await db.reglage.upsert({
    where: { cle: CLE_REGLAGES_CAMPUS },
    update: { valeur },
    create: { cle: CLE_REGLAGES_CAMPUS, valeur },
  });
  await journaliser({
    auteurId: u.id,
    action: "reglages_campus",
    entite: "Reglage",
    entiteId: CLE_REGLAGES_CAMPUS,
    apres: valeur,
  });
  refresh();
  return succes("Réglages du Campus enregistrés.");
}
