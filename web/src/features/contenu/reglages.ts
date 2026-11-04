import type { DefinitionBloc } from "./definitions";

const DEFAUT_INSTITUT = {
  nom: "Institut Supérieur Pédagogique et Technique de Bukavu",
  sigle: "ISPT-Bukavu",
  devise: "Scientia splendet et conscientia",
  statut: "Établissement public d'enseignement supérieur et universitaire",
  mission:
    "Former des ingénieurs en techniques appliquées, aptes à intégrer les entreprises pour contribuer au développement technologique et industriel, et capables d'enseigner dans les établissements techniques afin de renforcer la qualité de l'éducation professionnelle.",
  acteCreation: "Arrêté ministériel n°219/MINESU/CAB.MIN/MML/KOB/2010",
  dateCreation: "8 novembre 2010",
  anneeCreation: "2010",
  anneeOuverture: "2011",
  rue: "Avenue de l'Hippodrome n°102",
  quartier: "quartier Nyawera",
  commune: "commune d'Ibanda",
  ville: "Bukavu",
  province: "Sud-Kivu",
  pays: "République Démocratique du Congo",
  reperes: "À proximité de la Place Mulamba",
  boitePostale: "B.P. 1334 Bukavu",
  latitude: "-2.5025",
  longitude: "28.871667",
  coordonnees: "02°30'09\" S · 28°52'18\" E",
  telephone: "099 924 9630",
  whatsapp: "085 371 5883",
  email: "ispt.bk@gmail.com",
  systemeEtudes: "LMD",
  dureeEtudes: "4 ans",
  semestres: "8",
  diplome: "Licence",
} satisfies Record<string, string>;

/** Réglages généraux de l'institut, modifiables dans l'administration. */
export const REGLAGES_INSTITUT: DefinitionBloc = {
  cle: "institut",
  titre: "Identité de l'institut",
  description: "Nom, statut, mission, adresse et coordonnées affichés sur tout le site.",
  champs: [
    { type: "texte", cle: "nom", libelle: "Nom officiel" },
    { type: "texte", cle: "sigle", libelle: "Sigle" },
    { type: "texte", cle: "devise", libelle: "Devise" },
    { type: "texte", cle: "statut", libelle: "Statut" },
    { type: "texteLong", cle: "mission", libelle: "Mission" },
    { type: "texte", cle: "acteCreation", libelle: "Acte de création" },
    { type: "texte", cle: "dateCreation", libelle: "Date de création (en toutes lettres)" },
    { type: "texte", cle: "anneeCreation", libelle: "Année de création" },
    { type: "texte", cle: "anneeOuverture", libelle: "Année d'ouverture" },
    { type: "texte", cle: "rue", libelle: "Adresse — rue et numéro" },
    { type: "texte", cle: "quartier", libelle: "Adresse — quartier" },
    { type: "texte", cle: "commune", libelle: "Adresse — commune" },
    { type: "texte", cle: "ville", libelle: "Ville" },
    { type: "texte", cle: "province", libelle: "Province" },
    { type: "texte", cle: "pays", libelle: "Pays" },
    { type: "texte", cle: "reperes", libelle: "Repères pour s'y rendre" },
    { type: "texte", cle: "boitePostale", libelle: "Boîte postale" },
    { type: "texte", cle: "latitude", libelle: "Latitude (décimale)", aide: "Exemple : -2.5025" },
    {
      type: "texte",
      cle: "longitude",
      libelle: "Longitude (décimale)",
      aide: "Exemple : 28.871667",
    },
    { type: "texte", cle: "coordonnees", libelle: "Coordonnées affichées" },
    {
      type: "texte",
      cle: "telephone",
      libelle: "Téléphone",
      aide: "Tel qu'affiché, par exemple 099 924 9630",
    },
    { type: "texte", cle: "whatsapp", libelle: "WhatsApp" },
    { type: "texte", cle: "email", libelle: "Adresse email publique" },
    { type: "texte", cle: "systemeEtudes", libelle: "Système d'études" },
    { type: "texte", cle: "dureeEtudes", libelle: "Durée des études" },
    { type: "texte", cle: "semestres", libelle: "Nombre de semestres" },
    { type: "texte", cle: "diplome", libelle: "Diplôme délivré" },
  ],
  defaut: DEFAUT_INSTITUT,
};

export type ReglagesInstitut = Record<keyof typeof DEFAUT_INSTITUT, string>;

const DEFAUT_DOCUMENTS = {
  entete: "Enseignement supérieur et universitaire",
  signataireFonction: "",
  signataireNom: "",
  formuleFinale:
    "En foi de quoi, le présent document lui est délivré pour servir et valoir ce que de droit.",
  mentionPied: "",
} satisfies Record<string, string>;

/**
 * Paramètres des documents officiels (attestations, relevés). Le signataire et
 * les formules exactes doivent être confirmés par l'institut : tant qu'ils ne
 * sont pas saisis, le signataire est déduit des autorités (Secrétaire général
 * académique) et la formule usuelle est utilisée.
 */
export const REGLAGES_DOCUMENTS: DefinitionBloc = {
  cle: "documents",
  titre: "Paramètres des documents officiels",
  description:
    "En-tête, signataire et formules imprimés sur les attestations et relevés de notes. Les bulletins portent les signatures du jury de délibération.",
  champs: [
    { type: "texte", cle: "entete", libelle: "Ligne d'en-tête (tutelle)" },
    {
      type: "texte",
      cle: "signataireFonction",
      libelle: "Fonction du signataire",
      aide: "Exemple : Le Secrétaire Général Académique. Laisser vide pour reprendre l'autorité « académique » de la page Autorités.",
    },
    { type: "texte", cle: "signataireNom", libelle: "Nom du signataire" },
    {
      type: "texteLong",
      cle: "formuleFinale",
      libelle: "Formule finale des attestations",
      max: 400,
    },
    {
      type: "texteLong",
      cle: "mentionPied",
      libelle: "Mention en bas de page (facultatif)",
      aide: "Exemple : référence réglementaire ou mention exigée par l'institut.",
      max: 400,
    },
  ],
  defaut: DEFAUT_DOCUMENTS,
};

export type ReglagesDocuments = Record<keyof typeof DEFAUT_DOCUMENTS, string>;

/** Numéro au format international (+243…) à partir d'un numéro affiché localement. */
export function numeroInternational(affichage: string, indicatif = "243") {
  const chiffres = affichage.replace(/\D/g, "");
  if (!chiffres) return "";
  if (affichage.trim().startsWith("+")) return chiffres;
  if (chiffres.startsWith("00")) return chiffres.slice(2);
  if (chiffres.startsWith(indicatif) && chiffres.length > 10) return chiffres;
  return indicatif + chiffres.replace(/^0/, "");
}

export function lienTelephone(affichage: string) {
  const n = numeroInternational(affichage);
  return n ? `tel:+${n}` : "";
}

export function lienWhatsapp(affichage: string) {
  const n = numeroInternational(affichage);
  return n ? `https://wa.me/${n}` : "";
}
