import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { type ImageResolue, urlMedia } from "@/features/medias/url";
import { db } from "@/lib/db";

export type AlbumResume = {
  slug: string;
  titre: string;
  description: string | null;
  date: string | null;
  nombre: number;
  couverture: ImageResolue | null;
};

export type AlbumPublic = AlbumResume & { photos: (ImageResolue & { legende: string | null })[] };

const image = (m: {
  id: string;
  cle: string;
  texteAlternatif: string;
  largeur: number | null;
  hauteur: number | null;
}): ImageResolue => ({
  id: m.id,
  url: urlMedia(m.cle),
  alt: m.texteAlternatif,
  largeur: m.largeur,
  hauteur: m.hauteur,
});

/** Albums publiés, du plus récent au plus ancien. */
export async function lireAlbums(): Promise<AlbumResume[]> {
  "use cache";
  cacheTag(ETIQUETTES.galerie, ETIQUETTES.medias);
  try {
    const albums = await db.album.findMany({
      where: { publie: true, medias: { some: {} } },
      orderBy: [{ date: { sort: "desc", nulls: "last" } }, { titre: "asc" }],
      include: {
        medias: { orderBy: { ordre: "asc" }, take: 1, include: { media: true } },
        _count: { select: { medias: true } },
      },
    });
    cacheLife("max");
    return albums.map((a) => ({
      slug: a.slug,
      titre: a.titre,
      description: a.description,
      date: a.date?.toISOString() ?? null,
      nombre: a._count.medias,
      couverture: a.medias[0] ? image(a.medias[0].media) : null,
    }));
  } catch (erreur) {
    console.error("[galerie] base indisponible", erreur instanceof Error ? erreur.message : erreur);
    cacheLife("minutes");
    return [];
  }
}

export async function lireAlbum(slug: string): Promise<AlbumPublic | null> {
  "use cache";
  cacheTag(ETIQUETTES.galerie, ETIQUETTES.medias);
  try {
    const a = await db.album.findUnique({
      where: { slug },
      include: { medias: { orderBy: { ordre: "asc" }, include: { media: true } } },
    });
    cacheLife("max");
    if (!a || !a.publie || a.medias.length === 0) return null;
    return {
      slug: a.slug,
      titre: a.titre,
      description: a.description,
      date: a.date?.toISOString() ?? null,
      nombre: a.medias.length,
      couverture: image(a.medias[0].media),
      photos: a.medias.map((m) => ({ ...image(m.media), legende: m.media.legende })),
    };
  } catch (erreur) {
    console.error("[galerie] base indisponible", erreur instanceof Error ? erreur.message : erreur);
    cacheLife("minutes");
    return null;
  }
}
