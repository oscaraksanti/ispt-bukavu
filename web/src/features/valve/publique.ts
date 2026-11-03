import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { extrait, type CommuniqueResume } from "@/components/valve/liste-communiques";
import type { CommuniqueAffiche } from "@/components/valve/communique";
import { db } from "@/lib/db";
import { filtreEnLigne, INCLURE_CIBLE, libelleDestinataires } from "./donnees";
import { ETIQUETTE_VALVE } from "./regles";
import { INCLURE_AFFICHAGE, versAffiche } from "./requetes";

/** Communiqués adressés au public, affichés sur le site. */
export async function lireValvePublique(): Promise<CommuniqueResume[]> {
  "use cache";
  cacheTag(ETIQUETTE_VALVE);
  cacheLife("minutes");
  try {
    const lignes = await db.communique.findMany({
      where: filtreEnLigne(null),
      include: { ...INCLURE_CIBLE, _count: { select: { piecesJointes: true } } },
      orderBy: [{ epingle: "desc" }, { publieLe: "desc" }],
      take: 50,
    });
    return lignes.map((c) => ({
      id: c.id,
      titre: c.titre,
      extrait: extrait(c.contenu),
      publieLe: c.publieLe,
      destinataires: libelleDestinataires(c),
      epingle: c.epingle,
      pieces: c._count.piecesJointes,
    }));
  } catch (e) {
    console.error("[valve] base indisponible", e instanceof Error ? e.message : e);
    return [];
  }
}

export async function lireCommuniquePublic(id: string): Promise<CommuniqueAffiche | null> {
  "use cache";
  cacheTag(ETIQUETTE_VALVE);
  cacheLife("minutes");
  try {
    const c = await db.communique.findFirst({
      where: { id, ...filtreEnLigne(null) },
      include: INCLURE_AFFICHAGE,
    });
    return c ? versAffiche(c) : null;
  } catch {
    return null;
  }
}
