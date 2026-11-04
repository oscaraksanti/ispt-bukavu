/** Présences : règles pures (testées sans base de données). */

export type StatutPresence = "PRESENT" | "RETARD" | "ABSENT" | "EXCUSE";

export const LIBELLES_PRESENCE: Record<StatutPresence, string> = {
  PRESENT: "Présent",
  RETARD: "En retard",
  ABSENT: "Absent",
  EXCUSE: "Excusé",
};

export const STATUTS_PRESENCE = Object.keys(LIBELLES_PRESENCE) as StatutPresence[];

export function estStatutPresence(v: unknown): v is StatutPresence {
  return typeof v === "string" && v in LIBELLES_PRESENCE;
}

/**
 * Bilan d'assiduité : un retard compte comme une présence ; une absence
 * excusée n'entre pas dans le calcul du taux. Taux arrondi à l'entier, ou
 * null tant qu'aucune séance n'est comptée.
 */
export function bilanPresences(statuts: StatutPresence[]) {
  const n = (s: StatutPresence) => statuts.filter((x) => x === s).length;
  const presents = n("PRESENT") + n("RETARD");
  const absents = n("ABSENT");
  const comptees = presents + absents;
  return {
    seances: statuts.length,
    presents,
    retards: n("RETARD"),
    absents,
    excuses: n("EXCUSE"),
    taux: comptees ? Math.round((presents / comptees) * 100) : null,
  };
}

/** Seules les séances commencées (et non annulées) peuvent faire l'objet d'un appel. */
export function appelPossible(seance: { debut: Date; statut: string }, maintenant = new Date()) {
  return seance.statut !== "ANNULEE" && seance.debut <= maintenant;
}
