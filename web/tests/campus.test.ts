import { describe, expect, it } from "vitest";
import {
  audiencePermise,
  decouperLiens,
  ilYA,
  type Lecteur,
  libelleJaime,
  peutVoir,
  type PublicationVisible,
  verifierTexte,
} from "@/features/campus/regles";

const etudiant: Lecteur = {
  id: "alice",
  personnel: false,
  moderateur: false,
  filieres: ["gi"],
  promotions: ["bac2-gi"],
};
const autreEtudiant: Lecteur = {
  ...etudiant,
  id: "chloe",
  filieres: ["gc"],
  promotions: ["bac3-gc"],
};
const personnel: Lecteur = {
  id: "com",
  personnel: true,
  moderateur: false,
  filieres: [],
  promotions: [],
};
const moderateur: Lecteur = { ...personnel, id: "mod", moderateur: true };

const pub = (p: Partial<PublicationVisible> = {}): PublicationVisible => ({
  auteurId: "bruno",
  audience: "INSTITUT",
  filiereId: null,
  promotionId: null,
  statut: "PUBLIEE",
  supprime: false,
  masque: false,
  ...p,
});

describe("qui voit quoi sur le Campus", () => {
  it("une publication pour l'institut est visible de tous", () => {
    expect(peutVoir(pub(), etudiant)).toBe(true);
    expect(peutVoir(pub(), autreEtudiant)).toBe(true);
  });

  it("une publication de filière ou de promotion reste dans son public", () => {
    const filiere = pub({ audience: "FILIERE", filiereId: "gi" });
    const promotion = pub({ audience: "PROMOTION", promotionId: "bac2-gi" });
    expect(peutVoir(filiere, etudiant)).toBe(true);
    expect(peutVoir(filiere, autreEtudiant)).toBe(false);
    expect(peutVoir(promotion, etudiant)).toBe(true);
    expect(peutVoir(promotion, autreEtudiant)).toBe(false);
    expect(peutVoir(promotion, personnel)).toBe(true);
  });

  it("une publication en attente ou masquée n'est vue que de son auteur et de la modération", () => {
    for (const p of [pub({ statut: "EN_ATTENTE" }), pub({ masque: true })]) {
      expect(peutVoir(p, etudiant)).toBe(false);
      expect(peutVoir(p, personnel)).toBe(false);
      expect(peutVoir(p, moderateur)).toBe(true);
      expect(peutVoir({ ...p, auteurId: "alice" }, etudiant)).toBe(true);
    }
  });

  it("une publication supprimée n'est plus visible de personne", () => {
    expect(peutVoir(pub({ supprime: true, auteurId: "alice" }), etudiant)).toBe(false);
    expect(peutVoir(pub({ supprime: true }), moderateur)).toBe(false);
  });
});

describe("public d'une nouvelle publication", () => {
  it("un étudiant publie pour l'institut, sa filière ou sa promotion", () => {
    expect(audiencePermise(etudiant, "INSTITUT", null)).toBe(true);
    expect(audiencePermise(etudiant, "FILIERE", "gi")).toBe(true);
    expect(audiencePermise(etudiant, "PROMOTION", "bac2-gi")).toBe(true);
    expect(audiencePermise(etudiant, "FILIERE", "gc")).toBe(false);
    expect(audiencePermise(etudiant, "PROMOTION", "bac3-gc")).toBe(false);
    expect(audiencePermise(etudiant, "PROMOTION", null)).toBe(false);
  });

  it("le personnel publie pour toute filière ou promotion", () => {
    expect(audiencePermise(personnel, "PROMOTION", "bac3-gc")).toBe(true);
  });
});

describe("texte", () => {
  it("transforme les adresses https en liens, jamais les autres", () => {
    expect(decouperLiens("Voir https://www.isptbukavu.org/admissions.")).toEqual([
      { texte: "Voir " },
      {
        texte: "https://www.isptbukavu.org/admissions",
        lien: "https://www.isptbukavu.org/admissions",
      },
      { texte: "." },
    ]);
    expect(decouperLiens("javascript:alert(1) http://x.cd")).toEqual([
      { texte: "javascript:alert(1) http://x.cd" },
    ]);
  });

  it("borne la longueur et accepte une publication faite de photos", () => {
    expect(verifierTexte("", 3000)).toMatch(/Écrivez/);
    expect(verifierTexte("", 3000, true)).toBeNull();
    expect(verifierTexte("x".repeat(1001), 1000)).toMatch(/trop long/);
  });

  it("formule l'ancienneté et les « J'aime »", () => {
    const m = new Date("2026-11-05T12:00:00Z");
    expect(ilYA(new Date("2026-11-05T11:59:30Z"), m)).toBe("à l'instant");
    expect(ilYA(new Date("2026-11-05T11:45:00Z"), m)).toBe("il y a 15 min");
    expect(ilYA(new Date("2026-11-05T08:00:00Z"), m)).toBe("il y a 4 h");
    expect(ilYA(new Date("2026-11-04T08:00:00Z"), m)).toBe("hier");
    expect(libelleJaime(0, false)).toBe("");
    expect(libelleJaime(1, true)).toBe("Vous");
    expect(libelleJaime(4, true)).toBe("Vous et 3 autres");
  });
});

import {
  decouperTexte,
  lireMentions,
  mentionEnCours,
  mentionsRetenues,
} from "@/features/campus/regles";

describe("mentions", () => {
  const jean = { id: "cjean0000000000001", nom: "Jean Bahati" };
  const grace = { id: "cgrace000000000001", nom: "Grâce M." };

  it("ne garde que les mentions encore présentes dans le texte, sans doublon", () => {
    expect(mentionsRetenues("Merci @Jean Bahati !", [jean, grace, jean])).toEqual([jean]);
  });

  it("refuse un champ caché altéré", () => {
    expect(lireMentions("pas du json")).toEqual([]);
    expect(lireMentions(JSON.stringify([{ id: "x; DROP", nom: "a" }, jean]))).toEqual([jean]);
  });

  it("met en valeur les mentions et garde les liens", () => {
    expect(
      decouperTexte("Bravo @Jean Bahati, voir https://isptbukavu.org", ["Jean Bahati"]),
    ).toEqual([
      { texte: "Bravo " },
      { texte: "@Jean Bahati", mention: true },
      { texte: ", voir " },
      { texte: "https://isptbukavu.org", lien: "https://isptbukavu.org" },
    ]);
  });

  it("repère le nom en cours de saisie après « @ »", () => {
    expect(mentionEnCours("Salut @Ja", 9)).toEqual({ debut: 6, requete: "Ja" });
    expect(mentionEnCours("courriel a@b", 12)).toBeNull();
    expect(mentionEnCours("@Jean Pierre Paul", 17)).toBeNull();
  });
});
