"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { notifier } from "@/features/notifications/emettre";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { formatJour, formatHeure } from "@/features/actualites/dates";
import { planningDeLaSession } from "./requetes";
import { conflits, instantBukavu, verifierEpreuve } from "./regles";

const PERMISSION = "academique.horaires" as const;

/* ---------- Sessions ---------- */

const schemaSession = z.object({
  libelle: z.string().trim().min(3, "Indiquez l'intitulé de la session.").max(120),
  type: z.enum(["ORDINAIRE", "RATTRAPAGE"]),
  debut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide."),
  fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide."),
  consignes: z.string().trim().max(3000),
});

function lireSession(fd: FormData) {
  const r = schemaSession.safeParse({
    libelle: fd.get("libelle") ?? "",
    type: fd.get("type") ?? "ORDINAIRE",
    debut: fd.get("debut") ?? "",
    fin: fd.get("fin") ?? "",
    consignes: fd.get("consignes") ?? "",
  });
  if (!r.success) return { erreur: echec(r.error.issues[0]?.message ?? "Valeurs invalides.") };
  const debut = instantBukavu(r.data.debut, "00:00");
  const fin = instantBukavu(r.data.fin, "00:00");
  if (!debut || !fin) return { erreur: echec("Dates invalides.") };
  if (fin < debut) return { erreur: echec("La session doit se terminer après son début.") };
  if (fin.getTime() - debut.getTime() > 92 * 86_400_000)
    return { erreur: echec("Une session ne peut pas dépasser trois mois.") };
  return { donnees: { ...r.data, debut, fin, consignes: r.data.consignes || null } };
}

export async function creerSession(_etat: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) return echec("Aucune année académique courante.");
  const { donnees, erreur } = lireSession(fd);
  if (erreur) return erreur;
  const s = await db.sessionExamen.create({ data: { ...donnees, anneeId: annee.id } });
  await journaliser({
    auteurId: auteur.id,
    action: "session_examen_creee",
    entite: "SessionExamen",
    entiteId: s.id,
    apres: { libelle: s.libelle },
  });
  redirect(`/admin/examens/${s.id}`);
}

export async function modifierSession(
  id: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const { donnees, erreur } = lireSession(fd);
  if (erreur) return erreur;
  const s = await db.sessionExamen.findUnique({ where: { id }, include: { epreuves: true } });
  if (!s) return echec("Cette session n'existe plus.");
  const hors = s.epreuves.filter(
    (e) => e.debut < donnees.debut || e.debut >= new Date(donnees.fin.getTime() + 86_400_000),
  );
  if (hors.length > 0)
    return echec(`${hors.length} épreuve(s) tomberaient en dehors des nouvelles dates.`);
  await db.sessionExamen.update({ where: { id }, data: donnees });
  await journaliser({
    auteurId: auteur.id,
    action: "session_examen_modifiee",
    entite: "SessionExamen",
    entiteId: id,
  });
  refresh();
  return succes("Session enregistrée.");
}

export async function supprimerSession(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const s = await db.sessionExamen.findUnique({ where: { id } });
  if (!s) return echec("Cette session n'existe plus.");
  if (s.statut === "PUBLIEE") return echec("Retirez d'abord la publication.");
  await db.sessionExamen.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "session_examen_supprimee",
    entite: "SessionExamen",
    entiteId: id,
    avant: { libelle: s.libelle },
  });
  redirect("/admin/examens");
}

/* ---------- Destinataires ---------- */

/** Étudiants inscrits dans les promotions, enseignants des cours et surveillants. */
async function destinataires(epreuveIds: string[]) {
  const epreuves = await db.epreuve.findMany({
    where: { id: { in: epreuveIds } },
    include: {
      coursOffert: {
        include: {
          enseignants: { include: { enseignant: true } },
          promotion: { include: { inscriptions: { include: { etudiant: true } } } },
        },
      },
      surveillants: { include: { enseignant: true } },
    },
  });
  const etudiants = new Set<string>();
  const personnel = new Set<string>();
  for (const e of epreuves) {
    for (const i of e.coursOffert.promotion.inscriptions)
      if (i.statut !== "ABANDON") etudiants.add(i.etudiant.utilisateurId);
    for (const c of e.coursOffert.enseignants) personnel.add(c.enseignant.utilisateurId);
    for (const s of e.surveillants) personnel.add(s.enseignant.utilisateurId);
  }
  return { etudiants, personnel };
}

