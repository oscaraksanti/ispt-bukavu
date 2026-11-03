import { describe, expect, it } from "vitest";
import { espaceParDefaut } from "@/features/admissions/regles";
import {
  ciblesAutorisees,
  concerne,
  estEnLigne,
  exigeValidation,
  peutViserCours,
  tauxLecture,
} from "@/features/valve/regles";
import { ROLES_PERSONNEL } from "@/lib/permissions";

const auteur = (permissions: string[], coursOfferts: string[] = []) => ({
  permissions: new Set(permissions),
  coursOfferts,
});

describe("auteurs de communiqués", () => {
  it("limite un enseignant aux étudiants de ses cours", () => {
    const e = auteur([], ["co1"]);
    expect(ciblesAutorisees(e)).toEqual(["COURS"]);
    expect(peutViserCours(e, "co1")).toBe(true);
    expect(peutViserCours(e, "co2")).toBe(false);
  });

  it("ouvre l'institut et le public aux autorités", () => {
    const d = auteur(["valve.publier", "valve.publier.institut", "valve.valider"]);
    expect(ciblesAutorisees(d)).toEqual(["PUBLIC", "INSTITUT", "FILIERE", "PROMOTION", "COURS"]);
    expect(exigeValidation("INSTITUT", d)).toBe(false);
  });

  it("soumet à validation un communiqué institutionnel d'un non-validateur", () => {
    const s = auteur(["valve.publier", "valve.publier.institut"]);
    expect(exigeValidation("PUBLIC", s)).toBe(true);
    expect(exigeValidation("PROMOTION", s)).toBe(false);
  });
});

describe("destinataires", () => {
  const ctx = { filieres: ["f1"], promotions: ["p1"], coursOfferts: ["c1"] };
  const base = { filiereId: null, promotionId: null, coursOffertId: null };
  it("ne montre à l'étudiant que ce qui le concerne", () => {
    expect(concerne({ ...base, cible: "INSTITUT" }, ctx)).toBe(true);
    expect(concerne({ ...base, cible: "FILIERE", filiereId: "f1" }, ctx)).toBe(true);
    expect(concerne({ ...base, cible: "FILIERE", filiereId: "f2" }, ctx)).toBe(false);
    expect(concerne({ ...base, cible: "PROMOTION", promotionId: "p2" }, ctx)).toBe(false);
    expect(concerne({ ...base, cible: "COURS", coursOffertId: "c1" }, ctx)).toBe(true);
  });

  it("respecte la publication et l'expiration", () => {
    const now = new Date("2026-11-04T10:00:00Z");
    const c = { statut: "PUBLIE", publieLe: new Date("2026-11-01"), expireLe: null };
    expect(estEnLigne(c, now)).toBe(true);
    expect(estEnLigne({ ...c, expireLe: new Date("2026-11-03") }, now)).toBe(false);
    expect(estEnLigne({ ...c, statut: "BROUILLON" }, now)).toBe(false);
  });

  it("calcule le taux de lecture", () => {
    expect(tauxLecture(15, 60)).toBe(25);
    expect(tauxLecture(3, 0)).toBe(0);
  });
});

describe("espaces", () => {
  it("dirige enseignants et étudiants vers leur espace", () => {
    expect(espaceParDefaut(["enseignant"], ROLES_PERSONNEL)).toBe("/enseignant");
    expect(espaceParDefaut(["etudiant", "candidat"], ROLES_PERSONNEL)).toBe("/etudiant");
  });
});
