import { describe, expect, it } from "vitest";
import {
  campagneOuverte,
  decisionPermise,
  dossierModifiable,
  elementsManquants,
  espaceParDefaut,
  motifRequis,
  numeroCandidature,
} from "@/features/admissions/regles";
import { ROLES_PERSONNEL } from "@/lib/permissions";

const complet = {
  nom: "N",
  prenom: "P",
  sexe: "F",
  dateNaissance: new Date("2006-01-01"),
  lieuNaissance: "Bukavu",
  nationalite: "Congolaise",
  telephone: "0990000000",
  adresse: "Ibanda",
  ecoleOrigine: "Institut",
  sectionHumanites: "Électricité",
  anneeDiplome: 2025,
  filiereId: "f1",
  referencePaiement: "REF-1",
};
const pieces = [
  { id: "p1", libelle: "Bulletins", obligatoire: true },
  { id: "p2", libelle: "Photo", obligatoire: false },
];

describe("dossier de candidature", () => {
  it("est complet quand champs et pièces obligatoires sont présents", () => {
    expect(
      elementsManquants(complet, pieces, [{ pieceExigeeId: "p1", statut: "DEPOSEE" }]),
    ).toEqual([]);
  });

  it("signale les champs vides et les pièces absentes ou refusées", () => {
    expect(elementsManquants({ ...complet, adresse: "  " }, pieces, [])).toEqual([
      "Adresse",
      "Bulletins",
    ]);
    expect(
      elementsManquants(complet, pieces, [{ pieceExigeeId: "p1", statut: "REJETEE" }]),
    ).toEqual(["Bulletins"]);
  });

  it("n'est modifiable qu'en préparation ou sur demande de complément", () => {
    expect(dossierModifiable("BROUILLON")).toBe(true);
    expect(dossierModifiable("COMPLEMENT")).toBe(true);
    expect(dossierModifiable("SOUMISE")).toBe(false);
    expect(dossierModifiable("ADMISE")).toBe(false);
  });
});

describe("décisions du secrétariat", () => {
  it("suit le circuit prévu", () => {
    expect(decisionPermise("SOUMISE", "ADMISE")).toBe(true);
    expect(decisionPermise("EN_EXAMEN", "COMPLEMENT")).toBe(true);
    expect(decisionPermise("BROUILLON", "ADMISE")).toBe(false);
    expect(decisionPermise("ADMISE", "REFUSEE")).toBe(false);
    expect(decisionPermise("REFUSEE", "EN_EXAMEN")).toBe(true);
  });

  it("exige un motif pour un refus ou une demande de complément", () => {
    expect(motifRequis("REFUSEE")).toBe(true);
    expect(motifRequis("COMPLEMENT")).toBe(true);
    expect(motifRequis("ADMISE")).toBe(false);
  });
});

describe("campagnes", () => {
  const c = {
    statut: "OUVERTE",
    ouverture: new Date("2026-08-01"),
    cloture: new Date("2026-10-31"),
  };
  it("n'est ouverte qu'entre ses dates et si elle est publiée", () => {
    expect(campagneOuverte(c, new Date("2026-09-01"))).toBe(true);
    expect(campagneOuverte(c, new Date("2026-11-01"))).toBe(false);
    expect(campagneOuverte({ ...c, statut: "BROUILLON" }, new Date("2026-09-01"))).toBe(false);
  });

  it("numérote les dossiers par année", () => {
    expect(numeroCandidature(2026, 7)).toBe("2026-0007");
  });
});

describe("espace après connexion", () => {
  it("dirige chacun vers son espace", () => {
    expect(espaceParDefaut(["communication"], ROLES_PERSONNEL)).toBe("/admin");
    expect(espaceParDefaut(["candidat"], ROLES_PERSONNEL)).toBe("/candidat");
    expect(espaceParDefaut([], ROLES_PERSONNEL)).toBe("/");
  });
});

import { lirePieces } from "@/features/admissions/regles";

describe("pièces d'une campagne", () => {
  it("lit une pièce par ligne et repère les pièces facultatives", () => {
    expect(lirePieces("Bulletins de 5e et 6e\n\n  Photo d'identité (facultatif)\n")).toEqual([
      { libelle: "Bulletins de 5e et 6e", obligatoire: true, ordre: 0 },
      { libelle: "Photo d'identité", obligatoire: false, ordre: 1 },
    ]);
  });
});
