import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("fusion des classes (cn)", () => {
  it("garde la couleur du texte à côté d'une taille de la charte", () => {
    // Régression : `text-corps` pris pour une couleur effaçait `text-white` des boutons.
    expect(cn("bg-ispt-600 text-white", "h-11 px-5 text-corps")).toBe(
      "bg-ispt-600 text-white h-11 px-5 text-corps",
    );
    expect(cn("text-pierre-600", "text-legende")).toBe("text-pierre-600 text-legende");
  });

  it("remplace une taille par une autre", () => {
    expect(cn("text-sm", "text-corps")).toBe("text-corps");
    expect(cn("text-corps", "text-titre-page")).toBe("text-titre-page");
  });
});
