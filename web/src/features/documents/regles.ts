/** Documents officiels vérifiables (fonctions pures, testées). */

export type TypeDocument = "ATTESTATION_FREQUENTATION" | "RELEVE_NOTES" | "ATTESTATION_REUSSITE";

export const LIBELLES_DOCUMENT: Record<TypeDocument, string> = {
  ATTESTATION_FREQUENTATION: "Attestation de fréquentation",
  RELEVE_NOTES: "Relevé de notes",
  ATTESTATION_REUSSITE: "Attestation de réussite",
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
  semestres?: {
    numero: number;
    moyenne: number | null;
    creditsAcquis: number;
    creditsTotal: number;
    cours: { intitule: string; credits: number; note: number | null }[];
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

/** Ce qu'un tiers voit en vérifiant : l'essentiel, sans les notes détaillées. */
export function resumeVerification(d: DonneesDocument) {
  return {
    nom: d.nom,
    matricule: d.matricule,
    promotion: `${d.niveau} · ${d.filiere}`,
    annee: d.annee,
  };
}

/** « Monsieur » / « Madame » pour la formule des attestations. */
export function civilite(sexe: "F" | "M" | null) {
  return sexe === "F" ? "Madame" : sexe === "M" ? "Monsieur" : "";
}
