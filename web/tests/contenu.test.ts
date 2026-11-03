import { describe, expect, it } from "vitest";
import { slugValide, versSlug } from "@/features/contenu/collections";
import { type DefinitionBloc, PAGES } from "@/features/contenu/definitions";
import {
  fusionnerBloc,
  imagesDuBloc,
  remplacerImages,
  schemaBloc,
} from "@/features/contenu/donnees";
import { lecteur } from "@/features/contenu/lecteur";
import { lienTelephone, lienWhatsapp, numeroInternational } from "@/features/contenu/reglages";

const bloc: DefinitionBloc = {
  cle: "essai",
  titre: "Essai",
  champs: [
    { type: "texte", cle: "titre", libelle: "Titre", max: 20 },
    { type: "image", cle: "photo", libelle: "Photo" },
    {
      type: "liste",
      cle: "photos",
      libelle: "Photos",
      min: 1,
      max: 2,
      element: [
        { type: "image", cle: "image", libelle: "Image" },
        { type: "texte", cle: "legende", libelle: "Légende" },
      ],
    },
  ],
  defaut: {
    titre: "Défaut",
    photo: "photo:a.jpg",
    photos: [{ image: "photo:b.jpg", legende: "B" }],
  },
};

describe("fusionnerBloc", () => {
  it("reprend les valeurs par défaut des champs absents", () => {
    expect(fusionnerBloc(bloc, { titre: "Enregistré" })).toEqual({
      titre: "Enregistré",
      photo: "photo:a.jpg",
      photos: [{ image: "photo:b.jpg", legende: "B" }],
    });
  });

  it("conserve une image volontairement retirée", () => {
    expect(fusionnerBloc(bloc, { photo: null }).photo).toBeNull();
  });

  it("ignore les types inattendus et les clés inconnues", () => {
    const d = fusionnerBloc(bloc, { titre: 42, inconnu: "x", photos: [{ legende: 3 }] });
    expect(d.titre).toBe("Défaut");
    expect(d).not.toHaveProperty("inconnu");
    expect(d.photos).toEqual([{ image: null, legende: "" }]);
  });

  it("fournit une valeur complète pour chaque bloc du registre", () => {
    for (const page of PAGES)
      for (const b of page.blocs) {
        const d = fusionnerBloc(b, b.defaut);
        for (const champ of b.champs) expect(d).toHaveProperty(champ.cle);
      }
  });
});

describe("schemaBloc", () => {
  const valide = { titre: "Court", photo: null, photos: [{ image: "id1", legende: "" }] };

  it("accepte des données conformes", () => {
    expect(schemaBloc(bloc).safeParse(valide).success).toBe(true);
  });

  it("refuse un texte trop long", () => {
    expect(schemaBloc(bloc).safeParse({ ...valide, titre: "x".repeat(21) }).success).toBe(false);
  });

  it("applique le nombre minimal et maximal d'éléments d'une liste", () => {
    expect(schemaBloc(bloc).safeParse({ ...valide, photos: [] }).success).toBe(false);
    const trois = Array.from({ length: 3 }, () => ({ image: null, legende: "" }));
    expect(schemaBloc(bloc).safeParse({ ...valide, photos: trois }).success).toBe(false);
  });

  it("retire les espaces superflus", () => {
    const r = schemaBloc(bloc).parse({ ...valide, titre: "  Titre  " });
    expect(r.titre).toBe("Titre");
  });

  it("valide les valeurs par défaut de toutes les pages", () => {
    for (const page of PAGES)
      for (const b of page.blocs) {
        const r = schemaBloc(b).safeParse(fusionnerBloc(b, b.defaut));
        expect(r.success, `${page.slug}/${b.cle}`).toBe(true);
      }
  });
});

describe("images d'un bloc", () => {
  it("repère les images simples et celles des listes", () => {
    const d = fusionnerBloc(bloc, { photo: "id1", photos: [{ image: "id2" }, { image: "id1" }] });
    expect(imagesDuBloc(bloc, d).sort()).toEqual(["id1", "id2"]);
  });

  it("remplace chaque référence par l'image résolue", () => {
    const d = fusionnerBloc(bloc, { photo: "id1", photos: [{ image: "inconnue", legende: "L" }] });
    const r = remplacerImages(bloc, d, (ref) => (ref === "id1" ? { url: "/a.jpg" } : null));
    expect(r.photo).toEqual({ url: "/a.jpg" });
    expect(r.photos).toEqual([{ image: null, legende: "L" }]);
  });
});

describe("lecteur", () => {
  it("lit textes, images et listes sans planter sur des données manquantes", () => {
    const l = lecteur({
      titre: "T",
      photo: { url: "/x", alt: "" },
      liste: [{ a: "1" }],
      visible: false,
    });
    expect(l.texte("titre")).toBe("T");
    expect(l.texte("absent")).toBe("");
    expect(l.image("photo")?.url).toBe("/x");
    expect(l.image("titre")).toBeNull();
    expect(l.liste("liste")[0].texte("a")).toBe("1");
    expect(l.liste("absent")).toEqual([]);
    expect(l.visible).toBe(false);
    expect(lecteur(undefined).visible).toBe(true);
  });
});

describe("numéros de téléphone", () => {
  it("convertit un numéro local congolais au format international", () => {
    expect(numeroInternational("099 924 9630")).toBe("243999249630");
    expect(lienTelephone("099 924 9630")).toBe("tel:+243999249630");
    expect(lienWhatsapp("085 371 5883")).toBe("https://wa.me/243853715883");
  });

  it("respecte un numéro déjà international", () => {
    expect(numeroInternational("+243 99 924 9630")).toBe("243999249630");
    expect(numeroInternational("00243999249630")).toBe("243999249630");
    expect(numeroInternational("+250 788 000 000")).toBe("250788000000");
  });

  it("renvoie un lien vide sans numéro", () => {
    expect(lienTelephone("")).toBe("");
  });
});

describe("adresses de pages", () => {
  it("produit une adresse lisible sans accents", () => {
    expect(versSlug("Électronique et Télécommunications")).toBe(
      "electronique-et-telecommunications",
    );
    expect(slugValide(versSlug("Génie Civil"))).toBe(true);
  });

  it("refuse les adresses mal formées", () => {
    for (const s of ["", "Genie", "genie civil", "-genie", "genie--civil", "a/b"])
      expect(slugValide(s), s).toBe(false);
  });
});
