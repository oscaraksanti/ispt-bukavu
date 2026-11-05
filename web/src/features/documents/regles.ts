/** Documents officiels vérifiables (fonctions pures, testées). */

export type TypeDocument =
  "ATTESTATION_FREQUENTATION" | "RELEVE_NOTES" | "ATTESTATION_REUSSITE" | "BULLETIN";

export const LIBELLES_DOCUMENT: Record<TypeDocument, string> = {
  ATTESTATION_FREQUENTATION: "Attestation de fréquentation",
  RELEVE_NOTES: "Relevé de notes",
  ATTESTATION_REUSSITE: "Attestation de réussite",
  BULLETIN: "Bulletin de notes",
};

/** Bulletin issu d'une délibération proclamée (figé au moment de la proclamation). */
export type DonneesBulletin = {
  periode: string;
  annuel: boolean;
  semestres: {
    numero: number;
    moyenne: number | null;
    creditsValides: number;
    creditsTotal: number;
    mention: string | null;
    cours: {
      intitule: string;
      ue: string;
      credits: number;
      note: number | null;
      valide: boolean;
    }[];
  }[];
  moyenne: number | null;
  total: number;
  creditsValides: number;
  creditsTotal: number;
  mention: { lettre: string; libelle: string } | null;
  decision: { code: string; libelle: string } | null;
  rang: number | null;
  effectif: number;
  jury: { secretaire: string; president: string };
  dateJury: string | null;
  proclameLe: string;
  reglement: { seuil: number; arrondi: string; calcul: string };
  echelle: { seuil: number; lettre: string; libelle: string }[];
};

/** Résultat proclamé par le jury, repris sur un relevé ou une attestation de réussite. */
export type ResultatProclame = {
  periode: string;
  moyenne: number | null;
  mention: { lettre: string; libelle: string } | null;
  decision: { code: string; libelle: string } | null;
  creditsValides: number;
  creditsTotal: number;
  proclameLe: string;
};

/** Contenu figé au moment de l'émission : il ne change plus, même si la base évolue. */
export type DonneesDocument = {
  nom: string;
  matricule: string;
  sexe: "F" | "M" | null;
  dateNaissance: string | null;
  lieuNaissance: string | null;
  promotion: string;
  filiere: string;
  niveau: string;
  annee: string;
  seuil: number;
  bulletin?: DonneesBulletin;
  /** Relevé et attestation de réussite émis depuis une délibération proclamée. */
  resultat?: ResultatProclame;
  semestres?: {
    numero: number;
    moyenne: number | null;
    mention?: string | null;
    creditsAcquis: number;
    creditsTotal: number;
    /** `valide` : décision figée du jury (absente des documents plus anciens). */
    cours: { intitule: string; credits: number; note: number | null; valide?: boolean }[];
  }[];
};

/** Code saisi par un tiers : majuscules, tirets remis tous les quatre caractères. */
export function normaliserCodeDocument(saisie: string) {
  const brut = saisie.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return brut.replace(/(.{4})(?=.)/g, "$1-");
}

export function formatCodeValide(code: string) {
  return /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code);
}

/**
 * Ce qu'un tiers voit en vérifiant : l'identité, et pour un document de
 * résultats, la moyenne, la mention, les crédits et la décision du jury (de
 * quoi détecter une moyenne retouchée sur papier), sans les notes détaillées.
 */
export function resumeVerification(d: DonneesDocument) {
  const r = d.bulletin ?? d.resultat ?? null;
  return {
    nom: d.nom,
    matricule: d.matricule,
    promotion: `${d.niveau} · ${d.filiere}`,
    annee: d.annee,
    periode: r?.periode ?? null,
    resultat: r
      ? {
          moyenne: r.moyenne,
          mention: r.mention ? `${r.mention.lettre} · ${r.mention.libelle}` : null,
          credits: `${r.creditsValides} sur ${r.creditsTotal}`,
          decision: r.decision?.libelle ?? null,
        }
      : null,
  };
}

/** « Monsieur » / « Madame » pour la formule des attestations. */
export function civilite(sexe: "F" | "M" | null) {
  return sexe === "F" ? "Madame" : sexe === "M" ? "Monsieur" : "";
}
