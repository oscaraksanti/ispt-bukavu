/**
 * Examens : sessions, épreuves et contrôle des conflits (fonctions pures,
 * testées unitairement). Heure de Bukavu (UTC+2, sans heure d'été).
 */

export const TYPES_SESSION = {
  ORDINAIRE: "Session ordinaire",
  RATTRAPAGE: "Session de rattrapage",
} as const;

export const MODALITES = {
  ECRIT: "Écrit",
  ORAL: "Oral",
  PRATIQUE: "Pratique",
} as const;

export type Modalite = keyof typeof MODALITES;

/** Plages proposées par défaut, sur le modèle de l'horaire de l'institut. */
export const PLAGES_EXAMEN = [
  { cle: "matin", libelle: "Matinée (08 h – 12 h)", debut: "08:00", fin: "12:00" },
  { cle: "apresMidi", libelle: "Après-midi (13 h – 16 h)", debut: "13:00", fin: "16:00" },
] as const;

const DECALAGE_MS = 2 * 3600 * 1000;

/** « 2026-12-07 » + « 08:30 » (heure de Bukavu) → instant. */
export function instantBukavu(jour: string, heure: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour) || !/^\d{2}:\d{2}$/.test(heure)) return null;
  const d = new Date(`${jour}T${heure}:00+02:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Instant → { jour: « 2026-12-07 », heure: « 08:30 » } à l'heure de Bukavu. */
export function enHeureBukavu(d: Date) {
  const iso = new Date(d.getTime() + DECALAGE_MS).toISOString();
  return { jour: iso.slice(0, 10), heure: iso.slice(11, 16) };
}

/**
 * Contrôle d'une épreuve : même jour, fin après le début, durée raisonnable,
 * jour compris dans la session. Renvoie le message d'erreur ou null.
 */
export function verifierEpreuve(
  e: { jour: string; debut: string; fin: string },
  session: { debut: Date; fin: Date },
) {
  const debut = instantBukavu(e.jour, e.debut);
  const fin = instantBukavu(e.jour, e.fin);
  if (!debut || !fin) return "Date ou heure invalide.";
  if (fin <= debut) return "L'épreuve doit se terminer après son début.";
  if (fin.getTime() - debut.getTime() > 8 * 3600 * 1000)
    return "Une épreuve ne peut pas dépasser 8 heures.";
  const premier = enHeureBukavu(session.debut).jour;
  const dernier = enHeureBukavu(session.fin).jour;
  if (e.jour < premier || e.jour > dernier) return "Ce jour est en dehors des dates de la session.";
  return null;
}

export type EpreuvePlanifiee = {
  id: string;
  libelle: string;
  promotionId: string;
  promotion: string;
  debut: Date;
  fin: Date;
  salle: string | null;
  surveillants: { id: string; nom: string }[];
};

export type Conflit = {
  type: "PROMOTION" | "SALLE" | "SURVEILLANT";
  message: string;
  epreuves: [string, string];
};

const chevauchent = (a: EpreuvePlanifiee, b: EpreuvePlanifiee) =>
  a.debut < b.fin && b.debut < a.fin;

/** « 104 » → « Salle 104 » ; « Salle 104 » ou « Labo 2 » restent tels quels. */
export function libelleSalle(salle: string | null) {
  const s = (salle ?? "").trim();
  if (!s) return "Salle à préciser";
  return /^\d/.test(s) || /^[A-Z]\d/i.test(s)
    ? `Salle ${s}`
    : s.charAt(0).toUpperCase() + s.slice(1);
}

const normaliserSalle = (s: string | null) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Conflits d'un planning : une promotion, une salle ou un surveillant pris
 * par deux épreuves qui se chevauchent. Plusieurs promotions peuvent en
 * revanche composer en même temps dans des salles différentes.
 */
export function conflits(epreuves: EpreuvePlanifiee[]): Conflit[] {
  const resultat: Conflit[] = [];
  const triees = [...epreuves].sort((a, b) => a.debut.getTime() - b.debut.getTime());
  for (let i = 0; i < triees.length; i++) {
    for (let j = i + 1; j < triees.length; j++) {
      const a = triees[i];
      const b = triees[j];
      if (b.debut >= a.fin) break;
      if (!chevauchent(a, b)) continue;
      const paire: [string, string] = [a.id, b.id];
      if (a.promotionId === b.promotionId)
        resultat.push({
          type: "PROMOTION",
          message: `${a.promotion} : « ${a.libelle} » et « ${b.libelle} » se chevauchent.`,
          epreuves: paire,
        });
      if (a.salle && normaliserSalle(a.salle) === normaliserSalle(b.salle))
        resultat.push({
          type: "SALLE",
          message: `${libelleSalle(a.salle)} : « ${a.libelle} » (${a.promotion}) et « ${b.libelle} » (${b.promotion}) en même temps.`,
          epreuves: paire,
        });
      for (const s of a.surveillants)
        if (b.surveillants.some((x) => x.id === s.id))
          resultat.push({
            type: "SURVEILLANT",
            message: `${s.nom} surveille « ${a.libelle} » et « ${b.libelle} » en même temps.`,
            epreuves: paire,
          });
    }
  }
  return resultat;
}

/** Regroupe des épreuves par jour (heure de Bukavu), dans l'ordre chronologique. */
export function parJour<T extends { debut: Date }>(epreuves: T[]) {
  const jours = new Map<string, T[]>();
  for (const e of [...epreuves].sort((a, b) => a.debut.getTime() - b.debut.getTime())) {
    const jour = enHeureBukavu(e.debut).jour;
    jours.set(jour, [...(jours.get(jour) ?? []), e]);
  }
  return [...jours.entries()].map(([jour, liste]) => ({ jour, epreuves: liste }));
}

/** Une épreuve modifiée après la publication est signalée aux étudiants. */
export function modifieeApresPublication(e: { majLe: Date }, publieeLe: Date | null) {
  return !!publieeLe && e.majLe.getTime() > publieeLe.getTime();
}

/* ---------- Export vers un agenda (iCalendar) ---------- */

const echapperIcs = (t: string) =>
  t
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");

const dateIcs = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** Replie les lignes à 75 octets (RFC 5545), approximativement par caractères. */
function plier(ligne: string) {
  const morceaux: string[] = [];
  for (let i = 0; i < ligne.length; i += 73) morceaux.push(ligne.slice(i, i + 73));
  return morceaux.join("\r\n ");
}

/**
 * Fichier .ics des épreuves : s'importe dans l'agenda du téléphone (Google,
 * Apple, Outlook) avec un rappel la veille.
 */
export function calendrierIcs(
  nom: string,
  epreuves: {
    id: string;
    titre: string;
    debut: Date;
    fin: Date;
    lieu: string | null;
    description: string;
  }[],
  maintenant = new Date(),
) {
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ISPT-Bukavu//Examens//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${echapperIcs(nom)}`,
  ];
  for (const e of epreuves) {
    lignes.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@isptbukavu.org`,
      `DTSTAMP:${dateIcs(maintenant)}`,
      `DTSTART:${dateIcs(e.debut)}`,
      `DTEND:${dateIcs(e.fin)}`,
      `SUMMARY:${echapperIcs(e.titre)}`,
      ...(e.lieu ? [`LOCATION:${echapperIcs(e.lieu)}`] : []),
      `DESCRIPTION:${echapperIcs(e.description)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-PT18H",
      `DESCRIPTION:${echapperIcs(e.titre)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lignes.push("END:VCALENDAR");
  return lignes.map(plier).join("\r\n") + "\r\n";
}
