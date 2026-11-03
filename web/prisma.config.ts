import "dotenv/config";
import { defineConfig } from "prisma/config";

// La CLI (migrations) utilise une connexion directe ; l'application utilise
// DATABASE_URL (connexion mutualisée en production, voir src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
