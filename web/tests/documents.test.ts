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
      periode: null,
      resultat: null,
    });
    expect(civilite("F")).toBe("Madame");
  });

  it("montre le résultat proclamé (sans le détail des notes) pour un relevé", () => {
    const r = resumeVerification({
      nom: "BAHATI Grâce",
      matricule: "GI26001",
      sexe: "F",
      dateNaissance: null,
      lieuNaissance: null,
      promotion: "BAC1 GI",
      filiere: "Génie Informatique",
      niveau: "BAC 1",
      annee: "2026-2027",
      seuil: 10,
      resultat: {
        periode: "Résultat annuel",
        moyenne: 13.5,
        mention: { lettre: "C", libelle: "Bien" },
        decision: { code: "ADM", libelle: "Admis" },
        creditsValides: 60,
        creditsTotal: 60,
        proclameLe: "2027-07-10T10:00:00.000Z",
      },
      semestres: [
        {
          numero: 1,
          moyenne: 13.5,
          creditsAcquis: 30,
          creditsTotal: 30,
          cours: [{ intitule: "Analyse I", credits: 5, note: 14, valide: true }],
        },
      ],
    });
    expect(r.periode).toBe("Résultat annuel");
    expect(r.resultat).toEqual({
      moyenne: 13.5,
      mention: "C · Bien",
      credits: "60 sur 60",
      decision: "Admis",
    });
    expect(JSON.stringify(r)).not.toContain("Analyse I");
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
