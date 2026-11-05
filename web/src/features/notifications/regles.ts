/** Notifications : catalogue et règles pures (testées sans base de données). */

export const TYPES_NOTIFICATION = {
  NOTE_PUBLIEE: { libelle: "Notes", icone: "notes" },
  COMMUNIQUE: { libelle: "Valve", icone: "valve" },
  COMMUNIQUE_A_VALIDER: { libelle: "Valve", icone: "valve" },
  CANDIDATURE: { libelle: "Candidature", icone: "candidature" },
  CANDIDATURE_DEPOSEE: { libelle: "Admissions", icone: "candidature" },
  PAIEMENT: { libelle: "Frais", icone: "frais" },
  DOCUMENT: { libelle: "Documents", icone: "document" },
  STAGE: { libelle: "Stages", icone: "stage" },
  DEVOIR: { libelle: "Devoirs", icone: "devoir" },
  RESULTATS: { libelle: "Résultats", icone: "notes" },
  EXAMEN: { libelle: "Examens", icone: "examen" },
  ANCIEN: { libelle: "Anciens", icone: "candidature" },
  OFFRE: { libelle: "Stages et emplois", icone: "stage" },
  MODERATION: { libelle: "Modération", icone: "moderation" },
  CAMPUS: { libelle: "Campus", icone: "campus" },
} as const;

export type TypeNotification = keyof typeof TYPES_NOTIFICATION;
export type IconeNotification = (typeof TYPES_NOTIFICATION)[TypeNotification]["icone"];

export function iconeDe(type: string): IconeNotification {
  return TYPES_NOTIFICATION[type as TypeNotification]?.icone ?? "valve";
}

export function libelleDe(type: string) {
  return TYPES_NOTIFICATION[type as TypeNotification]?.libelle ?? "Information";
}

/**
 * Lien d'une notification : uniquement un chemin interne au site. Un lien
 * altéré en base ne peut donc jamais renvoyer vers un autre site.
 */
export function lienSur(lien: string | null | undefined): string | null {
  if (!lien || !lien.startsWith("/") || lien.startsWith("//") || /[\\\s\x00-\x1f]/.test(lien))
    return null;
  return lien;
}

/** Texte court du compteur : « 9+ » au-delà de 9. */
export function libelleCompteur(n: number) {
  return n > 9 ? "9+" : String(n);
}

/** Regroupe des notifications par jour (aujourd'hui, hier, puis date), dans l'ordre reçu. */
export function regrouperParJour<T extends { creeLe: Date }>(
  elements: T[],
  maintenant = new Date(),
  fuseau = "Africa/Lubumbashi",
) {
  const jour = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: fuseau });
  const auj = jour(maintenant);
  const hier = jour(new Date(maintenant.getTime() - 86_400_000));
  const format = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: fuseau,
  });
  const groupes: { cle: string; titre: string; elements: T[] }[] = [];
  for (const e of elements) {
    const cle = jour(e.creeLe);
    let g = groupes.find((x) => x.cle === cle);
    if (!g) {
      const titre = cle === auj ? "Aujourd'hui" : cle === hier ? "Hier" : format.format(e.creeLe);
      g = { cle, titre: titre.charAt(0).toUpperCase() + titre.slice(1), elements: [] };
      groupes.push(g);
    }
    g.elements.push(e);
  }
  return groupes;
}