/* ---------- Épreuves ---------- */

const schemaEpreuve = z.object({
  coursOffertId: z.string().min(1, "Choisissez le cours."),
  jour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indiquez le jour."),
  debut: z.string().regex(/^\d{2}:\d{2}$/, "Heure de début invalide."),
  fin: z.string().regex(/^\d{2}:\d{2}$/, "Heure de fin invalide."),
  salle: z.string().trim().max(60),
  modalite: z.enum(["ECRIT", "ORAL", "PRATIQUE"]),
  remarque: z.string().trim().max(300),
});

async function lireEpreuve(sessionId: string, fd: FormData) {
  const r = schemaEpreuve.safeParse({
    coursOffertId: fd.get("coursOffertId") ?? "",
    jour: fd.get("jour") ?? "",
    debut: fd.get("debut") ?? "",
    fin: fd.get("fin") ?? "",
    salle: fd.get("salle") ?? "",
    modalite: fd.get("modalite") ?? "ECRIT",
    remarque: fd.get("remarque") ?? "",
  });
  if (!r.success) return { erreur: echec(r.error.issues[0]?.message ?? "Valeurs invalides.") };
  const session = await db.sessionExamen.findUnique({ where: { id: sessionId } });
  if (!session) return { erreur: echec("Cette session n'existe plus.") };
  const probleme = verifierEpreuve(r.data, session);
  if (probleme) return { erreur: echec(probleme) };
  // Le cours doit appartenir à une promotion de l'année de la session.
  const cours = await db.coursOffert.findUnique({
    where: { id: r.data.coursOffertId },
    include: { promotion: true },
  });
  if (!cours || cours.promotion.anneeId !== session.anneeId)
    return { erreur: echec("Ce cours n'est pas programmé pour l'année de la session.") };
  const ids = [...new Set(fd.getAll("surveillants").map(String))].slice(0, 6);
  const surveillants = ids.length
    ? await db.profilEnseignant.findMany({ where: { id: { in: ids } }, select: { id: true } })
    : [];
  if (surveillants.length !== ids.length) return { erreur: echec("Surveillant inconnu.") };
  return {
    session,
    donnees: {
      coursOffertId: r.data.coursOffertId,
      debut: instantBukavu(r.data.jour, r.data.debut)!,
      fin: instantBukavu(r.data.jour, r.data.fin)!,
      salle: r.data.salle || null,
      modalite: r.data.modalite,
      remarque: r.data.remarque || null,
    },
    surveillants: surveillants.map((s) => s.id),
  };
}

async function prevenirModification(epreuveIds: string[], titre: string, message: string) {
  const { etudiants, personnel } = await destinataires(epreuveIds);
  await notifier(etudiants, { type: "EXAMEN", titre, message, lien: "/etudiant/examens" });
  await notifier(personnel, { type: "EXAMEN", titre, message, lien: "/enseignant/examens" });
}

const decrire = (e: { debut: Date; fin: Date; salle: string | null }) =>
  `${formatJour.format(e.debut)}, ${formatHeure.format(e.debut)}–${formatHeure.format(e.fin)}${e.salle ? `, salle ${e.salle}` : ""}`;

export async function ajouterEpreuve(
  sessionId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const { session, donnees, surveillants, erreur } = await lireEpreuve(sessionId, fd);
  if (erreur) return erreur;
  const e = await db.epreuve.create({
    data: {
      ...donnees,
      sessionId,
      surveillants: { create: surveillants.map((enseignantId) => ({ enseignantId })) },
    },
    include: { coursOffert: { include: { cours: true } } },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "epreuve_ajoutee",
    entite: "Epreuve",
    entiteId: e.id,
    apres: { sessionId, coursOffertId: e.coursOffertId, debut: e.debut, salle: e.salle },
  });
  if (session.statut === "PUBLIEE")
    await prevenirModification(
      [e.id],
      "Nouvelle épreuve au calendrier des examens",
      `${e.coursOffert.cours.intitule} : ${decrire(e)}.`,
    );
  refresh();
  return succes("Épreuve ajoutée.");
}

