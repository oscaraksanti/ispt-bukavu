"use server";

import { refresh } from "next/cache";
import { exigerConnexion } from "@/features/auth/acces";
import { etudiantsDuCours, peutGererCours } from "@/features/notes/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { appelPossible, bilanPresences, estStatutPresence, type StatutPresence } from "./regles";

/** Enregistre l'appel d'une séance (champs statut-<etudiantId>). */
export async function enregistrerAppel(
  seanceId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/enseignant");
  const seance = await db.seance.findUnique({ where: { id: seanceId } });
  if (!seance) return echec("Séance introuvable.");
  if (!(await peutGererCours(u, seance.coursOffertId)))
    return echec("Ce cours ne vous est pas confié.");
  if (!appelPossible(seance))
    return echec("L'appel n'est possible qu'à partir du début de la séance.");

  const etudiants = await etudiantsDuCours(seance.coursOffertId);
  const saisis: { etudiantId: string; statut: StatutPresence }[] = [];
  for (const e of etudiants) {
    const v = fd.get(`statut-${e.id}`);
    if (v === null) continue;
    if (!estStatutPresence(v)) return echec(`Statut invalide pour ${e.matricule}.`);
    saisis.push({ etudiantId: e.id, statut: v });
  }
  if (!saisis.length) return echec("Aucun étudiant à pointer.");

  await db.$transaction(
    saisis.map((s) =>
      db.presence.upsert({
        where: { seanceId_etudiantId: { seanceId, etudiantId: s.etudiantId } },
        update: { statut: s.statut, saisieParId: u.id },
        create: { seanceId, etudiantId: s.etudiantId, statut: s.statut, saisieParId: u.id },
      }),
    ),
  );
  await journaliser({
    auteurId: u.id,
    action: "appel_saisi",
    entite: "Seance",
    entiteId: seanceId,
  });
  const b = bilanPresences(saisis.map((s) => s.statut));
  refresh();
  return succes(
    `Appel enregistré : ${b.presents} présent(s), ${b.absents} absent(s)${b.excuses ? `, ${b.excuses} excusé(s)` : ""}.`,
  );
}
