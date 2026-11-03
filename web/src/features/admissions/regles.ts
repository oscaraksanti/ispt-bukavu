/**
 * Règles métier des admissions, sans base de données (testées unitairement).
 */

export type Statut =
  | "BROUILLON"
  | "SOUMISE"
  | "EN_EXAMEN"
  | "COMPLEMENT"
  | "ADMISE"
  | "REFUSEE"
  | "INSCRITE"
  | "ABANDONNEE";

export const LIBELLES_STATUT: Record<Statut, string> = {
  BROUILLON: "En préparation",
  SOUMISE: "Dossier déposé",
  EN_EXAMEN: "En cours d'examen",
  COMPLEMENT: "Complément demandé",
  ADMISE: "Admis",
  REFUSEE: "Non retenu",
  INSCRITE: "Inscrit",
  ABANDONNEE: "Abandonné",
};

export const TON_STATUT: Record<Statut, "neutre" | "ispt" | "attention" | "succes" | "erreur"> = {
  BROUILLON: "neutre",
  SOUMISE: "ispt",
  EN_EXAMEN: "ispt",
  COMPLEMENT: "attention",
  ADMISE: "succes",
  REFUSEE: "erreur",
  INSCRITE: "succes",
  ABANDONNEE: "neutre",
};

/** Décisions possibles du secrétariat selon l'état du dossier. */
export const DECISIONS: Record<Statut, Statut[]> = {
  BROUILLON: [],
  SOUMISE: ["EN_EXAMEN", "COMPLEMENT", "ADMISE", "REFUSEE"],
  EN_EXAMEN: ["COMPLEMENT", "ADMISE", "REFUSEE"],
  COMPLEMENT: [],
  ADMISE: ["INSCRITE"],
  REFUSEE: ["EN_EXAMEN"],
  INSCRITE: [],
  ABANDONNEE: [],
};

export function decisionPermise(de: Statut, vers: Statut) {
  return DECISIONS[de].includes(vers);
}

/** Une décision défavorable ou une demande de complément doit être motivée. */
export function motifRequis(vers: Statut) {
  return vers === "REFUSEE" || vers === "COMPLEMENT";
}

/** Le candidat ne modifie son dossier qu'avant le dépôt ou sur demande de complément. */
export function dossierModifiable(statut: Statut) {
  return statut === "BROUILLON" || statut === "COMPLEMENT";
}

export function campagneOuverte(
  c: { statut: string; ouverture: Date; cloture: Date },
  maintenant = new Date(),
) {
  return c.statut === "OUVERTE" && c.ouverture <= maintenant && maintenant <= c.cloture;
}

export function numeroCandidature(annee: number, rang: number) {
  return `${annee}-${String(rang).padStart(4, "0")}`;
}

export type DossierAVerifier = {
  nom?: string | null;
  prenom?: string | null;
  sexe?: string | null;
  dateNaissance?: Date | null;
  lieuNaissance?: string | null;
  nationalite?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ecoleOrigine?: string | null;
  sectionHumanites?: string | null;
  anneeDiplome?: number | null;
  filiereId?: string | null;
  referencePaiement?: string | null;
};

const CHAMPS_REQUIS: [keyof DossierAVerifier, string][] = [
  ["nom", "Nom"],
  ["prenom", "Prénom"],
  ["sexe", "Sexe"],
  ["dateNaissance", "Date de naissance"],
  ["lieuNaissance", "Lieu de naissance"],
  ["nationalite", "Nationalité"],
  ["telephone", "Téléphone"],
  ["adresse", "Adresse"],
  ["ecoleOrigine", "École d'origine"],
  ["sectionHumanites", "Section des humanités"],
  ["anneeDiplome", "Année du diplôme d'État"],
  ["filiereId", "Filière choisie"],
  ["referencePaiement", "Référence du paiement des frais"],
];

/**
 * Liste de ce qui manque pour déposer le dossier : champs requis et pièces
 * obligatoires non déposées ou refusées.
 */
export function elementsManquants(
  dossier: DossierAVerifier,
  piecesExigees: { id: string; libelle: string; obligatoire: boolean }[],
  depots: { pieceExigeeId: string; statut: string }[],
) {
  const manquants: string[] = [];
  for (const [cle, libelle] of CHAMPS_REQUIS) {
    const v = dossier[cle];
    if (v === null || v === undefined || (typeof v === "string" && !v.trim()))
      manquants.push(libelle);
  }
  for (const piece of piecesExigees) {
    if (!piece.obligatoire) continue;
    const depot = depots.find((d) => d.pieceExigeeId === piece.id);
    if (!depot || depot.statut === "REJETEE") manquants.push(piece.libelle);
  }
  return manquants;
}

/** Après la connexion, chacun arrive dans son espace. */
export function espaceParDefaut(roles: string[], rolesPersonnel: string[]) {
  if (roles.some((r) => rolesPersonnel.includes(r))) return "/admin";
  if (roles.includes("candidat")) return "/candidat";
  return "/";
}

/** Une pièce par ligne ; « (facultatif) » en fin de ligne la rend facultative. */
export function lirePieces(texte: string) {
  return texte
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, ordre) => {
      const facultatif = /\(facultati(f|ve)\)\s*$/i.test(l);
      return {
        libelle: l.replace(/\s*\(facultati(f|ve)\)\s*$/i, "").slice(0, 160),
        obligatoire: !facultatif,
        ordre,
      };
    });
}
