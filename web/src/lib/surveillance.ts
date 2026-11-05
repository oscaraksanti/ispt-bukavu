import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Réglages communs de la surveillance des erreurs (Sentry), pour le navigateur
 * comme pour le serveur. Sans DSN, rien n'est chargé ni envoyé.
 *
 * Données personnelles : aucune identité, aucun cookie, aucun corps de requête
 * (formulaires, notes, messages) et aucun paramètre d'adresse ne quittent la
 * plateforme ; seuls quelques en-têtes techniques sont conservés, et les jetons
 * à usage unique présents dans les chemins sont masqués.
 */

/** Chemins dont le dernier segment est un jeton secret (lien reçu par email). */
const CHEMINS_A_JETON = [
  "/reinitialiser/",
  "/confirmer-email/",
  "/anciens/retrait/",
  "/activer/",
] as const;

/** Masque les jetons d'un chemin ou d'une adresse complète ; retire la requête et l'ancre. */
export function masquerAdresse(adresse: string): string {
  let resultat = adresse.split(/[?#]/)[0];
  for (const prefixe of CHEMINS_A_JETON) {
    const i = resultat.indexOf(prefixe);
    if (i >= 0) resultat = resultat.slice(0, i + prefixe.length) + "[jeton]";
  }
  return resultat;
}

/** Nettoie un événement avant l'envoi (filet de sécurité en plus des réglages). */
export function nettoyerEvenement(evenement: ErrorEvent): ErrorEvent {
  delete evenement.user;
  if (evenement.request) {
    if (evenement.request.url) evenement.request.url = masquerAdresse(evenement.request.url);
    delete evenement.request.cookies;
    delete evenement.request.data;
    delete evenement.request.query_string;
  }
  if (evenement.transaction) evenement.transaction = masquerAdresse(evenement.transaction);
  for (const fil of evenement.breadcrumbs ?? []) {
    const donnees = fil.data;
    if (!donnees) continue;
    for (const cle of ["url", "from", "to"] as const) {
      if (typeof donnees[cle] === "string") donnees[cle] = masquerAdresse(donnees[cle]);
    }
  }
  return evenement;
}

export const COLLECTE_MINIMALE = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: ["user-agent", "accept-language"] }, response: false },
  httpBodies: [],
  urlQueryParams: false,
};

/**
 * Adresse d'envoi Sentry d'une enveloppe, ou `null` si l'enveloppe ne vise pas
 * exactement le DSN du site (le relais ne doit servir à rien d'autre).
 */
export function relaisSentry(enveloppe: string, dsnAttendu: string): string | null {
  const fin = enveloppe.indexOf("\n");
  const entete = fin === -1 ? enveloppe : enveloppe.slice(0, fin);
  let dsn: unknown;
  try {
    dsn = (JSON.parse(entete) as { dsn?: unknown }).dsn;
  } catch {
    return null;
  }
  if (typeof dsn !== "string" || dsn !== dsnAttendu) return null;
  try {
    const url = new URL(dsn);
    const projet = url.pathname.replace(/^\/+|\/+$/g, "");
    if (url.protocol !== "https:" || !/^\d+$/.test(projet)) return null;
    return `https://${url.host}/api/${projet}/envelope/`;
  } catch {
    return null;
  }
}

/** Environnement Vercel (production, preview) ou local. */
export function environnement(valeur: string | undefined) {
  return valeur || "development";
}
