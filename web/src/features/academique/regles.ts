/** Règles pures de la structure académique LMD (testées unitairement). */

/** Semestres d'un niveau : L1 → S1 et S2, L2 → S3 et S4, etc. */
export function semestresDuNiveau(ordre: number) {
  return [ordre * 2 - 1, ordre * 2];
}

/** Libellé court d'une promotion : « L2 Génie Civil ». */
export function libellePromotion(p: { niveau: { code: string }; filiere: { nomCourt: string } }) {
  return `${p.niveau.code} ${p.filiere.nomCourt}`;
}

/** Code d'activation lisible (sans 0/O, 1/I/L), groupé par quatre. */
export function formaterCode(brut: string) {
  return brut.replace(/(.{4})(?=.)/g, "$1-");
}

export function normaliserCode(saisie: string) {
  return saisie.replace(/[\s-]/g, "").toUpperCase();
}
