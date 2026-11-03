"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { versDateBukavu } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { semestresDuNiveau } from "./regles";

const champ = (fd: FormData, cle: string) => String(fd.get(cle) ?? "").trim();

/* ---------- Années académiques ---------- */

export async function enregistrerAnnee(
  id: string | null,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const libelle = champ(fd, "libelle");
  if (
    !/^\d{4}-\d{4}$/.test(libelle) ||
    Number(libelle.slice(5)) !== Number(libelle.slice(0, 4)) + 1
  )
    return echec("Intitulé attendu : deux années consécutives, par exemple 2026-2027.");
  const debut = versDateBukavu(`${champ(fd, "debut")}T00:00`);
  const fin = versDateBukavu(`${champ(fd, "fin")}T23:59`);
  if (!debut || !fin || fin <= debut) return echec("Dates de début et de fin invalides.");
  const seuil = Number(champ(fd, "seuil").replace(",", ".") || "10");
  if (!(seuil >= 0 && seuil <= 20)) return echec("Le seuil de réussite est une note sur 20.");
  if (await db.anneeAcademique.findFirst({ where: { libelle, ...(id ? { NOT: { id } } : {}) } }))
    return echec("Cette année académique existe déjà.");
  const data = { libelle, debut, fin, seuilReussite: seuil };
  const a = id
    ? await db.anneeAcademique.update({ where: { id }, data })
    : await db.anneeAcademique.create({ data });
  await journaliser({
    auteurId: auteur.id,
    action: id ? "annee_modifiee" : "annee_creee",
    entite: "AnneeAcademique",
    entiteId: a.id,
    apres: { libelle },
  });
  refresh();
  return succes(`Année ${libelle} enregistrée.`);
}

export async function definirAnneeCourante(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  await db.$transaction([
    db.anneeAcademique.updateMany({ data: { courante: false } }),
    db.anneeAcademique.update({ where: { id }, data: { courante: true } }),
  ]);
  await journaliser({
    auteurId: auteur.id,
    action: "annee_courante",
    entite: "AnneeAcademique",
    entiteId: id,
  });
  refresh();
  return succes("Année courante modifiée.");
}

/** Crée les promotions manquantes de l'année : chaque filière ouverte, chaque niveau. */
export async function creerPromotions(anneeId: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const [filieres, niveaux] = await Promise.all([
    db.filiere.findMany({ where: { ouverte: true } }),
    db.niveau.findMany(),
  ]);
  const r = await db.promotion.createMany({
    data: filieres.flatMap((f) =>
      niveaux.map((n) => ({ filiereId: f.id, niveauId: n.id, anneeId })),
    ),
    skipDuplicates: true,
  });
  await journaliser({
    auteurId: auteur.id,
    action: "promotions_creees",
    entite: "Promotion",
    apres: { anneeId, nombre: r.count },
  });
  refresh();
  return succes(
    r.count ? `${r.count} promotion(s) créée(s).` : "Toutes les promotions existent déjà.",
  );
}

/* ---------- Programme : unités d'enseignement et cours ---------- */

const schemaUE = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,16}$/, "Code : lettres, chiffres et tirets (16 caractères au plus)."),
  intitule: z.string().trim().min(2, "Indiquez l'intitulé.").max(160),
  semestre: z.coerce.number().int().min(1).max(8),
  credits: z.coerce.number().int().min(1, "Crédits : au moins 1.").max(60),
});

export async function enregistrerUE(
  id: string | null,
  filiereId: string,
  niveauId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const r = schemaUE.safeParse({
    code: champ(fd, "code"),
    intitule: champ(fd, "intitule"),
    semestre: champ(fd, "semestre"),
    credits: champ(fd, "credits"),
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const niveau = await db.niveau.findUnique({ where: { id: niveauId } });
  if (!niveau) return echec("Niveau inconnu.");
  if (!semestresDuNiveau(niveau.ordre).includes(r.data.semestre))
    return echec(
      `En ${niveau.libelle}, le semestre est ${semestresDuNiveau(niveau.ordre).join(" ou ")}.`,
    );
  if (
    await db.uniteEnseignement.findFirst({
      where: { filiereId, code: r.data.code, ...(id ? { NOT: { id } } : {}) },
    })
  )
    return echec("Ce code est déjà utilisé dans la filière.");
  const ue = id
    ? await db.uniteEnseignement.update({ where: { id }, data: r.data })
    : await db.uniteEnseignement.create({ data: { ...r.data, filiereId, niveauId } });
  await journaliser({
    auteurId: auteur.id,
    action: id ? "ue_modifiee" : "ue_creee",
    entite: "UniteEnseignement",
    entiteId: ue.id,
    apres: r.data,
  });
  refresh();
  return succes(`Unité ${r.data.code} enregistrée.`);
}

export async function supprimerUE(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const offres = await db.coursOffert.count({ where: { cours: { ueId: id } } });
  if (offres > 0)
    return echec("Des cours de cette unité sont déjà donnés : suppression impossible.");
  await db.uniteEnseignement.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "ue_supprimee",
    entite: "UniteEnseignement",
    entiteId: id,
  });
  refresh();
  return succes("Unité supprimée.");
}

