import "server-only";
import { db } from "@/lib/db";

/**
 * Frais de dossier présentés à la caisse : références à vérifier, et celles
 * vérifiées depuis 24 heures (la caisse retrouve ainsi le reçu qu'elle vient
 * d'émettre).
 */
export async function fraisDossierPourLaCaisse() {
  return db.candidature.findMany({
    where: {
      statut: { notIn: ["BROUILLON", "ABANDONNEE"] },
      referencePaiement: { not: null },
      paiementMotifRefus: null,
      campagne: { fraisInscription: { gt: 0 } },
      OR: [
        { paiementVerifieLe: null },
        { paiementVerifieLe: { gte: new Date(Date.now() - 86_400_000) } },
      ],
    },
    include: { campagne: true },
    orderBy: { soumiseLe: "asc" },
    take: 100,
  });
}
