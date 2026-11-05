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
