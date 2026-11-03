import "server-only";
import { db } from "@/lib/db";
import { urlMedia } from "./url";

export type MediaSelecteur = {
  id: string;
  url: string;
  alt: string;
  nom: string;
  dossier: string;
};

/** Images proposées dans le sélecteur de l'administration. */
export async function mediasPourSelecteur(): Promise<MediaSelecteur[]> {
  const medias = await db.media.findMany({
    where: { typeMime: { startsWith: "image/" } },
    orderBy: [{ creeLe: "desc" }, { nomFichier: "asc" }],
  });
  return medias.map((m) => ({
    id: m.id,
    url: urlMedia(m.cle),
    alt: m.texteAlternatif,
    nom: m.nomFichier,
    dossier: m.dossier,
  }));
}

/**
 * Remplace les jetons « photo:fichier » des valeurs par défaut par
 * l'identifiant du média correspondant, pour l'éditeur.
 */
export async function remplacerJetonsPhotos<T>(valeur: T): Promise<T> {
  const fichiers = new Set<string>();
  const parcourir = (v: unknown) => {
    if (typeof v === "string" && v.startsWith("photo:")) fichiers.add(v.slice(6));
    else if (Array.isArray(v)) v.forEach(parcourir);
    else if (v && typeof v === "object") Object.values(v).forEach(parcourir);
  };
  parcourir(valeur);
  if (fichiers.size === 0) return valeur;
  const medias = await db.media.findMany({
    where: { cle: { in: [...fichiers].map((f) => `public/photos/${f}`) } },
    select: { id: true, cle: true },
  });
  const ids = new Map(medias.map((m) => [m.cle.slice("public/photos/".length), m.id]));
  const remplacer = (v: unknown): unknown => {
    if (typeof v === "string" && v.startsWith("photo:")) return ids.get(v.slice(6)) ?? null;
    if (Array.isArray(v)) return v.map(remplacer);
    if (v && typeof v === "object")
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, remplacer(x)]));
    return v;
  };
  return remplacer(valeur) as T;
}
