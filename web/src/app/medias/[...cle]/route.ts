import { stockage } from "@/lib/stockage";

/**
 * Sert les fichiers publics de la médiathèque depuis le stockage.
 * Les clés sont uniques (jamais réécrites) : mise en cache longue.
 */
export async function GET(_requete: Request, { params }: RouteContext<"/medias/[...cle]">) {
  const { cle } = await params;
  const chemin = cle.join("/");
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(chemin) || chemin.includes("..")) {
    return new Response("Introuvable", { status: 404 });
  }
  const fichier = await stockage().lire(`medias/${chemin}`);
  if (!fichier) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(fichier.contenu), {
    headers: {
      "Content-Type": fichier.typeMime,
      "Content-Length": String(fichier.contenu.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
