/**
 * Mise en forme minimale et sûre des textes saisis dans l'administration :
 * paragraphes séparés par une ligne vide, intertitres « ## », listes « - ».
 * Aucun HTML n'est interprété, ce qui exclut toute injection de code.
 */
export type BlocTexte =
  | { type: "paragraphe"; texte: string }
  | { type: "intertitre"; texte: string }
  | { type: "liste"; elements: string[] };

export function analyserTexte(source: string): BlocTexte[] {
  const blocs: BlocTexte[] = [];
  const groupes = source
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((g) => g.trim())
    .filter(Boolean);
  for (const groupe of groupes) {
    const lignes = groupe.split("\n").map((l) => l.trim());
    if (lignes.length === 1 && /^#{2,3}\s+/.test(lignes[0])) {
      blocs.push({ type: "intertitre", texte: lignes[0].replace(/^#{2,3}\s+/, "") });
    } else if (lignes.every((l) => /^[-•*]\s+/.test(l))) {
      blocs.push({ type: "liste", elements: lignes.map((l) => l.replace(/^[-•*]\s+/, "")) });
    } else {
      blocs.push({ type: "paragraphe", texte: lignes.join(" ") });
    }
  }
  return blocs;
}

/** Temps de lecture estimé, en minutes (au moins une). */
export function tempsDeLecture(source: string) {
  const mots = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(mots / 200));
}
