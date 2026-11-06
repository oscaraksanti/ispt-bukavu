import { connection } from "next/server";
import { db } from "@/lib/db";

/**
 * Contrôle de disponibilité (UptimeRobot) : répond 200 si la base de données
 * répond, 503 sinon. Ne renvoie aucune donnée ; jamais mis en cache.
 */
export async function GET() {
  await connection();
  const entetes = { "Cache-Control": "no-store" };
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, refus) => setTimeout(() => refus(new Error("délai")), 5000)),
    ]);
    return Response.json({ etat: "ok" }, { headers: entetes });
  } catch {
    return Response.json({ etat: "base injoignable" }, { status: 503, headers: entetes });
  }
}
