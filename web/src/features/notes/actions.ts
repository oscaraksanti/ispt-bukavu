"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { versDateBukavu } from "@/features/actualites/dates";
import { exigerConnexion, exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { notifier } from "@/features/notifications/emettre";
import { etudiantsDuCours, peutGererCours } from "./acces";
import {
  LIBELLES_EVALUATION,
  lireNote,
  ponderationDisponible,
  type StatutEvaluation,
  transitionPermise,
} from "./regles";

async function enseignantDuCours(coursOffertId: string) {
  const u = await exigerConnexion("/enseignant");
  if (!(await peutGererCours(u, coursOffertId))) return { u, refuse: true as const };
  return { u, refuse: false as const };
}

const schemaEvaluation = z.object({
  intitule: z.string().trim().min(2, "Indiquez l'intitulé.").max(120),
  type: z.enum(["INTERROGATION", "TRAVAUX_PRATIQUES", "EXAMEN"]),
  ponderation: z.coerce.number().min(1, "Poids : au moins 1 %.").max(100, "Poids : 100 % au plus."),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
});

export async function creerEvaluation(
  coursOffertId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const { u, refuse } = await enseignantDuCours(coursOffertId);
  if (refuse) return echec("Ce cours ne vous est pas confié.");
  const r = schemaEvaluation.safeParse({
    intitule: fd.get("intitule") ?? "",
    type: fd.get("type") ?? "",
    ponderation: String(fd.get("ponderation") ?? "").replace(",", "."),
    date: fd.get("date") ?? "",
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const existantes = await db.evaluation.findMany({
    where: { coursOffertId },
    select: { ponderation: true },
  });
  if (
    !ponderationDisponible(
      existantes.map((e) => Number(e.ponderation)),
      r.data.ponderation,
    )
  )
    return echec("Le total des poids des évaluations du cours dépasserait 100 %.");
  const e = await db.evaluation.create({
    data: {
      coursOffertId,
      intitule: r.data.intitule,
      type: r.data.type,
      ponderation: r.data.ponderation,
      date: r.data.date ? versDateBukavu(`${r.data.date}T08:00`) : null,
    },
  });
  await journaliser({
    auteurId: u.id,
    action: "evaluation_creee",
    entite: "Evaluation",
    entiteId: e.id,
    apres: r.data,
  });
  refresh();
  return succes("Évaluation créée : saisissez maintenant les notes.");
}

export async function supprimerEvaluation(id: string): Promise<EtatFormulaire> {
  const e = await db.evaluation.findUnique({ where: { id } });
  if (!e) return echec("Évaluation introuvable.");
  const { u, refuse } = await enseignantDuCours(e.coursOffertId);
  if (refuse) return echec("Ce cours ne vous est pas confié.");
  if (e.statut !== "BROUILLON")
    return echec("Une évaluation transmise ne peut plus être supprimée.");
  await db.evaluation.delete({ where: { id } });
  await journaliser({
    auteurId: u.id,
    action: "evaluation_supprimee",
    entite: "Evaluation",
    entiteId: id,
  });
  refresh();
  return succes("Évaluation supprimée.");
}

/** Enregistre les notes saisies (champs note-<id> et absent-<id>), tant que l'évaluation est en saisie. */
export async function enregistrerNotes(
  evaluationId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const e = await db.evaluation.findUnique({ where: { id: evaluationId } });
  if (!e) return echec("Évaluation introuvable.");
  const { u, refuse } = await enseignantDuCours(e.coursOffertId);
  if (refuse) return echec("Ce cours ne vous est pas confié.");
  if (e.statut !== "BROUILLON")
    return echec("Les notes ont été transmises : elles ne sont plus modifiables.");

  const etudiants = await etudiantsDuCours(e.coursOffertId);
  const erreurs: string[] = [];
  const operations = [];
  for (const et of etudiants) {
    const absent = fd.get(`absent-${et.id}`) === "on";
    const lue = lireNote(String(fd.get(`note-${et.id}`) ?? ""));
    if (lue === "invalide") {
      erreurs.push(et.matricule);
      continue;
    }
    if (lue === null && !absent) {
      operations.push(db.note.deleteMany({ where: { evaluationId, etudiantId: et.id } }));
      continue;
    }
    const data = { valeur: absent ? null : lue, absent };
    operations.push(
      db.note.upsert({
        where: { evaluationId_etudiantId: { evaluationId, etudiantId: et.id } },
        update: data,
        create: { ...data, evaluationId, etudiantId: et.id },
      }),
    );
  }
  if (erreurs.length) return echec(`Notes invalides (0 à 20) pour : ${erreurs.join(", ")}.`);
  await db.$transaction(operations);
  await journaliser({
    auteurId: u.id,
    action: "notes_saisies",
    entite: "Evaluation",
    entiteId: evaluationId,
  });
  refresh();
  return succes("Notes enregistrées.");
}

export async function transmettreEvaluation(id: string): Promise<EtatFormulaire> {
  const e = await db.evaluation.findUnique({ where: { id }, include: { notes: true } });
  if (!e) return echec("Évaluation introuvable.");
  const { u, refuse } = await enseignantDuCours(e.coursOffertId);
  if (refuse) return echec("Ce cours ne vous est pas confié.");
  if (!transitionPermise(e.statut as StatutEvaluation, "SOUMISE", "enseignant"))
    return echec("Cette évaluation a déjà été transmise.");
  const etudiants = await etudiantsDuCours(e.coursOffertId);
  const manquants = etudiants.filter((et) => !e.notes.some((n) => n.etudiantId === et.id));
  if (manquants.length)
    return echec(
      `Note ou absence à indiquer pour ${manquants.length} étudiant(s) avant la transmission.`,
    );
  await db.evaluation.update({ where: { id }, data: { statut: "SOUMISE" } });
  await journaliser({
    auteurId: u.id,
    action: "evaluation_transmise",
    entite: "Evaluation",
    entiteId: id,
  });
  refresh();
  return succes("Notes transmises au secrétariat académique pour validation.");
}

/** Décisions du secrétariat académique : valider, renvoyer, publier, retirer la publication. */
export async function changerStatutEvaluation(
  id: string,
  vers: StatutEvaluation,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.notes.valider");
  const e = await db.evaluation.findUnique({
    where: { id },
    include: { coursOffert: { include: { cours: true } } },
  });
  if (!e) return echec("Évaluation introuvable.");
  if (!transitionPermise(e.statut as StatutEvaluation, vers, "secretariat"))
    return echec("Cette décision n'est pas possible à ce stade.");
  await db.evaluation.update({ where: { id }, data: { statut: vers } });
  if (vers === "PUBLIEE") {
    const etudiants = await etudiantsDuCours(e.coursOffertId);
    await notifier(
      etudiants.map((et) => et.utilisateurId),
      {
        type: "NOTE_PUBLIEE",
        titre: "Nouvelle note publiée",
        message: `${e.coursOffert.cours.intitule} : ${e.intitule}`,
        lien: "/etudiant/notes",
      },
    );
  }
  await journaliser({
    auteurId: auteur.id,
    action: "evaluation_statut",
    entite: "Evaluation",
    entiteId: id,
    avant: { statut: e.statut },
    apres: { statut: vers },
  });
  refresh();
  return succes(`Évaluation : ${LIBELLES_EVALUATION[vers].toLowerCase()}.`);
}
