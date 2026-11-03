import type { DefinitionBloc } from "@/features/contenu/definitions";

export const FORMULAIRE_ACTUALITE: DefinitionBloc = {
  cle: "actualite",
  titre: "Article",
  champs: [
    { type: "texte", cle: "titre", libelle: "Titre", max: 160 },
    {
      type: "texte",
      cle: "slug",
      libelle: "Adresse de la page",
      aide: "Lettres minuscules, chiffres et tirets. Laissez vide pour la déduire du titre.",
      max: 80,
    },
    { type: "image", cle: "couverture", libelle: "Photo de couverture" },
    {
      type: "texteLong",
      cle: "resume",
      libelle: "Résumé",
      aide: "Affiché dans les listes et les partages sur les réseaux sociaux.",
      max: 300,
    },
    {
      type: "texteLong",
      cle: "contenu",
      libelle: "Texte de l'article",
      aide: "Une ligne vide sépare les paragraphes. « ## Titre » crée un intertitre, « - élément » une liste.",
      max: 20000,
    },
  ],
  defaut: {},
};

export const FORMULAIRE_FAQ: DefinitionBloc = {
  cle: "faq",
  titre: "Questions fréquentes",
  champs: [
    {
      type: "liste",
      cle: "questions",
      libelle: "Questions, dans l'ordre d'affichage",
      min: 0,
      max: 40,
      element: [
        { type: "texte", cle: "question", libelle: "Question", max: 200 },
        { type: "texteLong", cle: "reponse", libelle: "Réponse", max: 2000 },
      ],
    },
  ],
  defaut: { questions: [] },
};
