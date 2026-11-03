/**
 * Calcul des notes, sans base de données (testé unitairement).
 *
 * Conventions retenues, à confirmer par le secrétariat académique :
 * - toutes les notes sont sur 20 ;
 * - la note d'un cours est la moyenne des évaluations publiées, pondérée par
 *   leur poids ; une absence ou une note manquante compte pour zéro ;
 * - un cours est validé lorsque sa note atteint le seuil de réussite de
 *   l'année (10 par défaut), et ses crédits sont alors acquis ;
 * - la moyenne du semestre est pondérée par les crédits des cours notés.
 */

export type StatutEvaluation = "BROUILLON" | "SOUMISE" | "VALIDEE" | "PUBLIEE";

export const LIBELLES_EVALUATION: Record<StatutEvaluation, string> = {
  BROUILLON: "En saisie",
  SOUMISE: "Transmise au secrétariat",
  VALIDEE: "Validée",
  PUBLIEE: "Publiée",
};

export const TYPES_EVALUATION = {
  INTERROGATION: "Interrogation",
  TRAVAUX_PRATIQUES: "Travaux pratiques",
  EXAMEN: "Examen",
} as const;

export const arrondir = (n: number) => Math.round(n * 100) / 100;

export function noteValide(v: number) {
  return Number.isFinite(v) && v >= 0 && v <= 20;
}

/** Lit une note saisie (« 12,5 », « 14 »), ou null si le champ est vide. */
export function lireNote(saisie: string): number | null | "invalide" {
  const t = saisie.trim().replace(",", ".");
  if (!t) return null;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(t)) return "invalide";
  const v = Number(t);
  return noteValide(v) ? v : "invalide";
}

type EvaluationNotee = {
  ponderation: number;
  statut: StatutEvaluation;
  note: { valeur: number | null; absent: boolean } | null;
};

/** Note d'un cours sur 20, d'après ses évaluations publiées (null s'il n'y en a aucune). */
export function noteCours(evaluations: EvaluationNotee[]) {
  const publiees = evaluations.filter((e) => e.statut === "PUBLIEE" && e.ponderation > 0);
  const poids = publiees.reduce((t, e) => t + e.ponderation, 0);
  if (poids === 0) return null;
  const total = publiees.reduce(
    (t, e) => t + (e.note && !e.note.absent ? (e.note.valeur ?? 0) : 0) * e.ponderation,
    0,
  );
  return arrondir(total / poids);
}

/** Moyenne du semestre pondérée par les crédits, et crédits acquis. */
export function bilanSemestre(cours: { credits: number; note: number | null }[], seuil: number) {
  const notes = cours.filter((c): c is { credits: number; note: number } => c.note !== null);
  const credits = notes.reduce((t, c) => t + c.credits, 0);
  return {
    moyenne: credits ? arrondir(notes.reduce((t, c) => t + c.note * c.credits, 0) / credits) : null,
    creditsAcquis: notes.filter((c) => c.note >= seuil).reduce((t, c) => t + c.credits, 0),
    creditsTotal: cours.reduce((t, c) => t + c.credits, 0),
    coursNotes: notes.length,
  };
}

/** Le total des poids des évaluations d'un cours ne peut dépasser 100 %. */
export function ponderationDisponible(existantes: number[], nouvelle: number) {
  const total = existantes.reduce((t, p) => t + p, 0) + nouvelle;
  return total <= 100;
}

export type Acteur = "enseignant" | "secretariat";

/** Circuit des notes : saisie, transmission, validation, publication. */
export function transitionPermise(de: StatutEvaluation, vers: StatutEvaluation, acteur: Acteur) {
  const permis: Record<Acteur, [StatutEvaluation, StatutEvaluation][]> = {
    enseignant: [["BROUILLON", "SOUMISE"]],
    secretariat: [
      ["SOUMISE", "VALIDEE"],
      ["SOUMISE", "BROUILLON"],
      ["VALIDEE", "PUBLIEE"],
      ["VALIDEE", "BROUILLON"],
      ["PUBLIEE", "VALIDEE"],
    ],
  };
  return permis[acteur].some(([a, b]) => a === de && b === vers);
}

/** Statistiques d'une évaluation (pour la relecture par le secrétariat). */
export function statistiques(notes: { valeur: number | null; absent: boolean }[], seuil: number) {
  const valeurs = notes.filter((n) => !n.absent && n.valeur !== null).map((n) => n.valeur!);
  if (valeurs.length === 0) return null;
  return {
    moyenne: arrondir(valeurs.reduce((t, v) => t + v, 0) / valeurs.length),
    min: Math.min(...valeurs),
    max: Math.max(...valeurs),
    reussite: Math.round((valeurs.filter((v) => v >= seuil).length / valeurs.length) * 100),
    absents: notes.filter((n) => n.absent).length,
  };
}
