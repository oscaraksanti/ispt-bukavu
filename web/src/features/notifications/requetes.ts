import "server-only";
import { db } from "@/lib/db";

export function compterNonLues(utilisateurId: string) {
  return db.notification.count({ where: { utilisateurId, lueLe: null } });
}

export function notificationsDe(utilisateurId: string, limite = 100) {
  return db.notification.findMany({
    where: { utilisateurId },
    orderBy: { creeLe: "desc" },
    take: limite,
  });
}
