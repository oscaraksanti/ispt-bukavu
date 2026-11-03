/** Supports de cours acceptés : PDF, images et documents bureautiques courants. */
export const TYPES_SUPPORTS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

/** Plafond par fichier (requête Vercel) ; au-delà, partager un lien. */
export const TAILLE_MAX_SUPPORT = 4 * 1024 * 1024;

/** Lien externe autorisé : http(s) uniquement. */
export function lienValide(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
