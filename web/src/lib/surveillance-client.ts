const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let chargement: Promise<{ captureException: (erreur: unknown) => unknown }> | null = null;

/**
 * Charge Sentry dans le navigateur, à la demande. Le module est téléchargé à
 * part, après l'affichage de la page : il n'alourdit pas le premier chargement
 * sur une connexion mobile lente. Sans DSN, rien n'est téléchargé.
 */
export function chargerSurveillance() {
  if (!dsn) return null;
  chargement ??= import("./surveillance-navigateur").then((m) => m.demarrer(dsn));
  return chargement;
}

/** Transmet une erreur rattrapée par une page d'erreur. */
export function signalerErreur(erreur: unknown) {
  void chargerSurveillance()?.then((s) => s.captureException(erreur));
}
