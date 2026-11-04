import { describe, expect, it } from "vitest";
import {
  type AncienPublic,
  anneeSortieValide,
  filtrerAnnuaire,
  lienProfessionnelValide,
  parPromotionDeSortie,
} from "@/features/anciens/regles";
import { ajouterSansDoublon, deplacer } from "@/features/galerie/regles";
import { joursRestants, moyenDeCandidatureValide, offreOuverte } from "@/features/offres/regles";

describe("galerie : ordre des photos", () => {
  it("déplace une photo sans sortir des bornes", () => {
    expect(deplacer(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(deplacer(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(deplacer(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(deplacer(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  });
  it("ajoute à la fin sans doublon", () => {
    expect(ajouterSansDoublon(["a", "b"], ["b", "c", "c", "d"])).toEqual(["a", "b", "c", "d"]);
  });
});

const ancien = (p: Partial<AncienPublic>): AncienPublic => ({
  id: "x",
  nom: "Grâce BAHATI",
  filiere: "Génie Informatique",
  filiereSlug: "genie-informatique",
  anneeSortie: 2020,
  poste: null,
  employeur: null,
  ville: null,
  parcours: null,
  lien: null,
  ...p,
});

describe("annuaire des anciens", () => {
  it("borne l'année de sortie à l'ouverture de l'institut", () => {
    const maintenant = new Date("2026-11-05T10:00:00Z");
    expect(anneeSortieValide(2011, maintenant)).toBe(true);
    expect(anneeSortieValide(2026, maintenant)).toBe(true);
    expect(anneeSortieValide(2010, maintenant)).toBe(false);
    expect(anneeSortieValide(2027, maintenant)).toBe(false);
  });

  it("n'accepte que des liens https sans identifiants", () => {
    expect(lienProfessionnelValide("")).toBe(true);
    expect(lienProfessionnelValide("https://www.linkedin.com/in/exemple")).toBe(true);
    expect(lienProfessionnelValide("http://exemple.org")).toBe(false);
    expect(lienProfessionnelValide("javascript:alert(1)")).toBe(false);
    expect(lienProfessionnelValide("https://a:b@exemple.org")).toBe(false);
  });

  it("recherche sans tenir compte des accents et filtre par filière", () => {
    const liste = [
      ancien({ id: "1", poste: "Ingénieure réseaux", employeur: "SNEL", ville: "Bukavu" }),
      ancien({
        id: "2",
        nom: "Paul AMANI",
        filiere: "Génie Civil",
        filiereSlug: "genie-civil",
        anneeSortie: 2018,
        ville: "Goma",
      }),
    ];
    expect(filtrerAnnuaire(liste, { q: "ingenieure bukavu" }).map((a) => a.id)).toEqual(["1"]);
    expect(filtrerAnnuaire(liste, { filiere: "genie-civil" }).map((a) => a.id)).toEqual(["2"]);
    expect(filtrerAnnuaire(liste, {}).length).toBe(2);
    expect(parPromotionDeSortie(liste).map(([annee]) => annee)).toEqual([2020, 2018]);
  });
});

describe("offres d'insertion", () => {
  const maintenant = new Date("2026-11-05T10:00:00Z");
  it("reste visible jusqu'au soir de la date limite", () => {
    const limite = new Date("2026-11-05T00:00:00+02:00");
    expect(offreOuverte({ statut: "PUBLIEE", dateLimite: limite }, maintenant)).toBe(true);
    expect(
      offreOuverte({ statut: "PUBLIEE", dateLimite: limite }, new Date("2026-11-06T10:00:00Z")),
    ).toBe(false);
    expect(offreOuverte({ statut: "PUBLIEE", dateLimite: null }, maintenant)).toBe(true);
    expect(offreOuverte({ statut: "BROUILLON", dateLimite: null }, maintenant)).toBe(false);
  });
  it("compte les jours restants", () => {
    expect(joursRestants(new Date("2026-11-08T00:00:00+02:00"), maintenant)).toBe(3);
    expect(joursRestants(null, maintenant)).toBeNull();
  });
  it("exige un moyen de postuler valide", () => {
    expect(moyenDeCandidatureValide("", "")).toMatch(/lien ou une adresse/);
    expect(moyenDeCandidatureValide("http://exemple.org", "")).toMatch(/https/);
    expect(moyenDeCandidatureValide("", "rh@exemple.org")).toBeNull();
    expect(moyenDeCandidatureValide("https://exemple.org/postuler", "")).toBeNull();
  });
});
