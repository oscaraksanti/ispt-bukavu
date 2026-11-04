/** Devoirs : règles pures (testées sans base de données). */

export type EtatRemise = "a_rendre" | "rendu" | "rendu_en_retard" | "corrige" | "non_rendu";

export const LIBELLES_ETAT: Record<EtatRemise, string> = {
  a_rendre: "À rendre",
  rendu: "Rendu",
  rendu_en_retard: "Rendu en retard",
  corrige: "Corrigé",
  non_rendu: "Non rendu",
};

/** L'étudiant peut-il (encore) déposer ou remplacer sa copie ? */
export function depotOuvert(
  devoir: { echeance: Date; accepteRetard: boolean },
  remise: { corrigeLe: Date | null } | null,
  maintenant = new Date(),
) {
  if (remise?.corrigeLe) return false;
  return maintenant <= devoir.echeance || devoir.accepteRetard;
}

/** État d'un devoir pour un étudiant, à partir de sa copie éventuelle. */
export function etatRemise(
  devoir: { echeance: Date; accepteRetard: boolean },
  remise: { enRetard: boolean; corrigeLe: Date | null } | null,
  maintenant = new Date(),
): EtatRemise {
  if (remise?.corrigeLe) return "corrige";
  if (remise) return remise.enRetard ? "rendu_en_retard" : "rendu";
  return depotOuvert(devoir, null, maintenant) ? "a_rendre" : "non_rendu";
}

/** Une copie déposée après l'échéance est marquée en retard. */
export function estEnRetard(echeance: Date, deposeLe: Date) {
  return deposeLe > echeance;
}

/** Fichiers acceptés pour une copie : PDF, images, Word. */
export const TYPES_REMISE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const TAILLE_MAX_REMISE = 4 * 1024 * 1024;

/** Vérifie la signature du fichier (le type annoncé par le navigateur ne suffit pas). */
export function signatureValide(extension: string, debut: Uint8Array) {
  const octets = (...o: number[]) => o.every((v, i) => debut[i] === v);
  switch (extension) {
    case "pdf":
      return octets(0x25, 0x50, 0x44, 0x46, 0x2d);
    case "jpg":
      return octets(0xff, 0xd8, 0xff);
    case "png":
      return octets(0x89, 0x50, 0x4e, 0x47);
    case "webp":
      return octets(0x52, 0x49, 0x46, 0x46);
    case "docx":
      return octets(0x50, 0x4b, 0x03, 0x04);
    default:
      return false;
  }
}
