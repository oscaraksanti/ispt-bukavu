/** Règles pures de la médiathèque (testées unitairement). */

export const TYPES_IMAGES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** Taille maximale d'un fichier reçu par le serveur, après réduction dans le navigateur. */
export const TAILLE_MAX_OCTETS = 3.5 * 1024 * 1024;
/** Plus grand côté conservé : suffisant pour un affichage plein écran net. */
export const COTE_MAX_PIXELS = 2400;

export const DOSSIERS_MEDIAS: Record<string, string> = {
  general: "Général",
  "photos-officielles": "Photos officielles",
  campus: "Campus",
  evenements: "Événements",
  formations: "Formations",
  actualites: "Actualités",
  logos: "Logos",
};

/** Nom de fichier sans accents ni caractères spéciaux, sans extension. */
export function nomDeFichierSur(nom: string) {
  const base = (nom.split(/[/\\]/).pop() ?? "").replace(/\.[^.]+$/, "");
  const propre = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return propre || "image";
}

/** Clé de stockage unique : medias/AAAA/MM/<suffixe>-<nom>.webp */
export function cleMedia(date: Date, suffixe: string, nomOriginal: string) {
  const annee = date.getUTCFullYear();
  const mois = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `medias/${annee}/${mois}/${suffixe}-${nomDeFichierSur(nomOriginal)}.webp`;
}

export function tailleLisible(octets: number) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
