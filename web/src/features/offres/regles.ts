/** Offres de stage, d'emploi, de bourse et de formation : règles pures (testées). */

export const TYPES_OFFRE = {
  STAGE: "Stage",
  EMPLOI: "Emploi",
  BOURSE: "Bourse",
  FORMATION: "Formation",
} as const;

export type TypeOffre = keyof typeof TYPES_OFFRE;

/** Une offre publiée reste visible jusqu'au soir de sa date limite (heure de Bukavu). */
export function offreOuverte(
  o: { statut: string; dateLimite: Date | null },
  maintenant = new Date(),
) {
  if (o.statut !== "PUBLIEE") return false;
  if (!o.dateLimite) return true;
  return o.dateLimite.getTime() + 86_400_000 > maintenant.getTime();
}

/** Jours restants avant la date limite (0 le dernier jour), ou null sans date limite. */
export function joursRestants(dateLimite: Date | null, maintenant = new Date()) {
  if (!dateLimite) return null;
  const jour = (d: Date) => Math.floor((d.getTime() + 2 * 3600_000) / 86_400_000);
  return Math.max(0, jour(dateLimite) - jour(maintenant));
}

/** Il faut au moins un moyen de postuler : un lien https ou une adresse email. */
export function moyenDeCandidatureValide(lien: string, email: string) {
  if (!lien && !email) return "Indiquez un lien ou une adresse pour postuler.";
  if (lien) {
    try {
      const u = new URL(lien);
      if (u.protocol !== "https:") return "Le lien doit commencer par https://";
    } catch {
      return "Lien de candidature invalide.";
    }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Adresse email invalide.";
  return null;
}
