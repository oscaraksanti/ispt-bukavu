/**
 * Contenu institutionnel de référence.
 *
 * Source : dépliant officiel et données transmises par l'institut
 * (docs/sources/). Ces valeurs servent de données initiales : une fois la
 * base de données en place, elles sont modifiables depuis l'administration.
 */

export const institut = {
  nom: "Institut Supérieur Pédagogique et Technique de Bukavu",
  sigle: "ISPT-Bukavu",
  devise: "Scientia splendet et conscientia",
  statut: "Établissement public d'enseignement supérieur et universitaire",
  creation: {
    acte: "Arrêté ministériel n°219/MINESU/CAB.MIN/MML/KOB/2010",
    date: "8 novembre 2010",
    annee: 2010,
    operationnel: 2011,
  },
  mission:
    "Former des ingénieurs en techniques appliquées, aptes à intégrer les entreprises pour contribuer au développement technologique et industriel, et capables d'enseigner dans les établissements techniques afin de renforcer la qualité de l'éducation professionnelle.",
  adresse: {
    rue: "Avenue de l'Hippodrome n°102",
    quartier: "quartier Nyawera",
    commune: "commune d'Ibanda",
    ville: "Bukavu",
    province: "Sud-Kivu",
    pays: "République Démocratique du Congo",
    reperes: "À proximité de la Place Mulamba",
    boitePostale: "B.P. 1334 Bukavu",
  },
  coordonnees: {
    latitude: -2.5025,
    longitude: 28.871667,
    libelle: "02°30'09\" S · 28°52'18\" E",
  },
  contacts: {
    telephone: { affichage: "099 924 9630", lien: "tel:+243999249630" },
    whatsapp: { affichage: "085 371 5883", lien: "https://wa.me/243853715883" },
    email: "ispt.bk@gmail.com",
  },
  etudes: {
    systeme: "LMD",
    duree: "4 ans",
    semestres: 8,
    diplome: "Licence",
  },
} as const;

export type Filiere = {
  slug: string;
  nom: string;
  nomCourt: string;
  accroche: string;
  presentation: string;
  domaines: string[];
  metiers: string[];
  debouches: string;
  entreprendre: string;
  photo: { src: string; alt: string };
};

