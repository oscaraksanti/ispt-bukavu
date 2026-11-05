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

export type Mention = { id: string; nom: string };
export const MENTIONS_MAX = 10;

/**
 * Mentions retenues : celles choisies dans la liste dont « @Nom » figure
 * encore dans le texte (une mention effacée du texte n'est pas notifiée).
 */
export function mentionsRetenues(texte: string, choisies: Mention[]): Mention[] {
  const vues = new Set<string>();
  return choisies
    .filter((m) => {
      if (vues.has(m.id) || !m.nom.trim() || !texte.includes(`@${m.nom}`)) return false;
      vues.add(m.id);
      return true;
    })
    .slice(0, MENTIONS_MAX);
}

/** Lit le champ caché des mentions envoyé par le formulaire. */
export function lireMentions(brut: unknown): Mention[] {
  try {
    const v = JSON.parse(String(brut ?? "[]"));
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (m): m is Mention =>
          !!m &&
          typeof m.id === "string" &&
          typeof m.nom === "string" &&
          /^[a-z0-9]{10,40}$/i.test(m.id),
      )
      .map((m) => ({ id: m.id, nom: m.nom.slice(0, 80) }));
  } catch {
    return [];
  }
}

export type SegmentRiche = Segment & { mention?: boolean };

/** Découpe un texte en liens et en mentions « @Nom » (noms les plus longs d'abord). */
export function decouperTexte(texte: string, noms: string[]): SegmentRiche[] {
  const tries = [...new Set(noms.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!tries.length) return decouperLiens(texte);
  const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const motif = new RegExp(`@(?:${tries.map(echapper).join("|")})`, "g");
  const sortie: SegmentRiche[] = [];
  let dernier = 0;
  for (const m of texte.matchAll(motif)) {
    if (m.index > dernier) sortie.push(...decouperLiens(texte.slice(dernier, m.index)));
    sortie.push({ texte: m[0], mention: true });
    dernier = m.index + m[0].length;
  }
  if (dernier < texte.length) sortie.push(...decouperLiens(texte.slice(dernier)));
  return sortie;
}

/** Mot en cours de saisie juste avant le curseur, s'il commence par « @ » (suggestions). */
export function mentionEnCours(texte: string, curseur: number) {
  const avant = texte.slice(0, curseur);
  const m = /(?:^|\s)@([\p{L}' -]{0,30})$/u.exec(avant);
  if (!m) return null;
  const requete = m[1];
  // « @Jean Pierre » : on s'arrête au deuxième espace pour ne pas avaler la phrase.
  if ((requete.match(/ /g) ?? []).length > 1) return null;
  return { debut: avant.length - requete.length - 1, requete: requete.trim() };
}
