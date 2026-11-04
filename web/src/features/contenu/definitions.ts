/**
 * Définition des contenus modifiables du site public.
 *
 * Chaque page est découpée en blocs ; chaque bloc déclare ses champs. Ce
 * registre sert à la fois à générer les formulaires de l'administration, à
 * valider les saisies et à initialiser la base. Les valeurs par défaut
 * reprennent les textes officiels de l'institut.
 */

export type ChampSimple =
  | { type: "texte"; cle: string; libelle: string; aide?: string; max?: number }
  | { type: "texteLong"; cle: string; libelle: string; aide?: string; max?: number }
  | { type: "image"; cle: string; libelle: string; aide?: string };

export type Champ =
  | ChampSimple
  | {
      type: "liste";
      cle: string;
      libelle: string;
      aide?: string;
      element: ChampSimple[];
      min?: number;
      max?: number;
    };

export type DefinitionBloc = {
  cle: string;
  titre: string;
  description?: string;
  champs: Champ[];
  /** Valeurs initiales. Les images sont désignées par le chemin de la photo officielle. */
  defaut: Record<string, unknown>;
};

export type DefinitionPage = {
  slug: string;
  titre: string;
  chemin: string;
  blocs: DefinitionBloc[];
};

const photo = (fichier: string) => `photo:${fichier}`;

