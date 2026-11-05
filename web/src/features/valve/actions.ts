"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import { versDateBukavu } from "@/features/actualites/dates";
import { TAILLE_MAX_PIECE, TYPES_PIECES } from "@/features/admissions/fichiers";
import { exigerConnexion } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { ROLES_PERSONNEL } from "@/lib/permissions";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { notifier, personnelAvecPermission } from "@/features/notifications/emettre";
import { auteurValve, comptesDestinataires, contexteEtudiant } from "./donnees";
import {
  type Cible,
  ciblesAutorisees,
  concerne,
  ETIQUETTE_VALVE,
  exigeValidation,
  peutViserCours,
} from "./regles";

const schema = z.object({
  titre: z.string().trim().min(3, "Indiquez un titre.").max(160),
  contenu: z.string().trim().min(10, "Le texte est trop court.").max(10000),
  cible: z.enum(["PUBLIC", "INSTITUT", "FILIERE", "PROMOTION", "COURS"]),
  filiereId: z.string(),
  promotionId: z.string(),
  coursOffertId: z.string(),
  expireLe: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
});

/** Vérifie qu'un utilisateur peut publier sur la valve, et pour quelles cibles. */
async function auteurAutorise() {
  const u = await exigerConnexion("/admin/valve");
  const auteur = await auteurValve(u);
  if (ciblesAutorisees(auteur).length === 0) redirect("/acces-refuse");
  return { u, auteur };
}

/** Le communiqué appartient-il à l'auteur, ou l'auteur peut-il le gérer ? */
async function communiqueGerable(id: string) {
  const { u, auteur } = await auteurAutorise();
  const c = await db.communique.findUnique({ where: { id } });
  if (!c) return { erreur: echec("Ce communiqué n'existe plus.") };
  const gerable =
    c.auteurId === u.id ||
    u.permissions.has("valve.valider") ||
    (c.cible !== "PUBLIC" && c.cible !== "INSTITUT" && u.permissions.has("valve.publier"));
  if (!gerable) return { erreur: echec("Vous ne pouvez pas modifier ce communiqué.") };
  return { u, auteur, c };
}

type CommuniqueNotifiable = {
  id: string;
  titre: string;
  cible: string;
  filiereId: string | null;
  promotionId: string | null;
  coursOffertId: string | null;
};

/** Prévient les étudiants concernés qu'un communiqué vient d'être publié. */
async function annoncerPublication(c: CommuniqueNotifiable) {
  await notifier(await comptesDestinataires(c), {
    type: "COMMUNIQUE",
    titre: "Nouveau communiqué à la valve",
    message: c.titre,
    lien: `/etudiant/valve/${c.id}`,
  });
}

/** Prévient les autorités qu'un communiqué attend leur validation. */
async function demanderValidation(c: CommuniqueNotifiable, auteurId: string) {
  await notifier(
    (await personnelAvecPermission("valve.valider")).filter((id) => id !== auteurId),
    {
      type: "COMMUNIQUE_A_VALIDER",
      titre: "Communiqué à valider",
      message: c.titre,
      lien: `/admin/valve/${c.id}`,
    },
  );
}

