import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import type { AncienPublic } from "./regles";

/** Fiches publiées de l'annuaire (sans adresse email, jamais affichée). */
export async function lireAnnuaire(): Promise<AncienPublic[]> {
  "use cache";
  cacheTag(ETIQUETTES.anciens, ETIQUETTES.filieres);
  try {
    const anciens = await db.ancien.findMany({
      where: { statut: "PUBLIE" },
      include: { filiere: { select: { nomCourt: true, slug: true } } },
      orderBy: [{ anneeSortie: "desc" }, { nom: "asc" }],
    });
    cacheLife("max");
    return anciens.map((a) => ({
      id: a.id,
      nom: [a.prenom, a.nom, a.postnom].filter(Boolean).join(" "),
      filiere: a.filiere?.nomCourt ?? null,
      filiereSlug: a.filiere?.slug ?? null,
      anneeSortie: a.anneeSortie,
      poste: a.poste,
      employeur: a.employeur,
      ville: a.ville,
      parcours: a.parcours,
      lien: a.lienProfessionnel,
    }));
  } catch (erreur) {
    console.error("[anciens] base indisponible", erreur instanceof Error ? erreur.message : erreur);
    cacheLife("minutes");
    return [];
  }
}

/** Filières proposées dans les formulaires publics (identifiants de la base). */
export async function lireFilieresAvecId(): Promise<{ id: string; nom: string }[]> {
  "use cache";
  cacheTag(ETIQUETTES.filieres);
  try {
    const f = await db.filiere.findMany({
      orderBy: { ordre: "asc" },
      select: { id: true, nom: true },
    });
    cacheLife("max");
    return f;
  } catch {
    cacheLife("minutes");
    return [];
  }
}
