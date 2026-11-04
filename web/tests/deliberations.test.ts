import { describe, expect, it } from "vitest";
import {
  arrondirMoyenne,
  calculerEtudiant,
  calculerPromotion,
  controles,
  type CoursEtudiant,
  mentionDe,
  REGLEMENT_PAR_DEFAUT,
  reglementComplet,
  statistiquesSession,
} from "@/features/deliberations/regles";
import {
  CREDITS,
  DECISIONS_DU_JURY,
  EXEMPLE_BULLETIN,
  NOTES,
  SEMESTRES,
} from "./fixtures/deliberation-anonyme";

const R = REGLEMENT_PAR_DEFAUT;
const cours = (notes: (number | null)[], semestre?: number): CoursEtudiant[] =>
  notes
    .map((note, i) => ({
      coursId: `c${i}`,
      intitule: `Cours ${i + 1}`,
      ue: `UE${i + 1}`,
      semestre: SEMESTRES[i],
      credits: CREDITS[i],
      note,
    }))
    .filter((c) => semestre === undefined || c.semestre === semestre);

describe("délibération : données réelles anonymisées (BAC 1, 2023-2024)", () => {
  it("redonne les 16 décisions du jury", () => {
    const res = calculerPromotion(
      NOTES.map((n, i) => ({ etudiantId: `e${i}`, cours: cours(n) })),
      R,
      "ANNUELLE",
    );
    expect(res.map((r) => r.decision)).toEqual(DECISIONS_DU_JURY);
  });

  it("redonne les moyennes du bulletin officiel (12, 12 et 12)", () => {
    const n = NOTES[EXEMPLE_BULLETIN];
    expect(calculerEtudiant("x", cours(n, 1), R, "SEMESTRE").moyenne).toBe(12);
    expect(calculerEtudiant("x", cours(n, 2), R, "SEMESTRE").moyenne).toBe(12);
    expect(calculerEtudiant("x", cours(n), R, "ANNUELLE").moyenne).toBe(12);
  });

  it("compte les crédits de l'année et classe la promotion", () => {
    const res = calculerPromotion(
      NOTES.map((n, i) => ({ etudiantId: `e${i}`, cours: cours(n) })),
      R,
      "ANNUELLE",
    );
    expect(res.every((r) => r.creditsTotal === 60)).toBe(true);
    expect(res.filter((r) => r.rang === 1)).toHaveLength(1);
  });
});

describe("règles de calcul", () => {
  it("arrondit selon les trois modes", () => {
    expect(arrondirMoyenne(10.34, "JURY")).toBe(10);
    expect(arrondirMoyenne(10.35, "JURY")).toBe(10.5);
    expect(arrondirMoyenne(10.74, "JURY")).toBe(10.5);
    expect(arrondirMoyenne(10.75, "JURY")).toBe(11);
    expect(arrondirMoyenne(10.24, "DEMI_POINT")).toBe(10);
    expect(arrondirMoyenne(10.26, "DEMI_POINT")).toBe(10.5);
    expect(arrondirMoyenne(10.256, "AUCUN")).toBe(10.26);
  });

  it("attribue les mentions de A à G", () => {
    expect(mentionDe(18, R.mentions)?.lettre).toBe("A");
    expect(mentionDe(13.5, R.mentions)?.lettre).toBe("D");
    expect(mentionDe(7.5, R.mentions)?.lettre).toBe("G");
    expect(mentionDe(null, R.mentions)).toBeNull();
  });

  const deux = (a: number | null, b: number | null): CoursEtudiant[] => [
    { coursId: "a", intitule: "A", ue: "U1", semestre: 1, credits: 4, note: a },
    { coursId: "b", intitule: "B", ue: "U1", semestre: 1, credits: 2, note: b },
  ];

  it("valide par UE en compensant les cours d'une même UE", () => {
    const parCours = calculerEtudiant("x", deux(12, 8), R, "ANNUELLE");
    expect(parCours.creditsValides).toBe(4);
    expect(parCours.decision).toBe("COMP");
    const parUe = calculerEtudiant("x", deux(12, 8), { ...R, niveauValidation: "UE" }, "ANNUELLE");
    expect(parUe.creditsValides).toBe(6);
    expect(parUe.decision).toBe("ADM");
  });

  it("applique le plafond de crédits non validés pour l'admission avec dette", () => {
    const r = calculerEtudiant("x", deux(14, 8), { ...R, plafondCreditsDette: 1 }, "ANNUELLE");
    expect(r.decision).toBe("RATTRAPAGE");
  });

  it("bloque la décision d'un cours non présenté si le règlement l'exige", () => {
    expect(calculerEtudiant("x", deux(16, null), R, "ANNUELLE").decision).toBe("COMP");
    const bloque = calculerEtudiant(
      "x",
      deux(14, null),
      { ...R, coursNonPresente: "BLOQUANT" },
      "ANNUELLE",
    );
    expect(bloque.decision).toBe("INCOMPLET");
    expect(bloque.moyenne).toBeNull();
  });

  it("calcule une moyenne simple si demandé", () => {
    expect(
      calculerEtudiant(
        "x",
        deux(12, 8),
        { ...R, calculMoyenne: "SIMPLE", arrondi: "AUCUN" },
        "SEMESTRE",
      ).moyenne,
    ).toBe(10);
    expect(calculerEtudiant("x", deux(12, 8), { ...R, arrondi: "AUCUN" }, "SEMESTRE").moyenne).toBe(
      10.67,
    );
  });

  it("signale les cas limites au jury", () => {
    const r = calculerEtudiant("x", deux(9.8, 9.8), R, "ANNUELLE");
    expect(r.casLimite).toMatch(/de 10/);
    expect(calculerEtudiant("x", deux(15, 15), R, "ANNUELLE").casLimite).toBeNull();
  });

  it("ne décide rien pour un semestre seul", () => {
    expect(calculerEtudiant("x", deux(12, 12), R, "SEMESTRE").decision).toBeNull();
  });

  it("complète un règlement partiel", () => {
    const r = reglementComplet({ seuilValidation: 12 });
    expect(r.seuilValidation).toBe(12);
    expect(r.mentions).toHaveLength(7);
    expect(r.decisions.ADM).toBe("Admis(e) sans dette");
  });
});

describe("contrôles et statistiques", () => {
  it("empêche de clôturer sans motif pour une décision modifiée", () => {
    const c = controles(
      [
        {
          coursNonPresentes: 0,
          casLimite: null,
          decisionJury: "ADM",
          motifJury: " ",
          decision: "COMP",
        },
      ],
      [],
    );
    expect(c.bloquants.join()).toMatch(/sans motif/);
  });

  it("signale les cours sans note publiée", () => {
    expect(controles([], ["Analyse I"]).bloquants.length).toBe(2);
  });

  it("classe les cours du plus difficile au plus réussi", () => {
    const res = calculerPromotion(
      NOTES.map((n, i) => ({ etudiantId: `e${i}`, cours: cours(n) })),
      R,
      "ANNUELLE",
    );
    const s = statistiquesSession(res, 10);
    expect(s.effectif).toBe(16);
    expect(s.cours[0].tauxValidation).toBeLessThanOrEqual(s.cours.at(-1)!.tauxValidation);
  });
});
