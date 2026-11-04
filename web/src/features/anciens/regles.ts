/**
 * Annuaire des anciens : règles pures (testées unitairement). L'inscription
 * est volontaire, vérifiée par l'institut avant publication, et retirable à
 * tout moment par un lien personnel.
 */

/** Première année d'ouverture de l'institut (dépliant officiel). */
export const PREMIERE_ANNEE = 2011;

export function anneeSortieValide(annee: number, maintenant = new Date()) {
  return Number.isInteger(annee) && annee >= PREMIERE_ANNEE && annee <= maintenant.getFullYear();
}

/** Lien professionnel : uniquement https, sans identifiants ni espaces. */
export function lienProfessionnelValide(lien: string) {
  if (!lien) return true;
  try {
    const u = new URL(lien);
    return u.protocol === "https:" && !u.username && !u.password && lien.length <= 200;
  } catch {
    return false;
  }
}

export type AncienPublic = {
  id: string;
  nom: string;
  filiere: string | null;
  filiereSlug: string | null;
  anneeSortie: number;
  poste: string | null;
  employeur: string | null;
  ville: string | null;
  parcours: string | null;
  lien: string | null;
};

const simplifier = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Recherche dans l'annuaire : nom, poste, employeur, ville ; filtre par filière. */
export function filtrerAnnuaire(
  anciens: AncienPublic[],
  { q, filiere }: { q?: string; filiere?: string },
) {
  const termes = simplifier(q ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return anciens.filter((a) => {
    if (filiere && a.filiereSlug !== filiere) return false;
    const texte = simplifier(
      [a.nom, a.poste, a.employeur, a.ville, a.filiere].filter(Boolean).join(" "),
    );
    return termes.every((t) => texte.includes(t));
  });
}

/** Répartition par année de sortie, de la plus récente à la plus ancienne. */
export function parPromotionDeSortie(anciens: AncienPublic[]) {
  const annees = new Map<number, AncienPublic[]>();
  for (const a of anciens) annees.set(a.anneeSortie, [...(annees.get(a.anneeSortie) ?? []), a]);
  return [...annees.entries()].sort((a, b) => b[0] - a[0]);
}
