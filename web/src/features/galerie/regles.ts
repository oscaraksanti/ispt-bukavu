/** Galerie : règles pures (ordre des photos), testées unitairement. */

/** Déplace un élément d'un rang vers le haut (-1) ou le bas (+1). */
export function deplacer<T>(liste: T[], index: number, sens: -1 | 1): T[] {
  const cible = index + sens;
  if (index < 0 || index >= liste.length || cible < 0 || cible >= liste.length) return liste;
  const copie = [...liste];
  [copie[index], copie[cible]] = [copie[cible], copie[index]];
  return copie;
}

/** Ajoute des photos à la fin, sans doublon, en conservant l'ordre existant. */
export function ajouterSansDoublon(existants: string[], nouveaux: string[]) {
  const vus = new Set(existants);
  return [...existants, ...nouveaux.filter((id) => !vus.has(id) && vus.add(id))];
}

export const MAX_PHOTOS_PAR_ALBUM = 200;
