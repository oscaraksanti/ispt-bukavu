import type { Instrumentation } from "next";

/**
 * Surveillance des erreurs côté serveur. Sans `SENTRY_DSN`, le module Sentry
 * n'est même pas chargé : aucun coût au démarrage des fonctions.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

/** Toute erreur non rattrapée d'une page, d'une route ou d'une action serveur. */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return;
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(...args);
};
