import { describe, expect, it } from "vitest";
import {
  bilanSemestre,
  lireNote,
  noteCours,
  ponderationDisponible,
  statistiques,
  transitionPermise,
} from "@/features/notes/regles";

const ev = (
  ponderation: number,
  valeur: number | null,
  statut = "PUBLIEE" as const,
  absent = false,
) => ({
  ponderation,
  statut,
  note: { valeur, absent },
});

describe("note d'un cours", () => {
  it("pondère les évaluations publiées", () => {
    expect(noteCours([ev(40, 12), ev(60, 15)])).toBe(13.8);
  });

  it("ignore les évaluations non publiées", () => {
    expect(noteCours([ev(40, 12), { ...ev(60, 2), statut: "VALIDEE" }])).toBe(12);
    expect(noteCours([{ ...ev(100, 15), statut: "BROUILLON" }])).toBeNull();
  });

  it("compte une absence ou une note manquante pour zéro", () => {
    expect(noteCours([ev(50, 16), ev(50, 18, "PUBLIEE", true)])).toBe(8);
    expect(noteCours([ev(50, 16), { ponderation: 50, statut: "PUBLIEE", note: null }])).toBe(8);
  });
});

describe("bilan du semestre", () => {
  it("pondère par les crédits et compte les crédits acquis", () => {
    const b = bilanSemestre(
      [
        { credits: 4, note: 14 },
        { credits: 2, note: 8 },
        { credits: 3, note: null },
      ],
      10,
    );
    expect(b).toEqual({ moyenne: 12, creditsAcquis: 4, creditsTotal: 9, coursNotes: 2 });
  });

  it("n'a pas de moyenne sans note", () => {
    expect(bilanSemestre([{ credits: 3, note: null }], 10).moyenne).toBeNull();
  });
});

describe("saisie", () => {
  it("lit les notes sur 20, avec virgule ou point", () => {
    expect(lireNote("12,5")).toBe(12.5);
    expect(lireNote(" 20 ")).toBe(20);
    expect(lireNote("")).toBeNull();
    expect(lireNote("21")).toBe("invalide");
    expect(lireNote("abc")).toBe("invalide");
    expect(lireNote("-1")).toBe("invalide");
  });

  it("limite le poids total des évaluations à 100 %", () => {
    expect(ponderationDisponible([40, 30], 30)).toBe(true);
    expect(ponderationDisponible([40, 30], 31)).toBe(false);
  });
});

describe("circuit des notes", () => {
  it("l'enseignant transmet, le secrétariat valide puis publie", () => {
    expect(transitionPermise("BROUILLON", "SOUMISE", "enseignant")).toBe(true);
    expect(transitionPermise("SOUMISE", "PUBLIEE", "enseignant")).toBe(false);
    expect(transitionPermise("SOUMISE", "VALIDEE", "secretariat")).toBe(true);
    expect(transitionPermise("VALIDEE", "PUBLIEE", "secretariat")).toBe(true);
    expect(transitionPermise("BROUILLON", "PUBLIEE", "secretariat")).toBe(false);
  });

  it("résume une évaluation", () => {
    expect(
      statistiques(
        [
          { valeur: 8, absent: false },
          { valeur: 14, absent: false },
          { valeur: null, absent: true },
        ],
        10,
      ),
    ).toEqual({ moyenne: 11, min: 8, max: 14, reussite: 50, absents: 1 });
  });
});
