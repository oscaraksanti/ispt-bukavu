/** Règles pures de l'espace « Mon compte » (testées unitairement). */

/** Préfixe des tentatives de changement de mot de passe dans TentativeConnexion. */
export const PREFIXE_CHANGEMENT = "changement-mdp:";

const NAVIGATEURS: [RegExp, string][] = [
  [/Edg(A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMES: [RegExp, string][] = [
  [/Android/, "Android"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

/** « Chrome sur Android » à partir de l'en-tête User-Agent enregistré avec la session. */
export function decrireAppareil(agent: string | null | undefined) {
  if (!agent) return "Appareil inconnu";
  const navigateur = NAVIGATEURS.find(([r]) => r.test(agent))?.[1];
  const systeme = SYSTEMES.find(([r]) => r.test(agent))?.[1];
  if (navigateur && systeme) return `${navigateur} sur ${systeme}`;
  return navigateur ?? systeme ?? "Appareil inconnu";
}

/** Photo de profil : formats acceptés et taille maximale du fichier envoyé. */
export const TYPES_PHOTO_PROFIL = ["image/jpeg", "image/png", "image/webp"];
export const TAILLE_MAX_PHOTO_PROFIL = 4 * 1024 * 1024;

export function verifierPhotoProfil(f: { type: string; size: number } | null) {
  if (!f || f.size === 0) return "Choisissez une photo.";
  if (!TYPES_PHOTO_PROFIL.includes(f.type)) return "Formats acceptés : JPEG, PNG ou WebP.";
  if (f.size > TAILLE_MAX_PHOTO_PROFIL) return "Photo trop lourde (4 Mo au plus).";
  return null;
}

/**
 * Qui peut voir la photo de profil d'un compte : le titulaire, et les membres
 * de l'institut (personnel, enseignants, étudiants). Un candidat ne voit que
 * la sienne ; un visiteur non connecté, aucune.
 */
export function peutVoirPhoto(lecteur: { id: string; roles: string[] } | null, cibleId: string) {
  if (!lecteur) return false;
  if (lecteur.id === cibleId) return true;
  return lecteur.roles.some((r) => r !== "candidat");
}

/** Initiales affichées à défaut de photo (deux lettres au plus). */
export function initialesDe(nom: string) {
  return (
    nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((m) => m[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
