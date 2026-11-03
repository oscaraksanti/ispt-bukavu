/**
 * Dates à l'heure de Bukavu (Afrique centrale, UTC+2, sans heure d'été).
 * Les champs « date et heure » du navigateur n'ont pas de fuseau : on les
 * interprète toujours à l'heure locale de l'institut.
 */
export const FUSEAU = "Africa/Lubumbashi";
const DECALAGE = "+02:00";

/** « 2026-11-20T14:30 » (heure de Bukavu) → Date. */
export function versDateBukavu(valeur: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valeur)) return null;
  const date = new Date(`${valeur}:00${DECALAGE}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → « 2026-11-20T14:30 » à l'heure de Bukavu, pour pré-remplir un champ. */
export function versChampDate(date: Date | null | undefined) {
  if (!date) return "";
  const local = new Date(date.getTime() + 2 * 3600 * 1000);
  return local.toISOString().slice(0, 16);
}

export const formatJour = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: FUSEAU,
});

export const formatJourCourt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  timeZone: FUSEAU,
});

export const formatHeure = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: FUSEAU,
});
