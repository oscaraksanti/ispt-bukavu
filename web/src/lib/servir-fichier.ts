import "server-only";
import { stockage } from "@/lib/stockage";

/** Réponse HTTP d'un fichier privé, jamais mise en cache, sans exécution possible. */
export async function servirFichier(media: { cle: string; typeMime: string; nomFichier: string }) {
  const fichier = await stockage().lire(media.cle);
  if (!fichier) return new Response("Introuvable", { status: 404 });
  const enLigne = media.typeMime === "application/pdf" || media.typeMime.startsWith("image/");
  return new Response(new Uint8Array(fichier.contenu), {
    headers: {
      "Content-Type": media.typeMime,
      "Content-Disposition": `${enLigne ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(media.nomFichier)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
