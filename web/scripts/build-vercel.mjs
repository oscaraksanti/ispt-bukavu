/**
 * Build de déploiement : applique les migrations et les données initiales
 * quand une base est configurée, puis construit le site.
 * Sans base (aperçu non configuré), le site est construit avec les contenus
 * officiels de référence plutôt que d'échouer.
 */
import { execSync } from "node:child_process";

const executer = (commande) => execSync(commande, { stdio: "inherit" });
const base =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DIRECT_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL;

if (base) {
  executer("npx prisma migrate deploy");
  executer("npx tsx prisma/seed.ts");
  // Instance de démonstration : données fictives (le script refuse la production).
  if (process.env.NEXT_PUBLIC_MODE_DEMO === "1") executer("npx tsx scripts/demo/peupler.ts");
} else {
  console.warn("Aucune base de données configurée : contenus de référence utilisés.");
}
executer("npx next build");
