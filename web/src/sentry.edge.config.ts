import * as Sentry from "@sentry/nextjs";
import {
  COLLECTE_MINIMALE,
  environnement,
  nettoyerEvenement,
  nettoyerTransaction,
} from "@/lib/surveillance";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: environnement(process.env.VERCEL_ENV),
  dataCollection: COLLECTE_MINIMALE,
  tracesSampleRate: 0.1,
  beforeSend: nettoyerEvenement,
  beforeSendTransaction: nettoyerTransaction,
});
