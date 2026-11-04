import { describe, expect, it } from "vitest";
import {
  campagneOuverte,
  decisionPermise,
  dossierModifiable,
  elementsManquants,
  espaceParDefaut,
  etatPaiement,
  fraisExiges,
  motifRequis,
  numeroCandidature,
  numeroRecuDossier,
  paiementCorrigeable,
  statistiquesCampagne,
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

describe("frais de dossier", () => {
  it("n'exige une référence que si la campagne fixe des frais", () => {
    const dossier = {
      nom: "A",
      prenom: "B",
      sexe: "F",
      dateNaissance: new Date("2005-01-01"),
      lieuNaissance: "Bukavu",
      nationalite: "Congolaise",
      telephone: "0990000000",
      adresse: "Ibanda",
      ecoleOrigine: "Institut",
      sectionHumanites: "Scientifique",
      anneeDiplome: 2025,
      filiereId: "f",
      referencePaiement: null,
    };
    expect(elementsManquants(dossier, [], [])).toEqual(["Référence du paiement des frais"]);
    expect(elementsManquants(dossier, [], [], { fraisExiges: false })).toEqual([]);
    expect(fraisExiges({ fraisInscription: "0" })).toBe(false);
    expect(fraisExiges({ fraisInscription: "25.00" })).toBe(true);
  });

  it("suit l'état du paiement jusqu'à la vérification par la caisse", () => {
    expect(etatPaiement({ referencePaiement: "X" }, false)).toBe("SANS_FRAIS");
    expect(etatPaiement({ referencePaiement: " " }, true)).toBe("A_SAISIR");
    expect(etatPaiement({ referencePaiement: "BK-12" }, true)).toBe("A_VERIFIER");
    expect(etatPaiement({ referencePaiement: "BK-12", paiementMotifRefus: "Inconnu" }, true)).toBe(
      "REFUSE",
    );
    expect(etatPaiement({ referencePaiement: "BK-12", paiementVerifieLe: new Date() }, true)).toBe(
      "VERIFIE",
    );
  });

  it("ne laisse corriger qu'une référence refusée, sur un dossier encore en cours", () => {
    expect(paiementCorrigeable("SOUMISE", "REFUSE")).toBe(true);
    expect(paiementCorrigeable("EN_EXAMEN", "REFUSE")).toBe(true);
    expect(paiementCorrigeable("SOUMISE", "A_VERIFIER")).toBe(false);
    expect(paiementCorrigeable("ADMISE", "REFUSE")).toBe(false);
    expect(numeroRecuDossier(2026, 7)).toBe("AD-2026-0007");
  });
});

describe("suivi d'une campagne", () => {
  const jour = (n: number) => new Date(Date.UTC(2026, 10, n));
  it("compte les dossiers, les filières, le délai médian et le taux d'admission", () => {
    const s = statistiquesCampagne([
      {
        statut: "BROUILLON",
        filiere: null,
        soumiseLe: null,
        decideLe: null,
        etatPaiement: "A_SAISIR",
      },
      {
        statut: "SOUMISE",
        filiere: "GI",
        soumiseLe: jour(1),
        decideLe: null,
        etatPaiement: "A_VERIFIER",
      },
      {
        statut: "ADMISE",
        filiere: "GI",
        soumiseLe: jour(1),
        decideLe: jour(3),
        etatPaiement: "VERIFIE",
      },
      {
        statut: "INSCRITE",
        filiere: "EM",
        soumiseLe: jour(2),
        decideLe: jour(6),
        etatPaiement: "VERIFIE",
      },
      {
        statut: "REFUSEE",
        filiere: "GI",
        soumiseLe: jour(2),
        decideLe: jour(8),
        etatPaiement: "VERIFIE",
      },
    ]);
    expect(s.comptesOuverts).toBe(5);
    expect(s.deposes).toBe(4);
    expect(s.enAttente).toBe(1);
    expect(s.delaiMedianJours).toBe(4);
    expect(s.tauxAdmission).toBe(67);
    expect(s.paiementsAVerifier).toBe(1);
    expect(s.parFiliere).toEqual([
      { nom: "GI", deposes: 3, admis: 1 },
      { nom: "EM", deposes: 1, admis: 1 },
    ]);
  });

  it("n'affiche ni délai ni taux sans décision", () => {
    const s = statistiquesCampagne([]);
    expect(s.delaiMedianJours).toBeNull();
    expect(s.tauxAdmission).toBeNull();
  });
});
