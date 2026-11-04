import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import { offreOuverte, type TypeOffre } from "./regles";

export type OffrePublique = {
  id: string;
  titre: string;
  type: TypeOffre;
  organisation: string;
  lieu: string | null;
  description: string;
  lienCandidature: string | null;
  emailCandidature: string | null;
  dateLimite: string | null;
  publieeLe: string | null;
  filieres: string[];
};

const versPublique = (o: {
  id: string;
  titre: string;
  type: TypeOffre;
  organisation: string;
  lieu: string | null;
  description: string;
  lienCandidature: string | null;
  emailCandidature: string | null;
  dateLimite: Date | null;
  publieeLe: Date | null;
  filieres: { nomCourt: string }[];
}): OffrePublique => ({
  ...o,
  dateLimite: o.dateLimite?.toISOString() ?? null,
  publieeLe: o.publieeLe?.toISOString() ?? null,
  filieres: o.filieres.map((f) => f.nomCourt),
});

/**
 * Offres publiées encore ouvertes. Le cache est renouvelé toutes les heures
 * pour que les offres échues disparaissent d'elles-mêmes.
 */
export async function lireOffres(): Promise<OffrePublique[]> {
  "use cache";
  cacheTag(ETIQUETTES.offres);
  try {
    const offres = await db.offreInsertion.findMany({
      where: { statut: "PUBLIEE" },
      include: { filieres: { select: { nomCourt: true } } },
      orderBy: { publieeLe: "desc" },
    });
    cacheLife("hours");
    return offres.filter((o) => offreOuverte(o)).map(versPublique);
  } catch (erreur) {
    console.error("[offres] base indisponible", erreur instanceof Error ? erreur.message : erreur);
    cacheLife("minutes");
    return [];
  }
}

export async function lireOffre(id: string): Promise<OffrePublique | null> {
  "use cache";
  cacheTag(ETIQUETTES.offres);
  try {
    const o = await db.offreInsertion.findUnique({
      where: { id },
      include: { filieres: { select: { nomCourt: true } } },
    });
    cacheLife("hours");
    return o && offreOuverte(o) ? versPublique(o) : null;
  } catch {
    cacheLife("minutes");
    return null;
  }
}
