/**
 * Campus : règles pures (testées unitairement, sans base de données).
 *
 * Espace d'expression de la communauté, distinct de la valve (officielle).
 * Une publication vise tout l'institut, une filière ou une promotion.
 */

export type Audience = "INSTITUT" | "FILIERE" | "PROMOTION";

export const LIBELLES_AUDIENCE: Record<Audience, string> = {
  INSTITUT: "Tout l'institut",
  FILIERE: "Filière",
  PROMOTION: "Promotion",
};

export const LONGUEUR_PUBLICATION = 3000;
export const LONGUEUR_COMMENTAIRE = 1000;
export const PHOTOS_MAX = 4;
/** Limites d'envoi par heure (contre les rafales). */
export const PUBLICATIONS_PAR_HEURE = 6;
export const COMMENTAIRES_PAR_HEURE = 40;
/** Au-delà de ce nombre de signalements distincts, le contenu est masqué en attendant la modération. */
export const SEUIL_MASQUAGE = 3;

export type Lecteur = {
  id: string;
  personnel: boolean;
  moderateur: boolean;
  /** Filières et promotions de l'étudiant, et celles des cours confiés à l'enseignant. */
  filieres: string[];
  promotions: string[];
};

export type PublicationVisible = {
  auteurId: string | null;
  audience: Audience;
  filiereId: string | null;
  promotionId: string | null;
  statut: "PUBLIEE" | "EN_ATTENTE" | "REFUSEE";
  supprime: boolean;
  masque: boolean;
};

/** Un lecteur peut-il voir cette publication ? */
export function peutVoir(p: PublicationVisible, l: Lecteur) {
  if (p.supprime) return false;
  const auteur = p.auteurId === l.id;
  if (p.statut !== "PUBLIEE" || p.masque) return auteur || l.moderateur;
  if (l.personnel || l.moderateur || auteur) return true;
  if (p.audience === "INSTITUT") return true;
  if (p.audience === "FILIERE") return !!p.filiereId && l.filieres.includes(p.filiereId);
  return !!p.promotionId && l.promotions.includes(p.promotionId);
}

/**
 * Audience demandée par l'auteur : le personnel publie pour toute filière ou
 * promotion ; étudiants et enseignants pour les leurs.
 */
export function audiencePermise(l: Lecteur, audience: Audience, cible: string | null): boolean {
  if (audience === "INSTITUT") return cible === null;
  if (!cible) return false;
  if (l.personnel) return true;
  return audience === "FILIERE" ? l.filieres.includes(cible) : l.promotions.includes(cible);
}

/** Texte : vide refusé (sauf photos), longueur bornée ; null si valide. */
export function verifierTexte(texte: string, max: number, avecPhotos = false): string | null {
  const t = texte.trim();
  if (!t && !avecPhotos) return "Écrivez quelque chose.";
  if (t.length > max) return `Texte trop long (${max} caractères au plus).`;
  return null;
}

export type Segment = { texte: string; lien?: string };

/** Découpe un texte en segments, les adresses web devenant des liens (https seulement). */
export function decouperLiens(texte: string): Segment[] {
  const segments: Segment[] = [];
  const motif = /\bhttps:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/g;
  let dernier = 0;
  for (const m of texte.matchAll(motif)) {
    if (m.index > dernier) segments.push({ texte: texte.slice(dernier, m.index) });
    segments.push({ texte: m[0], lien: m[0] });
    dernier = m.index + m[0].length;
  }
  if (dernier < texte.length) segments.push({ texte: texte.slice(dernier) });
  return segments;
}

/** « il y a 5 min », « il y a 3 h », « hier », puis la date. */
export function ilYA(d: Date, maintenant: Date, fuseau = "Africa/Lubumbashi") {
  const s = Math.max(0, Math.round((maintenant.getTime() - d.getTime()) / 1000));
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  const jour = (x: Date) => x.toLocaleDateString("fr-FR", { timeZone: fuseau });
  if (jour(d) === jour(maintenant)) return `il y a ${Math.floor(s / 3600)} h`;
  if (jour(d) === jour(new Date(maintenant.getTime() - 86_400_000))) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: fuseau });
}

/** « 1 J'aime », « 12 J'aime », « Vous et 3 autres ». */
export function libelleJaime(total: number, moi: boolean) {
  if (total === 0) return "";
  if (moi && total === 1) return "Vous";
  if (moi) return `Vous et ${total - 1} autre${total > 2 ? "s" : ""}`;
  return `${total}`;
}

export const REGLES_PAR_DEFAUT = [
  "Le Campus est l'espace d'échange des étudiants, des enseignants et du personnel de l'institut. Les annonces officielles restent publiées sur la valve.",
  "Restez courtois : ni insulte, ni moquerie, ni propos discriminatoire.",
  "Ne publiez ni les données personnelles d'autrui, ni la photo d'une personne sans son accord.",
  "Pas de triche, de vente de sujets d'examen ou d'arnaque.",
  "Les contenus signalés sont examinés par la modération, qui peut les masquer.",
].join("\n");
