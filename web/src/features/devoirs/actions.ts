"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formatJour, formatHeure, versDateBukavu } from "@/features/actualites/dates";
import { exigerConnexion } from "@/features/auth/acces";
import { etudiantsDuCours, peutGererCours } from "@/features/notes/acces";
import { lireNote } from "@/features/notes/regles";
import { compteEtudiant, notifier } from "@/features/notifications/emettre";
import { TAILLE_MAX_SUPPORT, TYPES_SUPPORTS } from "@/features/supports/regles";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { etudiantDuCours } from "./acces";
import {
  depotOuvert,
  estEnRetard,
  signatureValide,
  TAILLE_MAX_REMISE,
  TYPES_REMISE,
} from "./regles";

const schemaDevoir = z.object({
  titre: z.string().trim().min(3, "Indiquez le titre du devoir.").max(160),
  consignes: z.string().trim().min(10, "Les consignes sont trop courtes.").max(5000),
  echeance: z.string(),
});

/** Lit un fichier téléversé et vérifie son type réel ; renvoie null s'il est absent. */
async function lireFichier(
  f: FormDataEntryValue | null,
  types: Record<string, string>,
  tailleMax: number,
) {
  if (!(f instanceof File) || f.size === 0) return null;
  const extension = types[f.type];
  if (!extension) return { erreur: "Format de fichier non accepté." };
  if (f.size > tailleMax) return { erreur: "Fichier trop lourd (4 Mo au plus)." };
  const contenu = Buffer.from(await f.arrayBuffer());
  if (!signatureValide(extension, contenu.subarray(0, 8)))
    return { erreur: "Le contenu du fichier ne correspond pas à son format." };
  return { contenu, extension, type: f.type, nom: f.name.slice(0, 120) };
}

