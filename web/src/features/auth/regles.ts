/**
 * Règles d'authentification pures (testées unitairement, sans base de données).
 */

export const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
export const DUREE_JETON_REINITIALISATION_MS = 60 * 60 * 1000;
export const DUREE_JETON_INVITATION_MS = 72 * 60 * 60 * 1000;

/** Fenêtre et plafonds de la limitation des tentatives de connexion. */
export const FENETRE_TENTATIVES_MS = 15 * 60 * 1000;
export const MAX_ECHECS_PAR_EMAIL = 5;
export const MAX_ECHECS_PAR_IP = 20;

export function estBloque(echecsEmail: number, echecsIp: number) {
  return echecsEmail >= MAX_ECHECS_PAR_EMAIL || echecsIp >= MAX_ECHECS_PAR_IP;
}

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
  if (!suite || !suite.startsWith("/") || suite.startsWith("//") || suite.startsWith("/\\"))
    return defaut;
  return suite;
}
