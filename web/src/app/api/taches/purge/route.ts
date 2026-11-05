import { timingSafeEqual } from "node:crypto";
import { purgerDonneesExpirees } from "@/features/exploitation/purge";
import { journaliser } from "@/lib/journal";

/**
 * Purge quotidienne, déclenchée par la tâche planifiée de Vercel (vercel.json).
 * Vercel envoie « Authorization: Bearer <CRON_SECRET> » ; sans ce secret
 * configuré, la route refuse de s'exécuter.
 */
export async function GET(requete: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Tâche non configurée (CRON_SECRET).", { status: 503 });
  const recu = Buffer.from(requete.headers.get("authorization") ?? "");
  const attendu = Buffer.from(`Bearer ${secret}`);
  if (recu.length !== attendu.length || !timingSafeEqual(recu, attendu))
    return new Response("Non autorisé.", { status: 401 });

  const bilan = await purgerDonneesExpirees();
  await journaliser({ action: "purge_effectuee", entite: "Systeme", apres: bilan });
  return Response.json(bilan, { headers: { "Cache-Control": "no-store" } });
}
