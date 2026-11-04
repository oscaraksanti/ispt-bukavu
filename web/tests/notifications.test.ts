import { describe, expect, it } from "vitest";
import {
  iconeDe,
  libelleCompteur,
  lienSur,
  regrouperParJour,
} from "@/features/notifications/regles";

describe("notifications", () => {
  it("n'accepte que des liens internes", () => {
    expect(lienSur("/etudiant/notes")).toBe("/etudiant/notes");
    expect(lienSur("https://exemple.com")).toBeNull();
    expect(lienSur("//exemple.com")).toBeNull();
    expect(lienSur("/\\exemple.com")).toBeNull();
    expect(lienSur("/\t/exemple.com")).toBeNull();
    expect(lienSur("")).toBeNull();
    expect(lienSur(null)).toBeNull();
  });

  it("plafonne l'affichage du compteur", () => {
    expect(libelleCompteur(3)).toBe("3");
    expect(libelleCompteur(9)).toBe("9");
    expect(libelleCompteur(10)).toBe("9+");
  });

  it("donne une icône même pour un type inconnu", () => {
    expect(iconeDe("PAIEMENT")).toBe("frais");
    expect(iconeDe("INCONNU")).toBe("valve");
  });

  it("regroupe par jour à l'heure de Bukavu", () => {
    const maintenant = new Date("2026-11-04T10:00:00+02:00");
    const groupes = regrouperParJour(
      [
        { creeLe: new Date("2026-11-04T09:00:00+02:00") },
        { creeLe: new Date("2026-11-04T00:30:00+02:00") },
        // 23 h 30 la veille, heure de Bukavu
        { creeLe: new Date("2026-11-03T23:30:00+02:00") },
        { creeLe: new Date("2026-10-30T12:00:00+02:00") },
      ],
      maintenant,
    );
    expect(groupes.map((g) => [g.titre, g.elements.length])).toEqual([
      ["Aujourd'hui", 2],
      ["Hier", 1],
      ["Vendredi 30 octobre", 1],
    ]);
  });
});
