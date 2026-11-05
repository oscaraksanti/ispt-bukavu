import * as Sentry from "@sentry/nextjs";
import { COLLECTE_MINIMALE, environnement, nettoyerEvenement } from "@/lib/surveillance";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: environnement(process.env.VERCEL_ENV),
  dataCollection: COLLECTE_MINIMALE,
  // Une requête sur dix est mesurée : assez pour repérer une lenteur, sans épuiser le quota gratuit.
  tracesSampleRate: 0.1,
  beforeSend: nettoyerEvenement,
});
