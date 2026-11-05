/**
 * Messagerie : règles pures (testées unitairement, sans base de données).
 *
 * Qui peut écrire à qui (proposition par défaut, à valider par l'institut) :
 * - le personnel et les enseignants écrivent à toute personne ayant accès à la messagerie ;
 * - un étudiant écrit aux étudiants de sa promotion, à ses enseignants et au personnel ;
 * - les candidats n'ont pas accès à la messagerie (formulaire de contact et suivi de dossier).
 */

export type ProfilMessagerie = {
  id: string;
  personnel: boolean;
  enseignant: boolean;
  etudiant: boolean;
  /** Promotions de l'année en cours (inscriptions non abandonnées). */
  promotions: string[];
  /** Enseignants : promotions des cours qui leur sont confiés. */
  promotionsEnseignees: string[];
};

export const LONGUEUR_MAX = 4000;
/** Au-delà, l'envoi est refusé pendant une minute (protection contre les envois en rafale). */
export const ENVOIS_PAR_MINUTE = 20;

export function aAccesMessagerie(
  p: Pick<ProfilMessagerie, "personnel" | "enseignant" | "etudiant">,
) {
  return p.personnel || p.enseignant || p.etudiant;
}

const partage = (a: string[], b: string[]) => a.some((x) => b.includes(x));

/** Un auteur peut-il ouvrir une conversation privée avec cette personne ? */
export function peutEcrireA(auteur: ProfilMessagerie, cible: ProfilMessagerie) {
  if (auteur.id === cible.id) return false;
  if (!aAccesMessagerie(auteur) || !aAccesMessagerie(cible)) return false;
  if (auteur.personnel || auteur.enseignant) return true;
  // Étudiant (sans autre rôle) :
  if (cible.personnel) return true;
  if (cible.enseignant && partage(auteur.promotions, cible.promotionsEnseignees)) return true;
  return cible.etudiant && partage(auteur.promotions, cible.promotions);
}

/** Clé unique d'une conversation privée, indépendante de l'ordre des deux personnes. */
export function clePrivee(a: string, b: string) {
  return `privee:${[a, b].sort().join(":")}`;
}

export const clePromotion = (promotionId: string) => `promotion:${promotionId}`;
export const cleCours = (coursOffertId: string) => `cours:${coursOffertId}`;

/** Texte saisi : espaces superflus retirés ; null s'il est valide, sinon le message d'erreur. */
export function verifierContenu(texte: string, avecPiece: boolean): string | null {
  const t = texte.trim();
  if (!t && !avecPiece) return "Écrivez un message ou joignez un fichier.";
  if (t.length > LONGUEUR_MAX) return `Message trop long (${LONGUEUR_MAX} caractères au plus).`;
  return null;
}

export function normaliserContenu(texte: string) {
  return texte
    .replace(/\r\n?/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/** Aperçu d'une ligne pour la liste des conversations. */
export function apercu(m: { contenu: string; supprime: boolean; masque: boolean; piece: boolean }) {
  if (m.masque) return "Message masqué par la modération";
  if (m.supprime) return "Message supprimé";
  const texte = m.contenu.replace(/\s+/g, " ").trim();
  if (!texte) return m.piece ? "Pièce jointe" : "";
  return texte.length > 90 ? `${texte.slice(0, 89)}…` : texte;
}

/** Peut-on écrire dans ce groupe ? Les animateurs le peuvent toujours. */
export function peutPublier(c: { annoncesSeulement: boolean }, animateur: boolean) {
  return animateur || !c.annoncesSeulement;
}

/**
 * Accusé de lecture d'un message envoyé : « Vu » (conversation privée) ou
 * nombre de membres l'ayant lu (groupe).
 */
export function lecteurs(envoyeLe: Date, lectures: (Date | null)[]) {
  return lectures.filter((l) => l !== null && l >= envoyeLe).length;
}

/** Libellé de l'horodatage dans la liste : heure aujourd'hui, sinon date courte. */
export function quandCourt(d: Date, maintenant: Date, fuseau = "Africa/Lubumbashi") {
  const jour = (x: Date) => x.toLocaleDateString("fr-FR", { timeZone: fuseau });
  if (jour(d) === jour(maintenant))
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: fuseau });
  const hier = new Date(maintenant.getTime() - 86_400_000);
  if (jour(d) === jour(hier)) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: fuseau });
}

export const MOTIFS_SIGNALEMENT = {
  HARCELEMENT: "Harcèlement ou insulte",
  HAINE: "Propos haineux ou discriminatoires",
  INAPPROPRIE: "Contenu inapproprié",
  FRAUDE: "Fraude, triche ou arnaque",
  AUTRE: "Autre",
} as const;
