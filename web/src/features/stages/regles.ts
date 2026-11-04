export const TYPES_STAGE = {
  PEDAGOGIQUE: "Stage pédagogique",
  PROFESSIONNEL: "Stage professionnel",
} as const;
export const STATUTS_STAGE = { PREVU: "Prévu", EN_COURS: "En cours", TERMINE: "Terminé" } as const;

/** Correspondance entre les catégories de partenaires et les types de stage. */
export function typeDepuisCategorie(categorie: string) {
  if (categorie === "STAGE_PEDAGOGIQUE") return "PEDAGOGIQUE" as const;
  if (categorie === "STAGE_PROFESSIONNEL") return "PROFESSIONNEL" as const;
  return null;
}

/** Le statut d'un stage d'après ses dates (sauf s'il a été clôturé). */
export function statutSelonDates(debut: Date | null, fin: Date | null, maintenant = new Date()) {
  if (debut && maintenant < debut) return "PREVU" as const;
  if (fin && maintenant > fin) return "TERMINE" as const;
  if (debut) return "EN_COURS" as const;
  return "PREVU" as const;
}
