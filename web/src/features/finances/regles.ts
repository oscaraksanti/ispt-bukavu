/**
 * Calcul de la situation financière d'un étudiant (fonctions pures, testées).
 * Chaque devise est suivie séparément : un montant en francs congolais ne se
 * compense pas avec un montant en dollars.
 */

export type Devise = "USD" | "CDF";

export const MODES_PAIEMENT = {
  BANQUE: "Banque",
  GUICHET: "Guichet de l'institut",
  MOBILE_MONEY: "Mobile money",
  AUTRE: "Autre",
} as const;

export function formatMontant(montant: number, devise: string) {
  const n = montant.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return devise === "USD" ? `${n} $` : `${n} FC`;
}

type Bareme = {
  anneeId: string;
  niveauId: string | null;
  filiereId: string | null;
  montant: number;
  devise: Devise;
  echeance: Date | null;
};

/** Un barème s'applique à une inscription si l'année concorde et que niveau et filière sont « tous » ou identiques. */
export function baremeApplicable(
  b: Pick<Bareme, "anneeId" | "niveauId" | "filiereId">,
  i: { anneeId: string; niveauId: string; filiereId: string },
) {
  return (
    b.anneeId === i.anneeId &&
    (!b.niveauId || b.niveauId === i.niveauId) &&
    (!b.filiereId || b.filiereId === i.filiereId)
  );
}

export type LigneSituation = {
  devise: Devise;
  du: number;
  paye: number;
  exonere: number;
  solde: number;
};

const arrondir = (n: number) => Math.round(n * 100) / 100;

export function situation(
  baremes: Pick<Bareme, "montant" | "devise">[],
  paiements: { montant: number; devise: Devise; annule: boolean }[],
  exonerations: { montant: number; devise: Devise }[],
): LigneSituation[] {
  const devises = new Set<Devise>([
    ...baremes.map((b) => b.devise),
    ...paiements.filter((p) => !p.annule).map((p) => p.devise),
    ...exonerations.map((e) => e.devise),
  ]);
  return [...devises].sort().map((devise) => {
    const du = baremes.filter((b) => b.devise === devise).reduce((t, b) => t + b.montant, 0);
    const paye = paiements
      .filter((p) => p.devise === devise && !p.annule)
      .reduce((t, p) => t + p.montant, 0);
    const exonere = exonerations
      .filter((e) => e.devise === devise)
      .reduce((t, e) => t + e.montant, 0);
    return {
      devise,
      du: arrondir(du),
      paye: arrondir(paye),
      exonere: arrondir(exonere),
      solde: arrondir(du - paye - exonere),
    };
  });
}

/** En règle quand plus rien n'est dû dans aucune devise. */
export function estEnRegle(lignes: LigneSituation[]) {
  return lignes.every((l) => l.solde <= 0);
}

/** Barèmes échus et non couverts : ce qui reste dû après les paiements, dans l'ordre des échéances. */
export function retards(
  baremes: Pick<Bareme, "montant" | "devise" | "echeance">[],
  lignes: LigneSituation[],
  maintenant = new Date(),
) {
  return lignes
    .filter((l) => l.solde > 0)
    .some((l) =>
      baremes.some((b) => b.devise === l.devise && b.echeance !== null && b.echeance < maintenant),
    );
}

export function numeroRecu(annee: number, rang: number) {
  return `R${annee}-${String(rang).padStart(6, "0")}`;
}

/** Montant saisi (« 150 », « 150,50 ») ou null s'il est invalide. */
export function lireMontant(saisie: string) {
  const t = saisie.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(t)) return null;
  const v = Number(t);
  return v > 0 ? v : null;
}
