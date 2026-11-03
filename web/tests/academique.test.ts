import { describe, expect, it } from "vitest";
import { lireRegistre, separerNomComplet } from "@/features/academique/registre";

describe("noms des registres", () => {
  it("sépare nom et post-nom en capitales du prénom", () => {
    expect(separerNomComplet("BAHATI MUKENGERE Grâce")).toEqual({
      nom: "BAHATI",
      postnom: "MUKENGERE",
      prenom: "Grâce",
    });
    expect(separerNomComplet("AMANI Jean-Paul")).toEqual({
      nom: "AMANI",
      postnom: null,
      prenom: "Jean-Paul",
    });
  });

  it("prend le dernier mot comme prénom quand tout est en capitales", () => {
    expect(separerNomComplet("BISIMWA CIRHUZA ESPOIR")).toEqual({
      nom: "BISIMWA",
      postnom: "CIRHUZA",
      prenom: "ESPOIR",
    });
  });
});

describe("import d'un registre", () => {
  it("lit le format de l'institut (N°, nom complet, sexe, matricule)", () => {
    const csv =
      "N°;Nom, post-nom et prénom;Sexe;Matricule\n1;BAHATI MUKENGERE Grâce;F;ispt 25 001\n2;AMANI Jean;M;ISPT25002\n";
    const r = lireRegistre(csv);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({
      nom: "BAHATI",
      prenom: "Grâce",
      sexe: "F",
      matricule: "ISPT25001",
    });
    expect(r[1].erreur).toBeUndefined();
  });

  it("détecte la virgule comme séparateur et les guillemets", () => {
    const r = lireRegistre(
      'N°,"Nom, post-nom et prénom",Sexe,Matricule,Email\n1,"KAJA Ruth",F,A-1,ruth@example.org',
    );
    expect(r[0]).toMatchObject({ nom: "KAJA", prenom: "Ruth", email: "ruth@example.org" });
  });

  it("signale doublons et matricules manquants", () => {
    const r = lireRegistre("Nom;Sexe;Matricule\nA B;M;XA1\nC D;F;XA1\nE F;M;\n");
    expect(r.map((l) => l.erreur)).toEqual([
      undefined,
      "Matricule en double dans le fichier",
      "Matricule manquant",
    ]);
  });

  it("refuse un fichier sans colonnes reconnues", () => {
    expect(lireRegistre("a;b\n1;2")).toEqual([]);
  });
});

import { formaterCode, normaliserCode, semestresDuNiveau } from "@/features/academique/regles";

describe("structure LMD", () => {
  it("associe deux semestres à chaque niveau", () => {
    expect(semestresDuNiveau(1)).toEqual([1, 2]);
    expect(semestresDuNiveau(4)).toEqual([7, 8]);
  });

  it("présente et relit les codes d'activation", () => {
    expect(formaterCode("ABCDEFGHJK")).toBe("ABCD-EFGH-JK");
    expect(normaliserCode(" abcd-efgh jk ")).toBe("ABCDEFGHJK");
  });
});