export const filieres: Filiere[] = [
  {
    slug: "electromecanique",
    nom: "Électromécanique",
    nomCourt: "Électromécanique",
    accroche: "Installer, exploiter et maintenir les équipements électriques et mécaniques.",
    presentation:
      "La filière Électromécanique forme des techniciens capables d'installer, d'exploiter, d'entretenir et de réparer les équipements électriques et mécaniques.",
    domaines: [
      "Électricité industrielle",
      "Machines électriques",
      "Mécanique",
      "Automatisme",
      "Maintenance industrielle",
    ],
    metiers: [
      "Technicien électromécanicien",
      "Technicien de maintenance industrielle",
      "Technicien en installations électriques",
      "Technicien en machines électriques",
      "Technicien en automatisme",
      "Technicien en groupes électrogènes",
      "Technicien en pompage",
      "Technicien en énergie solaire",
    ],
    debouches:
      "Industries, entreprises énergétiques, ateliers de maintenance, stations de pompage, entreprises de construction et services techniques des bâtiments.",
    entreprendre:
      "Entreprise d'installation électrique, atelier de réparation de moteurs, maintenance de pompes, installation et entretien de systèmes solaires et de groupes électrogènes.",
    photo: {
      src: "/photos/stage-centrale-electrique.jpg",
      alt: "Trois étudiants en tenue de travail et casque de chantier devant les installations d'une centrale électrique.",
    },
  },
  {
    slug: "genie-informatique",
    nom: "Génie Informatique",
    nomCourt: "Génie Informatique",
    accroche: "Concevoir, développer, installer et maintenir des systèmes informatiques.",
    presentation:
      "Cette filière prépare les étudiants à concevoir, développer, installer et maintenir des systèmes informatiques.",
    domaines: [
      "Programmation",
      "Développement d'applications",
      "Bases de données",
      "Réseaux",
      "Systèmes d'exploitation",
      "Maintenance informatique",
    ],
    metiers: [
      "Développeur d'applications",
      "Développeur web et mobile",
      "Technicien de maintenance informatique",
      "Administrateur réseaux",
      "Administrateur systèmes",
      "Gestionnaire de bases de données",
      "Technicien support informatique",
      "Technicien en cybersécurité",
    ],
    debouches:
      "Entreprises privées, banques, administrations publiques, établissements d'enseignement, ONG et sociétés de services numériques.",
    entreprendre:
      "Entreprise de développement de logiciels, agence web, atelier de maintenance informatique, installation de réseaux, solutions numériques pour les écoles et les commerces.",
    photo: {
      src: "/photos/salle-informatique-cours.jpg",
      alt: "Étudiants travaillant sur des ordinateurs portables dans une salle de cours.",
    },
  },
  {
    slug: "electronique-telecommunications",
    nom: "Électronique et Télécommunications",
    nomCourt: "Électronique & Télécoms",
    accroche:
      "Installer, contrôler et maintenir les équipements électroniques et de communication.",
    presentation:
      "Cette filière forme des techniciens capables d'installer, de contrôler, de maintenir et de réparer les équipements électroniques et les systèmes de communication.",
    domaines: [
      "Électronique analogique et numérique",
      "Télécommunications",
      "Fibre optique",
      "Radiocommunications",
      "Systèmes de transmission",
    ],
    metiers: [
      "Technicien en électronique",
      "Technicien de maintenance électronique",
      "Technicien en télécommunications",
      "Technicien en fibre optique",
      "Technicien en radiocommunications",
      "Technicien en réseaux de transmission",
      "Technicien en vidéosurveillance",
    ],
    debouches:
      "Opérateurs de télécommunications, entreprises électroniques, sociétés de maintenance, stations de radio et de télévision, entreprises de sécurité électronique.",
    entreprendre:
      "Atelier de réparation électronique, installation de fibre optique, vidéosurveillance, maintenance d'équipements de communication, sous réserve des autorisations requises.",
    photo: {
      src: "/photos/telecoms-antenne-toit-bukavu.jpg",
      alt: "Technicien harnaché installant des équipements de télécommunication sur un mât, au-dessus d'une rue de Bukavu.",
    },
  },
  {
    slug: "genie-civil",
    nom: "Génie Civil (Bâtiment et Travaux Publics)",
    nomCourt: "Génie Civil",
    accroche: "Étudier, réaliser et contrôler les travaux de construction et d'infrastructures.",
    presentation:
      "La filière Génie civil prépare les étudiants à participer à l'étude, à la réalisation et au contrôle des travaux de construction et d'infrastructures.",
    domaines: [
      "Bâtiment",
      "Routes",
      "Topographie",
      "Matériaux de construction",
      "Géotechnique",
      "Métrés et devis",
      "Gestion de chantier",
    ],
    metiers: [
      "Technicien en bâtiment",
      "Chef de chantier",
      "Assistant conducteur de travaux",
      "Métreur",
      "Dessinateur-projeteur",
      "Technicien en topographie",
      "Technicien de laboratoire des matériaux",
      "Technicien en routes et travaux publics",
    ],
    debouches:
      "Entreprises de construction, sociétés de travaux publics, bureaux d'études, cabinets de topographie, laboratoires des matériaux et services publics chargés des infrastructures.",
    entreprendre:
      "Entreprise de construction et de rénovation, bureau de métrés et de devis, dessin technique, pavage, assainissement et drainage.",
    photo: {
      src: "/photos/tp-topographie-2.jpg",
      alt: "Étudiant en gilet et casque de chantier réglant un niveau topographique sur trépied, en plein air.",
    },
  },
];

export const autorites = [
  { fonction: "Directeur Général", nom: "Prof. SINDANO WA KITWANGA Expédit" },
  { fonction: "Secrétaire Général Académique", nom: "Prof. Albert LUKWISHI" },
  { fonction: "Secrétaire Général Administratif", nom: "CT MUSAFIRI MULALI WAZO" },
] as const;

export const stages = {
  pedagogique: {
    titre: "Stage pédagogique",
    description:
      "Il se déroule dans les humanités techniques, pour former à l'enseignement des disciplines techniques.",
    lieux: [
      "Collège Sainte-Anne (Mbobero)",
      "Complexe scolaire La Lune (Bagira)",
      "Complexe scolaire Lapereaux",
    ],
  },
  professionnel: {
    titre: "Stage professionnel",
    description:
      "Il s'effectue en entreprise et en institution. Chaque promotion en bénéficie obligatoirement.",
    lieux: [
      "Office des Routes",
      "BRALIMA",
      "Laboratoire ITFM",
      "Centrale hydroélectrique de la SNEL",
      "Atelier mécanique BRAPRO",
      "Hôpitaux",
    ],
  },
} as const;

export const debouchesAnciens = {
  professionnels: [
    "SNEL",
    "REGIDESO",
    "Fonds sociaux",
    "Bureaux d'études",
    "Réseaux de télécommunications",
    "Banques",
    "Hôtellerie (maintenance)",
    "ONG",
    "Usines",
    "Ministères",
  ],
  enseignement: [
    "Institut Kasali",
    "Institut Antonino",
    "Institut Sainte-Anne",
    "Complexe scolaire Shalom",
    "Complexe scolaire La Colombe",
    "Complexe scolaire Kikyas",
    "Complexe scolaire La Franchise",
  ],
} as const;

export const admission = {
  fraisInscription: "10 $",
  pieces: [
    "Frais d'inscription : 10 $",
    "Bulletins de 5e et 6e humanités",
    "Diplôme d'État ou journal (palmarès)",
    "Une farde chemise",
    "Attestation de bonne vie et mœurs",
    "Attestation de nationalité",
    "Attestation d'aptitude physique",
    "Attestation de naissance",
  ],
} as const;