export async function enregistrerCommunique(
  id: string | null,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const { u, auteur } = await auteurAutorise();
  const r = schema.safeParse({
    titre: fd.get("titre") ?? "",
    contenu: fd.get("contenu") ?? "",
    cible: fd.get("cible") ?? "",
    filiereId: fd.get("filiereId") ?? "",
    promotionId: fd.get("promotionId") ?? "",
    coursOffertId: fd.get("coursOffertId") ?? "",
    expireLe: fd.get("expireLe") ?? "",
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const d = r.data;
  const cible = d.cible as Cible;
  if (!ciblesAutorisees(auteur).includes(cible))
    return echec("Vous ne pouvez pas viser ce public.");
  if (cible === "FILIERE" && !d.filiereId) return echec("Choisissez la filière.");
  if (cible === "PROMOTION" && !d.promotionId) return echec("Choisissez la promotion.");
  if (cible === "COURS" && (!d.coursOffertId || !peutViserCours(auteur, d.coursOffertId)))
    return echec("Choisissez un de vos cours.");
  const expireLe = d.expireLe ? versDateBukavu(`${d.expireLe}T23:59`) : null;

  const publier = fd.get("intention") === "publier";
  const statut = publier
    ? exigeValidation(cible, auteur)
      ? "EN_VALIDATION"
      : "PUBLIE"
    : "BROUILLON";
  const donnees = {
    titre: d.titre,
    contenu: d.contenu,
    cible,
    filiereId: cible === "FILIERE" ? d.filiereId : null,
    promotionId: cible === "PROMOTION" ? d.promotionId : null,
    coursOffertId: cible === "COURS" ? d.coursOffertId : null,
    expireLe,
    epingle: fd.get("epingle") === "on",
    statut: statut as "BROUILLON" | "EN_VALIDATION" | "PUBLIE",
    ...(statut === "PUBLIE" ? { publieLe: new Date(), validateurId: u.id } : {}),
  };

  if (id) {
    const { erreur, c } = await communiqueGerable(id);
    if (erreur) return erreur;
    const maj = await db.communique.update({
      where: { id },
      data: {
        ...donnees,
        // Un communiqué déjà publié garde sa date de publication.
        ...(c.publieLe && statut === "PUBLIE" ? { publieLe: c.publieLe } : {}),
      },
    });
    // On ne prévient qu'au passage à l'état publié ou « à valider », pas à chaque retouche.
    if (statut === "PUBLIE" && c.statut !== "PUBLIE") await annoncerPublication(maj);
    if (statut === "EN_VALIDATION" && c.statut !== "EN_VALIDATION")
      await demanderValidation(maj, u.id);
    await journaliser({
      auteurId: u.id,
      action: "communique_modifie",
      entite: "Communique",
      entiteId: id,
    });
    updateTag(ETIQUETTE_VALVE);
    refresh();
    return succes(
      statut === "PUBLIE"
        ? "Communiqué publié."
        : statut === "EN_VALIDATION"
          ? "Communiqué transmis pour validation."
          : "Brouillon enregistré.",
    );
  }
  const cree = await db.communique.create({ data: { ...donnees, auteurId: u.id } });
  if (statut === "PUBLIE") await annoncerPublication(cree);
  if (statut === "EN_VALIDATION") await demanderValidation(cree, u.id);
  await journaliser({
    auteurId: u.id,
    action: statut === "PUBLIE" ? "communique_publie" : "communique_cree",
    entite: "Communique",
    entiteId: cree.id,
    apres: { titre: d.titre, cible },
  });
  updateTag(ETIQUETTE_VALVE);
  redirect(
    `${fd.get("retour") === "enseignant" ? "/enseignant/valve" : "/admin/valve"}/${cree.id}?enregistre=1`,
  );
}

export async function validerCommunique(id: string): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/admin/valve");
  if (!u.permissions.has("valve.valider")) return echec("Validation réservée aux autorités.");
  const c = await db.communique.findUnique({ where: { id }, select: { statut: true } });
  if (!c) return echec("Ce communiqué n'existe plus.");
  if (c.statut !== "EN_VALIDATION")
    return echec("Seul un communiqué transmis pour validation peut être validé.");
  const publie = await db.communique.update({
    where: { id },
    data: { statut: "PUBLIE", publieLe: new Date(), validateurId: u.id },
  });
  await annoncerPublication(publie);
  if (publie.auteurId !== u.id) {
    const auteurPersonnel = await db.utilisateurRole.findFirst({
      where: { utilisateurId: publie.auteurId, role: { code: { in: ROLES_PERSONNEL } } },
    });
    await notifier([publie.auteurId], {
      type: "COMMUNIQUE",
      titre: "Votre communiqué est publié",
      message: publie.titre,
      lien: `${auteurPersonnel ? "/admin/valve" : "/enseignant/valve"}/${publie.id}`,
    });
  }
  await journaliser({
    auteurId: u.id,
    action: "communique_valide",
    entite: "Communique",
    entiteId: id,
  });
  updateTag(ETIQUETTE_VALVE);
  refresh();
  return succes("Communiqué validé et publié.");
}

export async function archiverCommunique(id: string): Promise<EtatFormulaire> {
  const { u, erreur } = await communiqueGerable(id);
  if (erreur) return erreur;
  await db.communique.update({ where: { id }, data: { statut: "ARCHIVE", epingle: false } });
  await journaliser({
    auteurId: u.id,
    action: "communique_archive",
    entite: "Communique",
    entiteId: id,
  });
  updateTag(ETIQUETTE_VALVE);
  refresh();
  return succes("Communiqué retiré de la valve.");
}

export async function supprimerCommunique(
  id: string,
  retour: "admin" | "enseignant" = "admin",
): Promise<EtatFormulaire> {
  const { u, c, erreur } = await communiqueGerable(id);
  if (erreur) return erreur;
  if (c.statut === "PUBLIE") return echec("Retirez d'abord le communiqué de la valve.");
  const pieces = await db.pieceJointe.findMany({
    where: { communiqueId: id },
    include: { media: true },
  });
  await db.communique.delete({ where: { id } });
  for (const p of pieces) {
    await db.media.delete({ where: { id: p.mediaId } }).catch(() => undefined);
    await stockage()
      .supprimer(p.media.cle)
      .catch(() => undefined);
  }
  await journaliser({
    auteurId: u.id,
    action: "communique_supprime",
    entite: "Communique",
    entiteId: id,
  });
  redirect(retour === "enseignant" ? "/enseignant/valve" : "/admin/valve");
}

/* ---------- Pièces jointes ---------- */

export async function joindreFichier(
  communiqueId: string,
  fd: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { u, auteur, c, erreur } = await communiqueGerable(communiqueId);
  if (erreur) return { ok: false, message: erreur.message ?? "Action impossible." };
  // Un communiqué publié après validation ne change pas sans repasser par le validateur.
  if (c.statut === "PUBLIE" && exigeValidation(c.cible as Cible, auteur))
    return {
      ok: false,
      message:
        "Ce communiqué a été validé avant publication : renvoyez-le en validation pour y joindre un fichier.",
    };
  const fichier = fd.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0)
    return { ok: false, message: "Aucun fichier." };
  if (!TYPES_PIECES.includes(fichier.type))
    return { ok: false, message: "Formats acceptés : PDF ou image." };
  if (fichier.size > TAILLE_MAX_PIECE)
    return { ok: false, message: "Fichier trop lourd (4 Mo au plus)." };
  if ((await db.pieceJointe.count({ where: { communiqueId } })) >= 5)
    return { ok: false, message: "Cinq pièces jointes au plus." };

  let contenu = Buffer.from(await fichier.arrayBuffer());
  let typeMime = fichier.type;
  let extension = "pdf";
  if (fichier.type === "application/pdf") {
    if (contenu.subarray(0, 5).toString() !== "%PDF-")
      return { ok: false, message: "Ce fichier n'est pas un PDF valide." };
  } else {
    contenu = await sharp(contenu, { limitInputPixels: 60e6 })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    typeMime = "image/webp";
    extension = "webp";
  }
  const nom = fichier.name.replace(/\.[^.]+$/, "").slice(0, 100) || "piece-jointe";
  const cle = `prive/valve/${communiqueId}/${jetonAleatoire(6).toLowerCase()}.${extension}`;
  await stockage().enregistrer(cle, contenu, typeMime);
  const media = await db.media.create({
    data: {
      cle,
      nomFichier: `${nom}.${extension}`,
      typeMime,
      taille: contenu.length,
      dossier: "valve",
      texteAlternatif: nom,
      creeParId: u.id,
    },
  });
  await db.pieceJointe.create({ data: { communiqueId, mediaId: media.id } });
  refresh();
  return { ok: true };
}

