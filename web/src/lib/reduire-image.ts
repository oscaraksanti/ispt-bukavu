import { COTE_MAX_PIXELS } from "@/features/medias/regles";

/**
 * Réduit l'image dans le navigateur avant l'envoi : quelques centaines de Ko
 * au lieu de plusieurs Mo, ce qui compte sur une connexion mobile.
 */
export async function reduireImage(fichier: File, coteMax = COTE_MAX_PIXELS): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });
    const echelle = Math.min(1, coteMax / Math.max(bitmap.width, bitmap.height));
    const largeur = Math.round(bitmap.width * echelle);
    const hauteur = Math.round(bitmap.height * echelle);
    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, largeur, hauteur);
    bitmap.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.88));
    return blob && blob.size < fichier.size ? blob : fichier;
  } catch {
    return fichier;
  }
}
