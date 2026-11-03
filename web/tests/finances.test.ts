import { describe, expect, it } from "vitest";
import {
  baremeApplicable,
  estEnRegle,
  formatMontant,
  lireMontant,
  numeroRecu,
  retards,
  situation,
} from "@/features/finances/regles";

const inscription = { anneeId: "a", niveauId: "n1", filiereId: "f1" };

describe("barèmes", () => {
  it("s'appliquent à tous ou à un niveau, une filière précis", () => {
    expect(baremeApplicable({ anneeId: "a", niveauId: null, filiereId: null }, inscription)).toBe(
      true,
    );
    expect(baremeApplicable({ anneeId: "a", niveauId: "n1", filiereId: null }, inscription)).toBe(
      true,
    );
    expect(baremeApplicable({ anneeId: "a", niveauId: "n2", filiereId: null }, inscription)).toBe(
      false,
    );
    expect(baremeApplicable({ anneeId: "b", niveauId: null, filiereId: null }, inscription)).toBe(
      false,
    );
  });
});

describe("situation financière", () => {
  it("calcule le solde par devise, sans compenser dollars et francs", () => {
    const s = situation(
      [
        { montant: 300, devise: "USD" },
        { montant: 50000, devise: "CDF" },
      ],
      [
        { montant: 200, devise: "USD", annule: false },
        { montant: 100, devise: "USD", annule: true },
        { montant: 50000, devise: "CDF", annule: false },
      ],
      [{ montant: 50, devise: "USD" }],
    );
    expect(s).toEqual([
      { devise: "CDF", du: 50000, paye: 50000, exonere: 0, solde: 0 },
      { devise: "USD", du: 300, paye: 200, exonere: 50, solde: 50 },
    ]);
    expect(estEnRegle(s)).toBe(false);
  });

  it("est en règle quand tout est payé (un trop-perçu reste visible)", () => {
    const s = situation(
      [{ montant: 100, devise: "USD" }],
      [{ montant: 120, devise: "USD", annule: false }],
      [],
    );
    expect(s[0].solde).toBe(-20);
    expect(estEnRegle(s)).toBe(true);
  });

  it("signale un retard quand une échéance est passée et un solde reste dû", () => {
    const baremes = [{ montant: 100, devise: "USD" as const, echeance: new Date("2026-10-31") }];
    const s = situation(baremes, [], []);
    expect(retards(baremes, s, new Date("2026-11-04"))).toBe(true);
    expect(retards(baremes, s, new Date("2026-10-01"))).toBe(false);
  });
});

describe("reçus et saisie", () => {
  it("numérote les reçus par année", () => {
    expect(numeroRecu(2026, 42)).toBe("R2026-000042");
  });

  it("lit les montants saisis", () => {
    expect(lireMontant("150,50")).toBe(150.5);
    expect(lireMontant("50 000")).toBe(50000);
    expect(lireMontant("0")).toBeNull();
    expect(lireMontant("-5")).toBeNull();
    expect(lireMontant("abc")).toBeNull();
    expect(formatMontant(1500, "USD")).toMatch(/^1\s?500 \$$/);
  });
});
