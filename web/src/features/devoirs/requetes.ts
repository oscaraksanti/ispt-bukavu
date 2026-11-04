import "server-only";
import { db } from "@/lib/db";

/** Devoirs d'un cours, échéance la plus proche d'abord, avec le nombre de copies. */
export function devoirsDuCours(coursOffertId: string) {
  return db.devoir.findMany({
    where: { coursOffertId },
    include: {
      _count: { select: { remises: true } },
      remises: { where: { corrigeLe: { not: null } }, select: { id: true } },
    },
    orderBy: { echeance: "desc" },
  });
}

/** Devoirs d'un cours vus par un étudiant, avec sa copie éventuelle. */
export function devoirsDeLEtudiant(coursOffertId: string, etudiantId: string) {
  return db.devoir.findMany({
    where: { coursOffertId },
    include: { remises: { where: { etudiantId } } },
    orderBy: { echeance: "desc" },
  });
}
