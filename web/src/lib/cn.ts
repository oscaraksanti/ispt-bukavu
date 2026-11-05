import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Fusion des classes qui connaît les tailles de texte de la charte (globals.css) :
 * sans cela, `text-corps` serait pris pour une couleur et effacerait `text-white`.
 */
const fusionner = extendTailwindMerge({
  extend: {
    theme: { text: ["legende", "detail", "corps", "chapeau", "titre-page"] },
  },
});

/** Assemble des classes Tailwind en résolvant les conflits. */
export function cn(...valeurs: ClassValue[]) {
  return fusionner(clsx(valeurs));
}

/** Met une majuscule à la première lettre (début de ligne d'adresse, par exemple). */
export function majuscule(texte: string) {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
