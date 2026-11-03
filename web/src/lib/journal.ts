import "server-only";
import { db } from "@/lib/db";

/** Trace une action sensible dans le journal d'activité. */
export async function journaliser(entree: {
  auteurId?: string | null;
  action: string;
  entite: string;
  entiteId?: string | null;
  avant?: unknown;
  apres?: unknown;
}) {
  await db.journalActivite.create({
    data: {
      auteurId: entree.auteurId ?? null,
      action: entree.action,
      entite: entree.entite,
      entiteId: entree.entiteId ?? null,
      avant: entree.avant === undefined ? undefined : JSON.parse(JSON.stringify(entree.avant)),
      apres: entree.apres === undefined ? undefined : JSON.parse(JSON.stringify(entree.apres)),
    },
  });
}