export async function modifierEpreuve(
  id: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const existante = await db.epreuve.findUnique({ where: { id } });
  if (!existante) return echec("Cette épreuve n'existe plus.");
  const { session, donnees, surveillants, erreur } = await lireEpreuve(existante.sessionId, fd);
  if (erreur) return erreur;
  const e = await db.epreuve.update({
    where: { id },
    data: {
      ...donnees,
      surveillants: {
        deleteMany: {},
        create: surveillants.map((enseignantId) => ({ enseignantId })),
      },
    },
    include: { coursOffert: { include: { cours: true } } },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "epreuve_modifiee",
    entite: "Epreuve",
    entiteId: id,
    avant: { debut: existante.debut, salle: existante.salle },
    apres: { debut: e.debut, salle: e.salle },
  });
  const changement =
    existante.debut.getTime() !== e.debut.getTime() ||
    existante.fin.getTime() !== e.fin.getTime() ||
    existante.salle !== e.salle;
  if (session.statut === "PUBLIEE" && changement)
    await prevenirModification(
      [id],
      "Épreuve modifiée",
      `${e.coursOffert.cours.intitule} : désormais le ${decrire(e)}.`,
    );
  refresh();
  return succes("Épreuve modifiée.");
}

export async function supprimerEpreuve(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const e = await db.epreuve.findUnique({
    where: { id },
    include: { session: true, coursOffert: { include: { cours: true } } },
  });
  if (!e) return echec("Cette épreuve n'existe plus.");
  // Les destinataires sont calculés avant la suppression.
  if (e.session.statut === "PUBLIEE")
    await prevenirModification(
      [id],
      "Épreuve retirée du calendrier",
      `${e.coursOffert.cours.intitule} (${decrire(e)}) est retirée du calendrier des examens.`,
    );
  await db.epreuve.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "epreuve_supprimee",
    entite: "Epreuve",
    entiteId: id,
    avant: { coursOffertId: e.coursOffertId, debut: e.debut },
  });
  refresh();
  return succes("Épreuve supprimée.");
}

/* ---------- Publication ---------- */

export async function publierSession(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const s = await db.sessionExamen.findUnique({ where: { id } });
  if (!s) return echec("Cette session n'existe plus.");
  if (s.statut === "PUBLIEE") return echec("La session est déjà publiée.");
  const planning = await planningDeLaSession(id);
  if (planning.length === 0) return echec("Ajoutez au moins une épreuve avant de publier.");
  const c = conflits(planning);
  if (c.length > 0)
    return echec(`Publication impossible : ${c.length} conflit(s) à résoudre (voir la liste).`);
  await db.sessionExamen.update({
    where: { id },
    data: { statut: "PUBLIEE", publieeLe: new Date() },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "session_examen_publiee",
    entite: "SessionExamen",
    entiteId: id,
    apres: { epreuves: planning.length },
  });
  const { etudiants, personnel } = await destinataires(planning.map((e) => e.id));
  const message = `${s.libelle} : du ${formatJour.format(s.debut)} au ${formatJour.format(s.fin)}. Consultez vos épreuves, heures et salles.`;
  await notifier(etudiants, {
    type: "EXAMEN",
    titre: "Calendrier des examens publié",
    message,
    lien: "/etudiant/examens",
  });
  await notifier(personnel, {
    type: "EXAMEN",
    titre: "Calendrier des examens publié",
    message,
    lien: "/enseignant/examens",
  });
  refresh();
  return succes(
    `Calendrier publié : ${etudiants.size} étudiant(s) et ${personnel.size} enseignant(s) prévenus.`,
  );
}

export async function retirerPublication(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const s = await db.sessionExamen.findUnique({ where: { id } });
  if (!s || s.statut !== "PUBLIEE") return echec("Cette session n'est pas publiée.");
  await db.sessionExamen.update({ where: { id }, data: { statut: "BROUILLON", publieeLe: null } });
  await journaliser({
    auteurId: auteur.id,
    action: "session_examen_retiree",
    entite: "SessionExamen",
    entiteId: id,
  });
  refresh();
  return succes("La session n'est plus visible des étudiants.");
}
