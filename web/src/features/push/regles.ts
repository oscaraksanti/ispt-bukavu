/** Notifications sur le téléphone (Web Push) : règles pures, testées. */

export type ContenuPush = { titre: string; corps: string; lien: string; tag?: string };

const court = (t: string, max: number) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

/**
 * Charge utile envoyée au téléphone : textes bornés (l'écran de verrouillage
 * n'en affiche qu'une ligne ou deux) et lien interne seulement.
 */
export function chargeUtile(c: ContenuPush) {
  const lien = c.lien.startsWith("/") && !c.lien.startsWith("//") ? c.lien : "/";
  return JSON.stringify({
    titre: court(c.titre, 80),
    corps: court(c.corps, 160),
    lien,
    ...(c.tag ? { tag: c.tag.slice(0, 64) } : {}),
  });
}

/** Le service répond 404 ou 410 quand l'abonnement n'existe plus : on le supprime. */
export function abonnementPerime(statut: number | undefined) {
  return statut === 404 || statut === 410;
}

/** Appareils abonnés au plus par compte (les plus anciens sont remplacés). */
export const ABONNEMENTS_MAX = 5;

/**
 * Services de notification des navigateurs (Chrome, Edge, Firefox, Safari) :
 * le serveur n'envoie jamais de requête vers une autre adresse.
 */
const SERVICES_PUSH = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^[a-z0-9-]+\.push\.services\.mozilla\.com$/,
  /^[a-z0-9.-]+\.push\.apple\.com$/,
  /^[a-z0-9.-]+\.notify\.windows\.com$/,
];

export function serviceAutorise(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return (
      u.protocol === "https:" &&
      !u.port &&
      !u.username &&
      SERVICES_PUSH.some((r) => r.test(u.hostname))
    );
  } catch {
    return false;
  }
}

/** Données envoyées par le navigateur lors de l'abonnement, vérifiées. */
export function lireAbonnement(v: unknown) {
  if (!v || typeof v !== "object") return null;
  const a = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof a.endpoint !== "string" || !/^https:\/\/[^\s]{10,1000}$/.test(a.endpoint)) return null;
  if (!serviceAutorise(a.endpoint)) return null;
  const p256dh = a.keys?.p256dh;
  const auth = a.keys?.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{8,100}$/.test(auth)) return null;
  return { endpoint: a.endpoint, p256dh, auth };
}
