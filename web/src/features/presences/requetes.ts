import "server-only";
import { db } from "@/lib/db";
import { bilanPresences, type StatutPresence } from "./regles";

/** Séances d'un cours (les plus récentes d'abord) avec le nombre d'étudiants pointés. */
export function seancesDuCours(coursOffertId: string) {
  return db.seance.findMany({
    where: { coursOffertId },
    include: { _count: { select: { presences: true } } },
    orderBy: { debut: "desc" },
  });
}

/** Bilan d'assiduité de chaque étudiant pour un cours. */
export async function bilansDuCours(coursOffertId: string) {
  const lignes = await db.presence.findMany({
    where: { seance: { coursOffertId } },
    select: { etudiantId: true, statut: true },
  });
  const parEtudiant = new Map<string, StatutPresence[]>();
  for (const l of lignes)
    parEtudiant.set(l.etudiantId, [...(parEtudiant.get(l.etudiantId) ?? []), l.statut]);
  return new Map([...parEtudiant].map(([id, s]) => [id, bilanPresences(s)]));
}

/** Présences d'un étudiant pour un cours, séance par séance. */
export function presencesEtudiant(coursOffertId: string, etudiantId: string) {
  return db.presence.findMany({
    where: { etudiantId, seance: { coursOffertId } },
    include: { seance: true },
    orderBy: { seance: { debut: "desc" } },
  });
}
