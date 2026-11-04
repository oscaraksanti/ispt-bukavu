/**
 * Règles d'authentification pures (testées unitairement, sans base de données).
 */

export const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
export const DUREE_JETON_REINITIALISATION_MS = 60 * 60 * 1000;
export const DUREE_JETON_INVITATION_MS = 72 * 60 * 60 * 1000;

/** Fenêtre et plafonds de la limitation des tentatives de connexion. */
export const FENETRE_TENTATIVES_MS = 15 * 60 * 1000;
/** Échecs pour un même identifiant depuis une même adresse IP. */
export const MAX_ECHECS_PAR_EMAIL = 5;
/** Échecs pour un même identifiant, toutes adresses confondues (attaque distribuée). */
export const MAX_ECHECS_PAR_COMPTE = 50;
export const MAX_ECHECS_PAR_IP = 20;

/**
 * Le blocage vise d'abord le couple identifiant + adresse IP : un tiers qui
 * connaît un matricule ne peut donc pas empêcher l'étudiant de se connecter
 * depuis son propre téléphone. Un plafond plus haut par compte arrête une
 * attaque répartie sur de nombreuses adresses.
 */
export function estBloque(echecsEmailIp: number, echecsIp: number, echecsCompte = 0) {
  return (
    echecsEmailIp >= MAX_ECHECS_PAR_EMAIL ||
    echecsIp >= MAX_ECHECS_PAR_IP ||
    echecsCompte >= MAX_ECHECS_PAR_COMPTE
  );
}

/** Demandes de lien de réinitialisation ou d'inscriptions par heure. */
export const FENETRE_DEMANDES_MS = 60 * 60 * 1000;
export const MAX_DEMANDES_PAR_EMAIL = 3;
export const MAX_DEMANDES_PAR_IP = 10;

/**
 * Politique de mot de passe : au moins 10 caractères, avec lettres et
 * chiffres. Retourne le message d'erreur, ou null si le mot de passe convient.
 */
export function verifierMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length < 10) return "Le mot de passe doit contenir au moins 10 caractères.";
  if (motDePasse.length > 128) return "Le mot de passe est trop long.";
  if (!/[a-zA-Z]/.test(motDePasse) || !/[0-9]/.test(motDePasse))
    return "Le mot de passe doit contenir des lettres et des chiffres.";
  return null;
}

export function normaliserEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Évite les redirections vers un autre site après connexion. */
export function destinationSure(suite: string | null | undefined, defaut = "/admin") {
  // Ni caractère de contrôle ni barre oblique inverse : les navigateurs les
  // suppriment ou les convertissent, ce qui transformerait « /\t/site » en « //site ».
  if (!suite || !suite.startsWith("/") || /[\x00-\x1f\x7f\\]/.test(suite)) return defaut;
  if (suite.startsWith("//")) return defaut;
  try {
    const url = new URL(suite, "https://ispt.invalid");
    if (url.origin !== "https://ispt.invalid") return defaut;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return defaut;
  }
}

/** Matricule tel qu'enregistré : majuscules, sans espaces. */
export function normaliserMatricule(matricule: string) {
  return matricule.replace(/\s+/g, "").toUpperCase();
}

/** Identifiant de connexion : adresse email ou matricule d'étudiant. */
export function normaliserIdentifiant(identifiant: string) {
  return identifiant.includes("@")
    ? normaliserEmail(identifiant)
    : normaliserMatricule(identifiant);
}