export async function retirerFichier(pieceId: string): Promise<EtatFormulaire> {
  const p = await db.pieceJointe.findUnique({ where: { id: pieceId }, include: { media: true } });
  if (!p) return echec("Pièce introuvable.");
  const { auteur, c, erreur } = await communiqueGerable(p.communiqueId);
  if (erreur) return erreur;
  if (c.statut === "PUBLIE" && exigeValidation(c.cible as Cible, auteur))
    return echec(
      "Ce communiqué a été validé avant publication : renvoyez-le en validation pour modifier ses pièces jointes.",
    );
  await db.pieceJointe.delete({ where: { id: pieceId } });
  await db.media.delete({ where: { id: p.mediaId } }).catch(() => undefined);
  await stockage()
    .supprimer(p.media.cle)
    .catch(() => undefined);
  refresh();
  return succes("Pièce jointe retirée.");
}

/* ---------- Lecture ---------- */

/** Accusé de lecture, enregistré quand un étudiant ouvre un communiqué qui le concerne. */
export async function marquerLu(communiqueId: string) {
  const u = await exigerConnexion("/etudiant");
  const c = await db.communique.findUnique({ where: { id: communiqueId } });
  if (!c || c.statut !== "PUBLIE") return;
  if (!concerne(c, await contexteEtudiant(u.id))) return;
  await db.lecture.upsert({
    where: { communiqueId_utilisateurId: { communiqueId, utilisateurId: u.id } },
    update: {},
    create: { communiqueId, utilisateurId: u.id },
  });
}
