import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { adapterChaine } from "./connexion";

/**
 * Accès à la base de données. En production (Supabase), l'application passe
 * par la connexion mutualisée ; les migrations utilisent la connexion directe.
 */
function chaineConnexion() {
  const url = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;
  if (!url) console.warn("[base] Aucune base configurée : contenus de référence uniquement.");
  return adapterChaine(url);
}

const globalPourPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalPourPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: chaineConnexion() }) });

if (process.env.NODE_ENV !== "production") globalPourPrisma.prisma = db;
