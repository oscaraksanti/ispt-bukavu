/**
 * Formulaires des contenus structurés (filières, autorités, partenaires),
 * décrits avec le même registre que les blocs de pages pour réutiliser
 * l'éditeur et la validation.
 */
import type { DefinitionBloc } from "./definitions";

export const FORMULAIRE_FILIERE: DefinitionBloc = {
  cle: "filiere",
  titre: "Fiche de la filière",
  champs: [
    { type: "texte", cle: "nom", libelle: "Nom complet", max: 120 },
    {
      type: "texte",
      cle: "nomCourt",
      libelle: "Nom court",
      aide: "Utilisé dans les menus.",
      max: 60,
    },
    {
      type: "texte",
      cle: "slug",
      libelle: "Adresse de la page",
      aide: "Lettres minuscules, chiffres et tirets. Exemple : genie-civil.",
      max: 60,
    },
    { type: "image", cle: "photo", libelle: "Photo" },
    { type: "texteLong", cle: "accroche", libelle: "Accroche", max: 200 },
    { type: "texteLong", cle: "presentation", libelle: "Présentation", max: 1200 },
    {
      type: "liste",
      cle: "domaines",
      libelle: "Domaines enseignés",
      min: 1,
      max: 12,
      element: [{ type: "texte", cle: "libelle", libelle: "Domaine" }],
    },
    {
      type: "liste",
      cle: "metiers",
      libelle: "Métiers visés",
      min: 1,
      max: 12,
      element: [{ type: "texte", cle: "libelle", libelle: "Métier" }],
    },
    { type: "texteLong", cle: "debouches", libelle: "Secteurs d'emploi", max: 1200 },
    { type: "texteLong", cle: "entreprendre", libelle: "Créer son activité", max: 1200 },
  ],
  defaut: {},
};

export const FORMULAIRE_AUTORITES: DefinitionBloc = {
  cle: "autorites",
  titre: "Autorités académiques",
  champs: [
    {
      type: "liste",
      cle: "autorites",
      libelle: "Autorités, dans l'ordre d'affichage",
      min: 0,
      max: 12,
      element: [
        { type: "texte", cle: "fonction", libelle: "Fonction", max: 120 },
        { type: "texte", cle: "nom", libelle: "Nom et titre", max: 120 },
      ],
    },
  ],
  defaut: { autorites: [] },
};

export const CATEGORIES_PARTENAIRES = {
  STAGE_PROFESSIONNEL: "Lieux de stage professionnel",
  STAGE_PEDAGOGIQUE: "Lieux de stage pédagogique",
  EMPLOYEUR: "Employeurs des diplômés",
  INSTITUTIONNEL: "Établissements où enseignent les diplômés",
} as const;

export type CategoriePartenaire = keyof typeof CATEGORIES_PARTENAIRES;

export const FORMULAIRE_PARTENAIRES: DefinitionBloc = {
  cle: "partenaires",
  titre: "Partenaires",
  champs: Object.entries(CATEGORIES_PARTENAIRES).map(([cle, libelle]) => ({
    type: "liste" as const,
    cle,
    libelle,
    min: 0,
    max: 40,
    element: [{ type: "texte" as const, cle: "nom", libelle: "Nom", max: 120 }],
  })),
  defaut: {},
};

/** Adresse de page valide : minuscules, chiffres et tirets. */
export function slugValide(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 60;
}

export function versSlug(texte: string) {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
