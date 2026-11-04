/**
 * Notes réelles d'une délibération de l'institut (BAC 1 Électromécanique,
 * 2023-2024), ANONYMISÉES : ni nom ni matricule, ordre des étudiants mélangé.
 * Sert à vérifier que le moteur redonne les décisions prises par le jury.
 */
export const CREDITS = [3, 3, 3, 2, 3, 2, 3, 2, 2, 2, 5, 4, 4, 3, 6, 3, 6, 4];
export const SEMESTRES = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2];
export const NOTES: (number | null)[][] = [
  [10, 10, 11.5, 15, 10.5, 12, 11, 11, 17, 12.5, 11, 11, 14.5, 17, 12, 16, 10, 12.5],
  [11.5, 12, 14, 14, 12, 14, 16, 12, 12.5, 14, 12, 11.5, 11, 18, 11.5, 12, 11.5, 12],
  [10, 15, 12.5, 8, 11, 15, 7.5, 12, 10.5, 12, 10, 10, 12.5, 10, 10, 13.5, 10.5, 10],
  [7.5, 5, 15.5, 11, 8, 12.5, 10.5, null, 6.5, 10, 10, null, null, null, null, null, null, null],
  [8, 10, 10, 8, 11, 10, 12.5, 10, 10, 10.5, 12, 11.5, 12.5, 14, 10, 10, 8, 10],
  [6.5, 4, 8, 10.5, 12, null, 8.5, null, 8.5, 5, 8, 6, 14, 7, 8, 11, 6, 6],
  [10, 15, 14, 14, 13, 11, 11, 13, 10, 11.5, 11, 10, 12.5, 18, 10, 13.5, 10, 12.5],
  [14.5, 12, 11.5, 12.5, 11.5, 12, 10, 14, 10, 10, 11.5, 11, 12.5, 19, 11, 13, 11.5, 11],
  [6, 4, 7, 6, null, 10, 9, null, 8, 10, 8, null, null, null, null, null, null, null],
  [8, 10, 12, 12, 12, 10, 10.5, 12, 11, 10, 10, 9, 10, 10, 10, 10.5, 8, 10],
  [14, 13, 16, 12.5, 11.5, 12.5, 13.5, 13, 17, 15.5, 16.5, 11.5, 16.5, 13, 10, 17.5, 10, 17],
  [15, 12, 16, 12.5, 10, 11, 17, 14, 14, 13.5, 14, 14.5, 12.5, 10, 11, 14, 13.5, 12],
  [7, 7, 10.5, 10, 11.5, 10, 11, 13, 10, 8, 10, 10, 14, 8, 11, 10, 8, 11.5],
  [8, null, 4.5, null, null, null, 14, 11, 7.5, 6, 9, 7.5, null, 11, null, 6, null, null],
  [12, 8, 11.5, 13, 10, 6, 10.5, 11, 14.5, 14.5, 11, null, null, null, null, null, null, null],
  [10, 12, 14, 11.5, 13, 12, 10, 12, 11.5, 13, 12.5, 14.5, 14, 11, 10.5, 12, 12, 10.5],
];
export const DECISIONS_DU_JURY = [
  "ADM",
  "ADM",
  "COMP",
  "RATTRAPAGE",
  "COMP",
  "RATTRAPAGE",
  "ADM",
  "ADM",
  "RATTRAPAGE",
  "COMP",
  "ADM",
  "ADM",
  "COMP",
  "RATTRAPAGE",
  "RATTRAPAGE",
  "ADM",
];
/** Étudiant dont le bulletin d'origine affiche 12 au S1, 12 au S2 et 12 pour l'année. */
export const EXEMPLE_BULLETIN = 7;