export const PAGES: DefinitionPage[] = [
  {
    slug: "accueil",
    titre: "Accueil",
    chemin: "/",
    blocs: [
      {
        cle: "accroche",
        titre: "Accroche",
        description: "Le haut de la page d'accueil : titre, texte et mosaïque de photos.",
        champs: [
          { type: "texte", cle: "surtitre", libelle: "Surtitre" },
          { type: "texte", cle: "titreDebut", libelle: "Titre — première ligne" },
          { type: "texte", cle: "titreSouligne", libelle: "Titre — mot surligné" },
          { type: "texte", cle: "titreFin", libelle: "Titre — fin" },
          { type: "texteLong", cle: "texte", libelle: "Texte d'introduction", max: 320 },
          {
            type: "liste",
            cle: "chiffres",
            libelle: "Chiffres clés",
            min: 0,
            max: 4,
            element: [
              { type: "texte", cle: "valeur", libelle: "Valeur" },
              { type: "texte", cle: "libelle", libelle: "Libellé" },
            ],
          },
          {
            type: "liste",
            cle: "photos",
            libelle: "Mosaïque de photos",
            aide: "Quatre photos : grande, petite, petite, bandeau.",
            min: 4,
            max: 4,
            element: [
              { type: "image", cle: "image", libelle: "Photo" },
              { type: "texte", cle: "legende", libelle: "Légende" },
            ],
          },
        ],
        defaut: {
          surtitre: "Bukavu · Sud-Kivu",
          titreDebut: "Ingénieurs de terrain.",
          titreSouligne: "Enseignants",
          titreFin: "de métier.",
          texte:
            "L'ISPT-Bukavu forme des ingénieurs en techniques appliquées, prêts pour l'industrie comme pour l'enseignement technique, en quatre ans et deux stages obligatoires.",
          chiffres: [
            { valeur: "4", libelle: "filières LMD" },
            { valeur: "8", libelle: "semestres" },
            { valeur: "2", libelle: "stages obligatoires" },
          ],
          photos: [
            { image: photo("tp-topographie-2.jpg"), legende: "TP de topographie · Génie Civil" },
            { image: photo("collation-2026-remise-casque-1.jpg"), legende: "Collation 2026" },
            { image: photo("stage-centrale-electrique.jpg"), legende: "Stage" },
            { image: photo("salle-informatique-cours.jpg"), legende: "Génie Informatique" },
          ],
        },
      },
      {
        cle: "institut",
        titre: "Section « L'institut »",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "image", cle: "photo", libelle: "Photo" },
          { type: "texte", cle: "legende", libelle: "Légende de la photo" },
        ],
        defaut: {
          titre: "Une double vocation, technique et pédagogique",
          photo: photo("campus-batiment-facade.jpg"),
          legende: "Campus · Avenue de l'Hippodrome",
        },
      },
      {
        cle: "formations",
        titre: "Section « Formations »",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "texteLong", cle: "intro", libelle: "Introduction" },
        ],
        defaut: {
          titre: "Quatre filières, un même niveau d'exigence",
          intro:
            "Chaque filière conduit à la Licence en 8 semestres, avec des travaux pratiques, un stage pédagogique et un stage professionnel.",
        },
      },
      {
        cle: "stages",
        titre: "Section « Sur le terrain »",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "texteLong", cle: "intro", libelle: "Introduction" },
          { type: "image", cle: "photo", libelle: "Photo" },
          { type: "texte", cle: "legende", libelle: "Légende" },
        ],
        defaut: {
          titre: "Apprendre au contact du métier",
          intro:
            "Deux stages structurent le parcours : l'un dans les écoles techniques, l'autre en entreprise. Le stage professionnel est obligatoire pour chaque promotion.",
          photo: photo("stage-genie-civil-chantier.jpg"),
          legende: "Stage sur chantier routier",
        },
      },
      {
        cle: "admissions",
        titre: "Section « Admissions »",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "texteLong", cle: "intro", libelle: "Introduction" },
          {
            type: "liste",
            cle: "etapes",
            libelle: "Étapes",
            min: 1,
            max: 6,
            element: [
              { type: "texte", cle: "titre", libelle: "Titre" },
              { type: "texteLong", cle: "texte", libelle: "Texte" },
            ],
          },
        ],
        defaut: {
          titre: "Candidater sans se déplacer",
          intro:
            "Le dossier de candidature se constitue en ligne. Chaque étape est suivie et chaque décision notifiée.",
          etapes: [
            {
              titre: "Créer un compte",
              texte: "Une adresse email suffit. Le dossier se remplit depuis un téléphone.",
            },
            {
              titre: "Constituer le dossier",
              texte: "Pièces numérisées ou photographiées, à déposer en ligne.",
            },
            {
              titre: "Régler les frais",
              texte: "Frais d'inscription : 10 $. La référence du paiement est jointe au dossier.",
            },
            {
              titre: "Suivre la décision",
              texte: "L'état du dossier et les demandes de complément sont notifiés.",
            },
          ],
        },
      },
      {
        cle: "images",
        titre: "Bande « En images »",
        champs: [
          {
            type: "liste",
            cle: "photos",
            libelle: "Photos",
            aide: "Cinq photos : la première occupe un grand carré.",
            min: 5,
            max: 5,
            element: [
              { type: "image", cle: "image", libelle: "Photo" },
              { type: "texte", cle: "legende", libelle: "Légende" },
            ],
          },
        ],
        defaut: {
          photos: [
            { image: photo("collation-2026-laureats-salle.jpg"), legende: "Collation 2026" },
            { image: photo("tp-topographie-1.jpg"), legende: "Topographie" },
            { image: photo("collation-2026-remise-casque-2.jpg"), legende: "Remise du casque" },
            { image: photo("campus-jardin-etudiants.jpg"), legende: "Campus" },
            { image: photo("salle-cours-examen.jpg"), legende: "Évaluation" },
          ],
        },
      },
      {
        cle: "debouches",
        titre: "Section « Débouchés »",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "texteLong", cle: "intro", libelle: "Introduction" },
          { type: "image", cle: "photo", libelle: "Photo" },
          { type: "texte", cle: "legende", libelle: "Légende" },
        ],
        defaut: {
          titre: "Où exercent nos diplômés",
          intro:
            "Les anciens de l'institut travaillent dans l'énergie, l'eau, les télécommunications, la finance et l'industrie, ou enseignent dans les écoles techniques de la région.",
          photo: photo("collation-2026-laureats-exterieur.jpg"),
          legende: "Lauréats 2026",
        },
      },
    ],
  },
  {
    slug: "institut",
    titre: "L'institut",
    chemin: "/institut",
    blocs: [
      {
        cle: "entete",
        titre: "En-tête",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "image", cle: "photo", libelle: "Photo" },
          { type: "texte", cle: "legende", libelle: "Légende" },
        ],
        defaut: {
          titre: "Former des ingénieurs pour l'industrie et pour l'école",
          photo: photo("campus-batiment-allee.jpg"),
          legende: "Campus · Bukavu",
        },
      },
      {
        cle: "historique",
        titre: "Historique",
        champs: [
          {
            type: "liste",
            cle: "jalons",
            libelle: "Jalons",
            min: 1,
            max: 12,
            element: [
              { type: "texte", cle: "annee", libelle: "Année ou repère" },
              { type: "texte", cle: "titre", libelle: "Titre" },
              { type: "texteLong", cle: "texte", libelle: "Texte" },
            ],
          },
        ],
        defaut: {
          jalons: [
            {
              annee: "2010",
              titre: "Création",
              texte:
                "Arrêté ministériel n°219/MINESU/CAB.MIN/MML/KOB/2010 du 8 novembre 2010, entériné par le ministre de l'Enseignement supérieur et universitaire, le Professeur Mashako Mamba, à la demande de Monseigneur François-Xavier Maroyi Rusengo, archevêque de Bukavu.",
            },
            {
              annee: "2011",
              titre: "Ouverture",
              texte:
                "L'institut accueille ses premiers étudiants, avenue de l'Hippodrome à Bukavu.",
            },
            {
              annee: "LMD",
              titre: "Réforme des études",
              texte:
                "La formation est organisée en système Licence-Maîtrise-Doctorat : quatre ans, huit semestres, jusqu'au diplôme de Licence.",
            },
            {
              annee: "2026",
              titre: "Collation des grades",
              texte:
                "Une nouvelle promotion d'ingénieurs reçoit le casque, symbole de l'entrée dans le métier.",
            },
          ],
        },
      },
      {
        cle: "referentiels",
        titre: "Référentiels des métiers",
        champs: [
          { type: "texte", cle: "titreTechnique", libelle: "Premier volet — titre" },
          { type: "texteLong", cle: "texteTechnique", libelle: "Premier volet — texte" },
          { type: "texte", cle: "titrePedagogique", libelle: "Second volet — titre" },
          { type: "texteLong", cle: "textePedagogique", libelle: "Second volet — texte" },
        ],
        defaut: {
          titreTechnique: "Ingénieurs et techniciens",
          texteTechnique:
            "L'institut forme des ingénieurs et techniciens qualifiés, capables d'intégrer les usines, les entreprises de télécommunication, les centrales hydroélectriques, les hôpitaux, les bureaux d'études, les laboratoires informatiques et électroniques ainsi que les ateliers mécaniques, où ils assurent la conception, la maintenance, la réparation et les installations techniques.",
          titrePedagogique: "Enseignants techniques",
          textePedagogique:
            "Il prépare également des ingénieurs disposant des compétences pédagogiques nécessaires pour enseigner dans les établissements d'enseignement technique, notamment en électricité, mécanique, électronique, informatique et construction.",
        },
      },
      {
        cle: "stages",
        titre: "Stages et partenaires",
        description:
          "Textes des deux stages, repris sur l'accueil. Les lieux de stage se gèrent dans « Partenaires ».",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "texteLong", cle: "intro", libelle: "Introduction" },
          { type: "texte", cle: "titreProfessionnel", libelle: "Stage professionnel — titre" },
          { type: "texteLong", cle: "texteProfessionnel", libelle: "Stage professionnel — texte" },
          { type: "texte", cle: "titrePedagogique", libelle: "Stage pédagogique — titre" },
          { type: "texteLong", cle: "textePedagogique", libelle: "Stage pédagogique — texte" },
        ],
        defaut: {
          titre: "Stages et partenaires",
          intro:
            "L'institut conclut des contrats de partenariat avec les entreprises, les usines et les ateliers pour le stage professionnel, et avec les établissements d'enseignement technique pour le stage pédagogique.",
          titreProfessionnel: "Stage professionnel",
          texteProfessionnel:
            "Il s'effectue en entreprise et en institution. Chaque promotion en bénéficie obligatoirement.",
          titrePedagogique: "Stage pédagogique",
          textePedagogique:
            "Il se déroule dans les humanités techniques, pour former à l'enseignement des disciplines techniques.",
        },
      },
      {
        cle: "anciens",
        titre: "Nos anciens",
        champs: [
          { type: "texteLong", cle: "texte", libelle: "Texte" },
          { type: "image", cle: "photo", libelle: "Photo" },
          { type: "texte", cle: "legende", libelle: "Légende" },
        ],
        defaut: {
          texte:
            "Les diplômés exercent dans des secteurs variés et contribuent aussi à l'enseignement, dans les humanités techniques comme dans l'enseignement supérieur.",
          photo: photo("collation-2026-corps-academique.jpg"),
          legende: "Corps académique · Collation 2026",
        },
      },
    ],
  },
  {
    slug: "formations",
    titre: "Formations",
    chemin: "/formations",
    blocs: [
      {
        cle: "entete",
        titre: "En-tête",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "texteLong", cle: "intro", libelle: "Introduction" },
        ],
        defaut: {
          titre: "Quatre filières d'ingénierie appliquée",
          intro:
            "Chaque filière conduit au diplôme de Licence en 4 ans, soit 8 semestres en système LMD, avec un stage pédagogique et un stage professionnel.",
        },
      },
    ],
  },
  {
    slug: "admissions",
    titre: "Admissions",
    chemin: "/admissions",
    blocs: [
      {
        cle: "entete",
        titre: "En-tête",
        champs: [
          { type: "texte", cle: "titre", libelle: "Titre" },
          { type: "texteLong", cle: "intro", libelle: "Introduction" },
          { type: "image", cle: "photo", libelle: "Photo" },
          { type: "texte", cle: "legende", libelle: "Légende" },
        ],
        defaut: {
          titre: "Entrer en première année",
          intro:
            "L'admission en première année de Licence est ouverte aux titulaires du diplôme d'État. Le dossier se compose de huit pièces, dont le paiement des frais d'inscription.",
          photo: photo("campus-entree-escalier.jpg"),
          legende: "Entrée du campus",
        },
      },
      {
        cle: "pieces",
        titre: "Pièces du dossier",
        description:
          "Liste affichée sur le site tant qu'aucune campagne d'admission n'est ouverte.",
        champs: [
          {
            type: "liste",
            cle: "liste",
            libelle: "Pièces",
            min: 1,
            max: 20,
            element: [{ type: "texte", cle: "libelle", libelle: "Pièce" }],
          },
        ],
        defaut: {
          liste: [
            "Frais d'inscription : 10 $",
            "Bulletins de 5e et 6e humanités",
            "Diplôme d'État ou journal (palmarès)",
            "Une farde chemise",
            "Attestation de bonne vie et mœurs",
            "Attestation de nationalité",
            "Attestation d'aptitude physique",
            "Attestation de naissance",
          ].map((libelle) => ({ libelle })),
        },
      },
      {
        cle: "depot",
        titre: "Dépôt du dossier",
        champs: [
          { type: "texte", cle: "titreEncadre", libelle: "Titre de l'encadré" },
          { type: "texteLong", cle: "texteEncadre", libelle: "Texte de l'encadré" },
          { type: "texteLong", cle: "texte", libelle: "Texte" },
        ],
        defaut: {
          titreEncadre: "Dépôt en ligne",
          texteEncadre:
            "Le dépôt du dossier en ligne ouvre prochainement sur cette plateforme. En attendant, les dossiers sont reçus à l'institut, avenue de l'Hippodrome n°102, Bukavu.",
          texte:
            "Pour toute question sur votre admission, le secrétariat répond par téléphone, par WhatsApp et par email.",
        },
      },
    ],
  },
  {
    slug: "contact",
    titre: "Contact",
    chemin: "/contact",
    blocs: [
      {
        cle: "entete",
        titre: "En-tête",
        champs: [{ type: "texte", cle: "titre", libelle: "Titre" }],
        defaut: { titre: "Nous écrire, nous appeler, nous rendre visite" },
      },
    ],
  },
  {
    slug: "mentions-legales",
    titre: "Mentions légales",
    chemin: "/mentions-legales",
    blocs: [
      {
        cle: "texte",
        titre: "Texte",
        description:
          "Texte juridique à fournir par l'institut (éditeur du site, responsable de la publication, hébergement, propriété intellectuelle). Tant qu'il est vide, la page indique qu'il est en cours de validation.",
        champs: [
          {
            type: "texteLong",
            cle: "texte",
            libelle: "Texte",
            aide: "Paragraphes séparés par une ligne vide ; intertitres précédés de « ## » ; listes avec « - ».",
            max: 20000,
          },
          {
            type: "texte",
            cle: "miseAJour",
            libelle: "Date de dernière mise à jour",
            aide: "Exemple : 4 novembre 2026",
          },
        ],
        defaut: { texte: "", miseAJour: "" },
      },
    ],
  },
  {
    slug: "confidentialite",
    titre: "Confidentialité",
    chemin: "/confidentialite",
    blocs: [
      {
        cle: "texte",
        titre: "Texte",
        description:
          "Politique de protection des données personnelles, à valider par l'institut (données collectées, finalités, durée de conservation, droits des personnes, contact). Tant qu'elle est vide, la page indique qu'elle est en cours de validation.",
        champs: [
          {
            type: "texteLong",
            cle: "texte",
            libelle: "Texte",
            aide: "Paragraphes séparés par une ligne vide ; intertitres précédés de « ## » ; listes avec « - ».",
            max: 20000,
          },
          {
            type: "texte",
            cle: "miseAJour",
            libelle: "Date de dernière mise à jour",
            aide: "Exemple : 4 novembre 2026",
          },
        ],
        defaut: { texte: "", miseAJour: "" },
      },
    ],
  },
];

export function definitionPage(slug: string) {
  return PAGES.find((p) => p.slug === slug);
}

export function definitionBloc(slug: string, cle: string) {
  return definitionPage(slug)?.blocs.find((b) => b.cle === cle);
}
