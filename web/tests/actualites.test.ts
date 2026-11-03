import { describe, expect, it } from "vitest";
import { analyserTexte, tempsDeLecture } from "@/features/actualites/texte";

describe("mise en forme des articles", () => {
  it("découpe paragraphes, intertitres et listes", () => {
    const texte =
      "Premier paragraphe\nsur deux lignes.\n\n## Programme\n\n- Accueil\n- Remise des diplômes\n\nFin.";
    expect(analyserTexte(texte)).toEqual([
      { type: "paragraphe", texte: "Premier paragraphe sur deux lignes." },
      { type: "intertitre", texte: "Programme" },
      { type: "liste", elements: ["Accueil", "Remise des diplômes"] },
      { type: "paragraphe", texte: "Fin." },
    ]);
  });

  it("ne produit jamais de HTML : les balises restent du texte", () => {
    const [bloc] = analyserTexte("<script>alert(1)</script>");
    expect(bloc).toEqual({ type: "paragraphe", texte: "<script>alert(1)</script>" });
  });

  it("ignore les lignes vides superflues et les fins de ligne Windows", () => {
    expect(analyserTexte("\r\n\r\nA\r\n\r\n\r\nB\r\n")).toHaveLength(2);
  });

  it("estime le temps de lecture", () => {
    expect(tempsDeLecture("mot ".repeat(50))).toBe(1);
    expect(tempsDeLecture("mot ".repeat(1000))).toBe(5);
  });
});

import { formatHeure, versChampDate, versDateBukavu } from "@/features/actualites/dates";

describe("dates à l'heure de Bukavu", () => {
  it("interprète la saisie à l'heure locale (UTC+2)", () => {
    expect(versDateBukavu("2026-11-20T14:30")?.toISOString()).toBe("2026-11-20T12:30:00.000Z");
    expect(versDateBukavu("20/11/2026")).toBeNull();
  });

  it("restitue la même valeur dans le formulaire", () => {
    expect(versChampDate(versDateBukavu("2026-01-01T00:15"))).toBe("2026-01-01T00:15");
    expect(versChampDate(null)).toBe("");
  });

  it("affiche l'heure locale", () => {
    expect(formatHeure.format(new Date("2026-11-20T12:30:00Z"))).toBe("14:30");
  });
});
