"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { versSlug } from "@/features/contenu/collections";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { ajouterSansDoublon, deplacer, MAX_PHOTOS_PAR_ALBUM } from "./regles";

const PERMISSION = "medias.gerer" as const;

const schemaAlbum = z.object({
  titre: z.string().trim().min(3, "Indiquez le titre de l'album.").max(120),
  description: z.string().trim().max(600),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Date invalide."),
});

function lireAlbum(fd: FormData) {
  const r = schemaAlbum.safeParse({
    titre: fd.get("titre") ?? "",
    description: fd.get("description") ?? "",
    date: fd.get("date") ?? "",
  });
  if (!r.success) return { erreur: echec(r.error.issues[0]?.message ?? "Valeurs invalides.") };
  return {
    donnees: {
      titre: r.data.titre,
      description: r.data.description || null,
      date: r.data.date ? new Date(`${r.data.date}T12:00:00+02:00`) : null,
    },
  };
}

function publierCache() {
  updateTag(ETIQUETTES.galerie);
  refresh();
}

/** Les albums sont créés non publiés : on y ajoute les photos avant de les montrer. */
export async function creerAlbum(_etat: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const { donnees, erreur } = lireAlbum(fd);
  if (erreur) return erreur;
  const base = versSlug(donnees.titre) || "album";
  let slug = base;
  for (let i = 2; await db.album.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  const album = await db.album.create({ data: { ...donnees, slug, publie: false } });
  await journaliser({
    auteurId: auteur.id,
    action: "album_cree",
    entite: "Album",
    entiteId: album.id,
    apres: { titre: album.titre },
  });
  redirect(`/admin/galerie/${album.id}`);
}

export async function modifierAlbum(
  id: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const { donnees, erreur } = lireAlbum(fd);
  if (erreur) return erreur;
  if (!(await db.album.findUnique({ where: { id } }))) return echec("Cet album n'existe plus.");
  await db.album.update({ where: { id }, data: donnees });
  await journaliser({
    auteurId: auteur.id,
    action: "album_modifie",
    entite: "Album",
    entiteId: id,
  });
  publierCache();
  return succes("Album enregistré.");
}

export async function changerPublicationAlbum(
  id: string,
  publie: boolean,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const album = await db.album.findUnique({
    where: { id },
    include: { _count: { select: { medias: true } } },
  });
  if (!album) return echec("Cet album n'existe plus.");
  if (publie && album._count.medias === 0) return echec("Ajoutez au moins une photo.");
  await db.album.update({ where: { id }, data: { publie: publie === true } });
  await journaliser({
    auteurId: auteur.id,
    action: publie ? "album_publie" : "album_retire",
    entite: "Album",
    entiteId: id,
  });
  publierCache();
  return succes(publie ? "Album publié sur le site." : "Album retiré du site.");
}

export async function supprimerAlbum(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const album = await db.album.findUnique({ where: { id } });
  if (!album) return echec("Cet album n'existe plus.");
  // Les photos restent dans la médiathèque : seul l'album disparaît.
  await db.album.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "album_supprime",
    entite: "Album",
    entiteId: id,
    avant: { titre: album.titre },
  });
  updateTag(ETIQUETTES.galerie);
  redirect("/admin/galerie");
}

async function reordonner(albumId: string, ids: string[]) {
  await db.$transaction(
    ids.map((mediaId, ordre) =>
      db.albumMedia.update({ where: { albumId_mediaId: { albumId, mediaId } }, data: { ordre } }),
    ),
  );
}

export async function ajouterPhotos(
  albumId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const album = await db.album.findUnique({
    where: { id: albumId },
    include: { medias: { orderBy: { ordre: "asc" } } },
  });
  if (!album) return echec("Cet album n'existe plus.");
  const demandes = [...new Set(fd.getAll("medias").map(String))];
  if (demandes.length === 0) return echec("Cochez au moins une photo.");
  // Seules des images publiques de la médiathèque peuvent entrer dans un album.
  const valides = await db.media.findMany({
    where: {
      id: { in: demandes },
      typeMime: { startsWith: "image/" },
      NOT: { cle: { startsWith: "prive/" } },
    },
    select: { id: true },
  });
  const existants = album.medias.map((m) => m.mediaId);
  const ordre = ajouterSansDoublon(
    existants,
    demandes.filter((id) => valides.some((v) => v.id === id)),
  );
  if (ordre.length > MAX_PHOTOS_PAR_ALBUM)
    return echec(`Un album compte au plus ${MAX_PHOTOS_PAR_ALBUM} photos.`);
  const nouveaux = ordre.slice(existants.length);
  await db.albumMedia.createMany({
    data: nouveaux.map((mediaId, i) => ({ albumId, mediaId, ordre: existants.length + i })),
    skipDuplicates: true,
  });
  await journaliser({
    auteurId: auteur.id,
    action: "album_photos_ajoutees",
    entite: "Album",
    entiteId: albumId,
    apres: { nombre: nouveaux.length },
  });
  publierCache();
  return succes(`${nouveaux.length} photo(s) ajoutée(s).`);
}

export async function retirerPhoto(albumId: string, mediaId: string): Promise<EtatFormulaire> {
  await exigerPermission(PERMISSION);
  await db.albumMedia.deleteMany({ where: { albumId, mediaId } });
  const reste = await db.albumMedia.findMany({ where: { albumId }, orderBy: { ordre: "asc" } });
  await reordonner(
    albumId,
    reste.map((m) => m.mediaId),
  );
  if (reste.length === 0)
    await db.album.update({ where: { id: albumId }, data: { publie: false } });
  publierCache();
  return succes("Photo retirée de l'album.");
}

export async function deplacerPhoto(
  albumId: string,
  mediaId: string,
  sens: -1 | 1,
): Promise<EtatFormulaire> {
  await exigerPermission(PERMISSION);
  const liste = await db.albumMedia.findMany({ where: { albumId }, orderBy: { ordre: "asc" } });
  const ids = liste.map((m) => m.mediaId);
  const index = ids.indexOf(mediaId);
  if (index < 0) return echec("Photo introuvable.");
  await reordonner(albumId, deplacer(ids, index, sens === -1 ? -1 : 1));
  publierCache();
  return succes("Ordre enregistré.");
}