const schemaCours = z.object({
  intitule: z.string().trim().min(2, "Indiquez l'intitulé du cours.").max(160),
  credits: z.coerce.number().int().min(1).max(30),
  volumeHoraire: z.coerce.number().int().min(1, "Volume horaire : au moins 1 heure.").max(400),
});

export async function enregistrerCours(
  id: string | null,
  ueId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const r = schemaCours.safeParse({
    intitule: champ(fd, "intitule"),
    credits: champ(fd, "credits"),
    volumeHoraire: champ(fd, "volumeHoraire"),
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const c = id
    ? await db.cours.update({ where: { id }, data: r.data })
    : await db.cours.create({ data: { ...r.data, ueId } });
  await journaliser({
    auteurId: auteur.id,
    action: id ? "cours_modifie" : "cours_cree",
    entite: "Cours",
    entiteId: c.id,
    apres: r.data,
  });
  refresh();
  return succes("Cours enregistré.");
}

export async function supprimerCours(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  if ((await db.coursOffert.count({ where: { coursId: id } })) > 0)
    return echec("Ce cours est déjà donné à une promotion : suppression impossible.");
  await db.cours.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "cours_supprime",
    entite: "Cours",
    entiteId: id,
  });
  refresh();
  return succes("Cours supprimé.");
}

/* ---------- Cours donnés à une promotion ---------- */

/** Ouvre, pour la promotion, tous les cours du programme de sa filière et de son niveau. */
export async function ouvrirCoursPromotion(promotionId: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const p = await db.promotion.findUnique({ where: { id: promotionId } });
  if (!p) return echec("Promotion introuvable.");
  const cours = await db.cours.findMany({
    where: { ue: { filiereId: p.filiereId, niveauId: p.niveauId } },
    select: { id: true },
  });
  if (cours.length === 0)
    return echec(
      "Aucun cours au programme de cette filière et de ce niveau : complétez d'abord le programme.",
    );
  const r = await db.coursOffert.createMany({
    data: cours.map((c) => ({ coursId: c.id, promotionId })),
    skipDuplicates: true,
  });
  await journaliser({
    auteurId: auteur.id,
    action: "cours_ouverts",
    entite: "Promotion",
    entiteId: promotionId,
    apres: { nombre: r.count },
  });
  refresh();
  return succes(
    r.count ? `${r.count} cours ouvert(s) pour la promotion.` : "Tous les cours sont déjà ouverts.",
  );
}

export async function affecterEnseignant(
  coursOffertId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const enseignantId = champ(fd, "enseignantId");
  if (!enseignantId) return echec("Choisissez un enseignant.");
  const titulaire = fd.get("titulaire") !== "assistant";
  await db.coursEnseignant.upsert({
    where: { coursOffertId_enseignantId: { coursOffertId, enseignantId } },
    update: { titulaire },
    create: { coursOffertId, enseignantId, titulaire },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "enseignant_affecte",
    entite: "CoursOffert",
    entiteId: coursOffertId,
    apres: { enseignantId, titulaire },
  });
  refresh();
  return succes("Enseignant affecté.");
}

export async function retirerEnseignant(
  coursOffertId: string,
  enseignantId: string,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  await db.coursEnseignant.delete({
    where: { coursOffertId_enseignantId: { coursOffertId, enseignantId } },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "enseignant_retire",
    entite: "CoursOffert",
    entiteId: coursOffertId,
    avant: { enseignantId },
  });
  refresh();
  return succes("Enseignant retiré du cours.");
}

/* ---------- Enseignants ---------- */

export async function enregistrerProfilEnseignant(
  utilisateurId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.structure");
  const titre = champ(fd, "titre").slice(0, 40) || null;
  const domaine = champ(fd, "domaine").slice(0, 160) || null;
  await db.profilEnseignant.upsert({
    where: { utilisateurId },
    update: { titre, domaine },
    create: { utilisateurId, titre, domaine },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "enseignant_modifie",
    entite: "ProfilEnseignant",
    entiteId: utilisateurId,
    apres: { titre, domaine },
  });
  refresh();
  return succes("Profil enregistré.");
}
