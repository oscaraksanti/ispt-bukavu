import "server-only";
import { db } from "@/lib/db";
import { libellePeriode } from "./donnees";
import { decisionFinale, type LigneCours, type Periode } from "./regles";

/** Résultats proclamés d'un étudiant, toutes années confondues (le plus récent d'abord). */
export async function resultatsProclames(etudiantId: string) {
  const lignes = await db.resultatDeliberation.findMany({
    where: { etudiantId, deliberation: { statut: "PROCLAMEE" } },
    include: {
      deliberation: {
        include: { promotion: { include: { annee: true, niveau: true, filiere: true } } },
      },
      document: { select: { id: true, code: true, revoqueLe: true } },
    },
  });
  return lignes
    .map((r) => ({
      id: r.id,
      periode: r.deliberation.periode as Periode,
      semestre: r.deliberation.semestre,
      libelle: libellePeriode({
        periode: r.deliberation.periode as Periode,
        semestre: r.deliberation.semestre,
      }),
      annee: r.deliberation.promotion.annee.libelle,
      anneeDebut: r.deliberation.promotion.annee.debut,
      niveau: r.deliberation.promotion.niveau.code,
      moyenne: r.moyenne === null ? null : Number(r.moyenne),
      creditsValides: r.creditsValides,
      creditsTotal: r.creditsTotal,
      mention: r.mention ? `${r.mention} – ${r.mentionLibelle}` : null,
      rang: r.rang,
      decision: decisionFinale(r.decisionProposee, r.decisionJury),
      proclameLe: r.deliberation.proclameLe,
      documentId: r.document && !r.document.revoqueLe ? r.document.id : null,
      details: r.details as LigneCours[],
      anneeId: r.deliberation.promotion.anneeId,
    }))
    .sort(
      (a, b) =>
        b.anneeDebut.getTime() - a.anneeDebut.getTime() ||
        (b.periode === "ANNUELLE" ? 1 : 0) - (a.periode === "ANNUELLE" ? 1 : 0) ||
        b.semestre - a.semestre,
    );
}

/** Crédits acquis par année : le résultat annuel s'il est proclamé, sinon la somme des semestres. */
export function creditsAcquis(resultats: Awaited<ReturnType<typeof resultatsProclames>>) {
  let total = 0;
  for (const [, liste] of Map.groupBy(resultats, (r) => r.anneeId)) {
    const annuel = liste.find((r) => r.periode === "ANNUELLE");
    total += annuel
      ? annuel.creditsValides
      : liste.filter((r) => r.periode === "SEMESTRE").reduce((t, r) => t + r.creditsValides, 0);
  }
  return total;
}
