import "server-only";
import { db } from "@/lib/db";
import { baremeApplicable, type Devise, retards, situation } from "./regles";

/** Situation financière d'un étudiant pour l'année courante. */
export async function situationEtudiant(etudiantId: string) {
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) return null;
  const [inscription, baremes, paiements, exonerations] = await Promise.all([
    db.inscription.findFirst({
      where: { etudiantId, promotion: { anneeId: annee.id } },
      include: { promotion: true },
    }),
    db.baremeFrais.findMany({
      where: { anneeId: annee.id },
      orderBy: [{ echeance: "asc" }, { libelle: "asc" }],
    }),
    db.paiement.findMany({
      where: { etudiantId, anneeId: annee.id },
      include: { enregistrePar: { select: { prenom: true, nom: true } } },
      orderBy: { payeLe: "desc" },
    }),
    db.exoneration.findMany({
      where: { etudiantId, anneeId: annee.id },
      orderBy: { creeLe: "desc" },
    }),
  ]);
  const applicables = inscription
    ? baremes.filter((b) =>
        baremeApplicable(b, {
          anneeId: annee.id,
          niveauId: inscription.promotion.niveauId,
          filiereId: inscription.promotion.filiereId,
        }),
      )
    : [];
  const lignes = situation(
    applicables.map((b) => ({ montant: Number(b.montant), devise: b.devise as Devise })),
    paiements.map((p) => ({
      montant: Number(p.montant),
      devise: p.devise as Devise,
      annule: !!p.annuleLe,
    })),
    exonerations.map((e) => ({ montant: Number(e.montant), devise: e.devise as Devise })),
  );
  return {
    annee,
    inscription,
    baremes: applicables,
    paiements,
    exonerations,
    lignes,
    enRetard: retards(
      applicables.map((b) => ({
        montant: Number(b.montant),
        devise: b.devise as Devise,
        echeance: b.echeance,
      })),
      lignes,
    ),
  };
}
