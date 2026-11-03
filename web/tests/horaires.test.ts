import { describe, expect, it } from "vitest";
import {
  ajouterJours,
  aujourdhuiBukavu,
  bornesPlage,
  libelleSemaine,
  libelleSemestre,
  lundiDe,
  situerSeance,
} from "@/features/horaires/regles";

describe("semaines", () => {
  it("ramène n'importe quel jour au lundi de sa semaine", () => {
    expect(lundiDe("2026-11-04")).toBe("2026-11-02");
    expect(lundiDe("2026-11-08")).toBe("2026-11-02");
    expect(lundiDe("2026-11-02")).toBe("2026-11-02");
    expect(lundiDe("pas une date")).toBeNull();
  });

  it("libelle la semaine comme les horaires de l'institut", () => {
    expect(libelleSemaine("2026-11-02")).toBe("du 02 au 07 novembre 2026");
    expect(libelleSemaine("2026-11-30")).toBe("du 30 novembre au 05 décembre 2026");
    expect(libelleSemestre(3)).toBe("3ème semestre");
    expect(libelleSemestre(1)).toBe("1er semestre");
  });

  it("change de mois et d'année correctement", () => {
    expect(ajouterJours("2026-12-28", 5)).toBe("2027-01-02");
  });
});

describe("plages horaires", () => {
  it("place les plages à l'heure de Bukavu", () => {
    const { debut, fin } = bornesPlage("2026-11-03", "matin");
    expect(debut.toISOString()).toBe("2026-11-03T06:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-11-03T10:00:00.000Z");
    expect(situerSeance(bornesPlage("2026-11-03", "apresMidi").debut)).toEqual({
      jour: "2026-11-03",
      plage: "apresMidi",
    });
  });

  it("donne le jour local même tard le soir en UTC", () => {
    expect(aujourdhuiBukavu(new Date("2026-11-03T23:30:00Z"))).toBe("2026-11-04");
  });
});