export async function creerDevoir(
  coursOffertId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/enseignant");
  if (!(await peutGererCours(u, coursOffertId))) return echec("Ce cours ne vous est pas confié.");
  const r = schemaDevoir.safeParse({
    titre: fd.get("titre") ?? "",
    consignes: fd.get("consignes") ?? "",
    echeance: fd.get("echeance") ?? "",
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const echeance = versDateBukavu(r.data.echeance);
  if (!echeance) return echec("Indiquez la date et l'heure limites.");
  if (echeance <= new Date()) return echec("L'échéance doit être dans le futur.");

  const fichier = await lireFichier(fd.get("enonce"), TYPES_SUPPORTS, TAILLE_MAX_SUPPORT);
  if (fichier && "erreur" in fichier) return echec(fichier.erreur!);
  const devoir = await db.devoir.create({
    data: {
      coursOffertId,
      titre: r.data.titre,
      consignes: r.data.consignes,
      echeance,
      accepteRetard: fd.get("accepteRetard") === "on",
      creeParId: u.id,
    },
  });
  if (fichier) {
    const cle = `prive/devoirs/${devoir.id}/enonce-${jetonAleatoire(6).toLowerCase()}.${fichier.extension}`;
    await stockage().enregistrer(cle, fichier.contenu, fichier.type);
    const media = await db.media.create({
      data: {
        cle,
        nomFichier: fichier.nom,
        typeMime: fichier.type,
        taille: fichier.contenu.length,
        dossier: "devoirs",
        creeParId: u.id,
      },
    });
    await db.devoir.update({ where: { id: devoir.id }, data: { enonceId: media.id } });
  }
  await journaliser({
    auteurId: u.id,
    action: "devoir_cree",
    entite: "Devoir",
    entiteId: devoir.id,
    apres: { titre: devoir.titre },
  });
  const co = await db.coursOffert.findUnique({
    where: { id: coursOffertId },
    include: { cours: { select: { intitule: true } } },
  });
  await notifier(
    (await etudiantsDuCours(coursOffertId)).map((e) => e.utilisateurId),
    {
      type: "DEVOIR",
      titre: `Nouveau devoir : ${devoir.titre}`,
      message: `${co?.cours.intitule ?? "Cours"} — à rendre au plus tard le ${formatJour.format(echeance)} à ${formatHeure.format(echeance)}.`,
      lien: `/etudiant/cours/${coursOffertId}/devoirs/${devoir.id}`,
    },
  );
  redirect(`/enseignant/cours/${coursOffertId}/devoirs/${devoir.id}`);
}

export async function supprimerDevoir(id: string): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/enseignant");
  const d = await db.devoir.findUnique({
    where: { id },
    include: { enonce: true, _count: { select: { remises: true } } },
  });
  if (!d) return echec("Devoir introuvable.");
  if (!(await peutGererCours(u, d.coursOffertId))) return echec("Ce cours ne vous est pas confié.");
  if (d._count.remises > 0)
    return echec("Des copies ont déjà été déposées : ce devoir ne peut plus être supprimé.");
  await db.devoir.delete({ where: { id } });
  if (d.enonce) {
    await db.media.delete({ where: { id: d.enonce.id } }).catch(() => undefined);
    await stockage()
      .supprimer(d.enonce.cle)
      .catch(() => undefined);
  }
  await journaliser({ auteurId: u.id, action: "devoir_supprime", entite: "Devoir", entiteId: id });
  redirect(`/enseignant/cours/${d.coursOffertId}/devoirs`);
}

export async function deposerRemise(
  devoirId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/etudiant");
  const devoir = await db.devoir.findUnique({ where: { id: devoirId } });
  if (!devoir) return echec("Devoir introuvable.");
  const etudiantId = await etudiantDuCours(u, devoir.coursOffertId);
  if (!etudiantId) return echec("Ce devoir ne vous concerne pas.");
  const ancienne = await db.remise.findUnique({
    where: { devoirId_etudiantId: { devoirId, etudiantId } },
    include: { fichier: true },
  });
  const maintenant = new Date();
  if (!depotOuvert(devoir, ancienne, maintenant))
    return echec(
      ancienne?.corrigeLe
        ? "Votre copie est déjà corrigée."
        : "L'échéance est dépassée : le dépôt est fermé.",
    );
  const fichier = await lireFichier(fd.get("copie"), TYPES_REMISE, TAILLE_MAX_REMISE);
  if (!fichier) return echec("Choisissez votre copie (PDF, photo ou Word).");
  if ("erreur" in fichier) return echec(fichier.erreur!);
  const commentaire =
    String(fd.get("commentaire") ?? "")
      .trim()
      .slice(0, 500) || null;

  const cle = `prive/devoirs/${devoirId}/${etudiantId}-${jetonAleatoire(6).toLowerCase()}.${fichier.extension}`;
  await stockage().enregistrer(cle, fichier.contenu, fichier.type);
  const media = await db.media.create({
    data: {
      cle,
      nomFichier: fichier.nom,
      typeMime: fichier.type,
      taille: fichier.contenu.length,
      dossier: "devoirs",
      creeParId: u.id,
    },
  });
  const donnees = {
    fichierId: media.id,
    commentaire,
    deposeLe: maintenant,
    enRetard: estEnRetard(devoir.echeance, maintenant),
  };
  await db.remise.upsert({
    where: { devoirId_etudiantId: { devoirId, etudiantId } },
    update: donnees,
    create: { ...donnees, devoirId, etudiantId },
  });
  // L'ancienne copie remplacée est effacée.
  if (ancienne) {
    await db.media.delete({ where: { id: ancienne.fichierId } }).catch(() => undefined);
    await stockage()
      .supprimer(ancienne.fichier.cle)
      .catch(() => undefined);
  }
  await journaliser({
    auteurId: u.id,
    action: ancienne ? "copie_remplacee" : "copie_deposee",
    entite: "Devoir",
    entiteId: devoirId,
  });
  refresh();
  return succes(
    donnees.enRetard
      ? "Copie déposée, en retard sur l'échéance."
      : ancienne
        ? "Copie remplacée."
        : "Copie déposée. Vous pouvez la remplacer jusqu'à l'échéance.",
  );
}

export async function corrigerRemise(
  remiseId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/enseignant");
  const remise = await db.remise.findUnique({
    where: { id: remiseId },
    include: { devoir: true },
  });
  if (!remise) return echec("Copie introuvable.");
  if (!(await peutGererCours(u, remise.devoir.coursOffertId)))
    return echec("Ce cours ne vous est pas confié.");
  const note = lireNote(String(fd.get("note") ?? ""));
  if (note === "invalide") return echec("Note invalide (0 à 20).");
  const appreciation =
    String(fd.get("appreciation") ?? "")
      .trim()
      .slice(0, 1000) || null;
  if (note === null && !appreciation) return echec("Indiquez une note ou une appréciation.");
  const premiere = !remise.corrigeLe;
  await db.remise.update({
    where: { id: remiseId },
    data: { note, appreciation, corrigeLe: new Date() },
  });
  await journaliser({
    auteurId: u.id,
    action: "copie_corrigee",
    entite: "Remise",
    entiteId: remiseId,
    apres: { note },
  });
  await notifier(await compteEtudiant(remise.etudiantId), {
    type: "DEVOIR",
    titre: premiere
      ? `Devoir corrigé : ${remise.devoir.titre}`
      : `Correction mise à jour : ${remise.devoir.titre}`,
    message: note !== null ? `Note : ${note}/20.` : "Une appréciation vous attend.",
    lien: `/etudiant/cours/${remise.devoir.coursOffertId}/devoirs/${remise.devoirId}`,
  });
  refresh();
  return succes("Correction enregistrée ; l'étudiant est prévenu.");
}
