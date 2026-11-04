import { describe, expect, it } from "vitest";
import {
  civilite,
  formatCodeValide,
  normaliserCodeDocument,
  resumeVerification,
} from "@/features/documents/regles";
import { codeVerification } from "@/lib/securite";

describe("codes de vérification", () => {
  it("sont lisibles, sans caractères ambigus, et reconnus après saisie", () => {
    for (let i = 0; i < 50; i++) {
      const c = codeVerification(12);
      expect(formatCodeValide(c)).toBe(true);
      expect(c).not.toMatch(/[01OIL]/);
      expect(normaliserCodeDocument(c.toLowerCase().replace(/-/g, " "))).toBe(c);
    }
  });

  it("refusent un format inattendu", () => {
    expect(formatCodeValide("ABCD-EFGH")).toBe(false);
    expect(formatCodeValide("ABCD-EFGH-IJK0")).toBe(false);
  });
});

describe("contenu affiché", () => {
  it("ne révèle à un tiers que l'identité et la promotion", () => {
    const r = resumeVerification({
      nom: "BAHATI Grâce",
      matricule: "GI26001",
      sexe: "F",
      dateNaissance: "2006-04-12",
      lieuNaissance: "Bukavu",
      promotion: "BAC1 GI",
      filiere: "Génie Informatique",
      niveau: "BAC 1",
      annee: "2026-2027",
      seuil: 10,
      semestres: [],
    });
    expect(r).toEqual({
      nom: "BAHATI Grâce",
      matricule: "GI26001",
      promotion: "BAC 1 · Génie Informatique",
      annee: "2026-2027",
    });
    expect(civilite("F")).toBe("Madame");
  });
});

import { statutSelonDates, typeDepuisCategorie } from "@/features/stages/regles";

describe("stages", () => {
  it("déduit le statut des dates", () => {
    const d = new Date("2026-11-10"),
      f = new Date("2026-12-20");
    expect(statutSelonDates(d, f, new Date("2026-11-01"))).toBe("PREVU");
    expect(statutSelonDates(d, f, new Date("2026-11-15"))).toBe("EN_COURS");
    expect(statutSelonDates(d, f, new Date("2027-01-05"))).toBe("TERMINE");
    expect(statutSelonDates(null, null)).toBe("PREVU");
  });

  it("reprend les lieux de stage des partenaires", () => {
    expect(typeDepuisCategorie("STAGE_PEDAGOGIQUE")).toBe("PEDAGOGIQUE");
    expect(typeDepuisCategorie("EMPLOYEUR")).toBeNull();
  });
});
