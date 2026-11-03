/** Règles pures de la valve numérique (testées unitairement). */

export type Cible = "PUBLIC" | "INSTITUT" | "FILIERE" | "PROMOTION" | "COURS";

export const LIBELLES_CIBLE: Record<Cible, string> = {
  PUBLIC: "Public (site de l'institut)",
  INSTITUT: "Tout l'institut",
  FILIERE: "Une filière",
  PROMOTION: "Une promotion",
  COURS: "Les étudiants d'un cours",
};

export type Auteur = {
  permissions: Set<string>;
  /** Cours offerts dont l'auteur est enseignant. */
  coursOfferts: string[];
};

/** Cibles qu'un auteur peut viser. */
export function ciblesAutorisees(a: Auteur): Cible[] {
  const cibles: Cible[] = [];
  if (a.permissions.has("valve.publier.institut")) cibles.push("PUBLIC", "INSTITUT");
  if (a.permissions.has("valve.publier")) cibles.push("FILIERE", "PROMOTION");
  if (a.permissions.has("valve.publier") || a.coursOfferts.length > 0) cibles.push("COURS");
  return cibles;
}

/** Un auteur peut-il viser ce cours précis ? */
export function peutViserCours(a: Auteur, coursOffertId: string) {
  return a.permissions.has("valve.publier") || a.coursOfferts.includes(coursOffertId);
}

/**
 * Les communiqués à l'échelle de l'institut ou du public passent par une
 * validation, sauf si l'auteur est lui-même validateur.
 */
export function exigeValidation(cible: Cible, a: Auteur) {
  return (cible === "PUBLIC" || cible === "INSTITUT") && !a.permissions.has("valve.valider");
}

export type Contexte = { filieres: string[]; promotions: string[]; coursOfferts: string[] };

/** Un communiqué concerne-t-il un étudiant (selon ses inscriptions en cours) ? */
export function concerne(
  c: {
    cible: Cible;
    filiereId: string | null;
    promotionId: string | null;
    coursOffertId: string | null;
  },
  ctx: Contexte,
) {
  switch (c.cible) {
    case "PUBLIC":
    case "INSTITUT":
      return true;
    case "FILIERE":
      return !!c.filiereId && ctx.filieres.includes(c.filiereId);
    case "PROMOTION":
      return !!c.promotionId && ctx.promotions.includes(c.promotionId);
    case "COURS":
      return !!c.coursOffertId && ctx.coursOfferts.includes(c.coursOffertId);
  }
}

export function estEnLigne(
  c: { statut: string; publieLe: Date | null; expireLe: Date | null },
  maintenant = new Date(),
) {
  return (
    c.statut === "PUBLIE" &&
    !!c.publieLe &&
    c.publieLe <= maintenant &&
    (!c.expireLe || c.expireLe > maintenant)
  );
}

/** Taux de lecture arrondi, en pourcentage. */
export function tauxLecture(lus: number, destinataires: number) {
  if (destinataires <= 0) return 0;
  return Math.min(100, Math.round((lus / destinataires) * 100));
}

/** Étiquette de cache de la valve publique. */
export const ETIQUETTE_VALVE = "valve";
