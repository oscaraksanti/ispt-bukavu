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
  // L'inscription d'un admis passe par l'attribution d'un matricule (inscrireAdmis).
  ADMISE: [],
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
];

/**
 * Liste de ce qui manque pour déposer le dossier : champs requis et pièces
 * obligatoires non déposées ou refusées.
 */
export function elementsManquants(
  dossier: DossierAVerifier,
  piecesExigees: { id: string; libelle: string; obligatoire: boolean }[],
  depots: { pieceExigeeId: string; statut: string }[],
  options: { fraisExiges?: boolean } = { fraisExiges: true },
) {
  const manquants: string[] = [];
  for (const [cle, libelle] of CHAMPS_REQUIS) {
    const v = dossier[cle];
    if (v === null || v === undefined || (typeof v === "string" && !v.trim()))
      manquants.push(libelle);
  }
  // La référence n'est demandée que si la campagne fixe des frais de dossier.
  if (options.fraisExiges !== false && !dossier.referencePaiement?.trim())
    manquants.push("Référence du paiement des frais");
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
  if (roles.includes("enseignant")) return "/enseignant";
  if (roles.includes("etudiant")) return "/etudiant";
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

/* ---------- Frais de dossier ---------- */

/** Des frais ne sont exigés que si la campagne en fixe un montant (jamais inventé). */
export function fraisExiges(campagne: { fraisInscription: unknown }) {
  return Number(campagne.fraisInscription) > 0;
}

export type EtatPaiement = "SANS_FRAIS" | "A_SAISIR" | "A_VERIFIER" | "VERIFIE" | "REFUSE";

export function etatPaiement(
  c: {
    referencePaiement?: string | null;
    paiementVerifieLe?: Date | null;
    paiementMotifRefus?: string | null;
  },
  exiges: boolean,
): EtatPaiement {
  if (c.paiementVerifieLe) return "VERIFIE";
  if (!exiges) return "SANS_FRAIS";
  if (c.paiementMotifRefus) return "REFUSE";
  return c.referencePaiement?.trim() ? "A_VERIFIER" : "A_SAISIR";
}

export const LIBELLES_PAIEMENT: Record<EtatPaiement, string> = {
  SANS_FRAIS: "Aucuns frais",
  A_SAISIR: "Référence à indiquer",
  A_VERIFIER: "À vérifier par la caisse",
  VERIFIE: "Paiement vérifié",
  REFUSE: "Paiement non reconnu",
};

/** Le candidat peut corriger sa référence tant que la caisse ne l'a pas vérifiée. */
export function paiementCorrigeable(statut: Statut, etat: EtatPaiement) {
  return (
    etat === "REFUSE" && (statut === "SOUMISE" || statut === "EN_EXAMEN" || statut === "COMPLEMENT")
  );
}

/** Numéro du reçu des frais de dossier : « AD-2026-0007 ». */
export function numeroRecuDossier(annee: number, rang: number) {
  return `AD-${annee}-${String(rang).padStart(4, "0")}`;
}

/* ---------- Suivi d'une campagne ---------- */

export type DossierSuivi = {
  statut: Statut;
  filiere: string | null;
  soumiseLe: Date | null;
  decideLe: Date | null;
  etatPaiement: EtatPaiement;
};

const JOUR_MS = 86_400_000;

/**
 * Indicateurs d'une campagne : dossiers par état et par filière, délai
 * médian entre dépôt et décision, frais à vérifier. Les brouillons comptent
 * comme « comptes ouverts » mais pas comme dossiers déposés.
 */
export function statistiquesCampagne(dossiers: DossierSuivi[]) {
  const deposes = dossiers.filter((d) => d.statut !== "BROUILLON" && d.statut !== "ABANDONNEE");
  const parStatut = Object.fromEntries(
    (Object.keys(LIBELLES_STATUT) as Statut[]).map((s) => [
      s,
      dossiers.filter((d) => d.statut === s).length,
    ]),
  ) as Record<Statut, number>;
  const filieres = new Map<string, { deposes: number; admis: number }>();
  for (const d of deposes) {
    const cle = d.filiere ?? "Filière non choisie";
    const f = filieres.get(cle) ?? { deposes: 0, admis: 0 };
    f.deposes++;
    if (d.statut === "ADMISE" || d.statut === "INSCRITE") f.admis++;
    filieres.set(cle, f);
  }
  const delais = deposes
    .filter((d) => d.soumiseLe && d.decideLe)
    .map((d) => (d.decideLe!.getTime() - d.soumiseLe!.getTime()) / JOUR_MS)
    .sort((a, b) => a - b);
  const median =
    delais.length === 0
      ? null
      : delais.length % 2
        ? delais[(delais.length - 1) / 2]
        : (delais[delais.length / 2 - 1] + delais[delais.length / 2]) / 2;
  const decides = deposes.filter((d) => ["ADMISE", "REFUSEE", "INSCRITE"].includes(d.statut));
  return {
    comptesOuverts: dossiers.length,
    deposes: deposes.length,
    enAttente: parStatut.SOUMISE + parStatut.EN_EXAMEN,
    parStatut,
    parFiliere: [...filieres.entries()]
      .map(([nom, v]) => ({ nom, ...v }))
      .sort((a, b) => b.deposes - a.deposes),
    delaiMedianJours: median === null ? null : Math.round(median * 10) / 10,
    tauxAdmission:
      decides.length === 0
        ? null
        : Math.round((100 * decides.filter((d) => d.statut !== "REFUSEE").length) / decides.length),
    paiementsAVerifier: deposes.filter((d) => d.etatPaiement === "A_VERIFIER").length,
  };
}
