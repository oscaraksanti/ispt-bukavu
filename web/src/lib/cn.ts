import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Assemble des classes Tailwind en résolvant les conflits. */
export function cn(...valeurs: ClassValue[]) {
  return twMerge(clsx(valeurs));
}
