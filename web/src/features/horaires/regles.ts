/**
 * Horaires hebdomadaires, sur le modèle de l'institut : du lundi au samedi,
 * deux plages par jour (08 h-12 h et 13 h-16 h), heure de Bukavu (UTC+2).
 * Fonctions pures, testées unitairement.
 */

export const PLAGES = [
  { cle: "matin", libelle: "08-12", debut: "08:00", fin: "12:00" },
  { cle: "apresMidi", libelle: "13-16", debut: "13:00", fin: "16:00" },
] as const;

export type CleePlage = (typeof PLAGES)[number]["cle"];

export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;

const DECALAGE_MS = 2 * 3600 * 1000;

/** « 2026-11-04 » → lundi de la même semaine, au format AAAA-MM-JJ. */
export function lundiDe(jour: string) {
  const d = new Date(`${jour}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const decalage = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - decalage);
  return d.toISOString().slice(0, 10);
}

export function ajouterJours(jour: string, n: number) {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Jour courant à Bukavu, au format AAAA-MM-JJ. */
export function aujourdhuiBukavu(maintenant = new Date()) {
  return new Date(maintenant.getTime() + DECALAGE_MS).toISOString().slice(0, 10);
}

/** Début et fin (instants UTC) d'une plage d'un jour donné. */
export function bornesPlage(jour: string, cle: CleePlage) {
  const p = PLAGES.find((x) => x.cle === cle)!;
  return {
    debut: new Date(`${jour}T${p.debut}:00+02:00`),
    fin: new Date(`${jour}T${p.fin}:00+02:00`),
  };
}

/** Retrouve le jour (AAAA-MM-JJ) et la plage d'une séance. */
export function situerSeance(debut: Date): { jour: string; plage: CleePlage } {
  const local = new Date(debut.getTime() + DECALAGE_MS);
  const jour = local.toISOString().slice(0, 10);
  const heure = local.getUTCHours();
  return { jour, plage: heure < 12 ? "matin" : "apresMidi" };
}

/** « du 02 au 07 novembre 2026 », comme sur les horaires de l'institut. */
export function libelleSemaine(lundi: string) {
  const fmt = (j: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...opts }).format(
      new Date(`${j}T12:00:00Z`),
    );
  const samedi = ajouterJours(lundi, 5);
  const memeMois = lundi.slice(0, 7) === samedi.slice(0, 7);
  return `du ${fmt(lundi, memeMois ? { day: "2-digit" } : { day: "2-digit", month: "long" })} au ${fmt(samedi, { day: "2-digit", month: "long", year: "numeric" })}`;
}

export function libelleJour(jour: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${jour}T12:00:00Z`));
}

/** « 3ème semestre », comme sur les documents de l'institut. */
export function libelleSemestre(n: number) {
  return `${n}${n === 1 ? "er" : "ème"} semestre`;
}
