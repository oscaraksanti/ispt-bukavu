/**
 * Adresse publique d'un média.
 * Les photographies officielles livrées avec le site ont une clé « public/… » ;
 * les fichiers téléversés sont servis par la route /medias/….
 */
export function urlMedia(cle: string) {
  if (cle.startsWith("public/")) return `/${cle.slice("public/".length)}`;
  return `/medias/${cle}`;
}

export type ImageResolue = {
  id: string;
  url: string;
  alt: string;
  largeur: number | null;
  hauteur: number | null;
};
