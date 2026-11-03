import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Assemble des classes Tailwind en résolvant les conflits. */
export function cn(...valeurs: ClassValue[]) {
  return twMerge(clsx(valeurs));
}

/** Met une majuscule à la première lettre (début de ligne d'adresse, par exemple). */
export function majuscule(texte: string) {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
