import { chargerSurveillance } from "@/lib/surveillance-client";

// Surveillance des erreurs du navigateur, chargée quand le navigateur est disponible.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const demarrer = () => void chargerSurveillance();
  if ("requestIdleCallback" in window) window.requestIdleCallback(demarrer, { timeout: 4000 });
  else setTimeout(demarrer, 2000);
}
