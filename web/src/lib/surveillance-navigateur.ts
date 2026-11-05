import { captureException, init } from "@sentry/browser";
import { COLLECTE_MINIMALE, environnement, nettoyerEvenement } from "./surveillance";

/**
 * Partie de Sentry chargée dans le navigateur (imports nommés : seul le
 * nécessaire est gardé à la compilation). Erreurs seulement : la mesure des
 * performances se fait côté serveur.
 */
export function demarrer(dsn: string) {
  init({
    dsn,
    environment: environnement(process.env.NEXT_PUBLIC_VERCEL_ENV),
    dataCollection: COLLECTE_MINIMALE,
    // Requêtes vers Sentry relayées par le site (même origine : CSP inchangée, bloqueurs évités).
    tunnel: "/surveillance",
    tracesSampleRate: 0,
    beforeSend: nettoyerEvenement,
  });
  return { captureException };
}
