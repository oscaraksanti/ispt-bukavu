import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Accès à la base de données. En production (Supabase), l'application passe
 * par la connexion mutualisée ; les migrations utilisent la connexion directe.
 */
function chaineConnexion() {
  const url = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Aucune base de données configurée (DATABASE_URL).");
  return url;
}

const globalPourPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalPourPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: chaineConnexion() }) });

if (process.env.NODE_ENV !== "production") globalPourPrisma.prisma = db;
