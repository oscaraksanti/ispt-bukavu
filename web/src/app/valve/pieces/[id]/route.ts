import { utilisateurConnecte } from "@/features/auth/acces";
import { contexteEtudiant } from "@/features/valve/donnees";
import { concerne, estEnLigne } from "@/features/valve/regles";
import { db } from "@/lib/db";
import { stockage } from "@/lib/stockage";

/**
 * Pièce jointe d'un communiqué. Publique si le communiqué l'est ; sinon
 * réservée à ses destinataires, à son auteur et aux gestionnaires de la valve.
 */
export async function GET(_r: Request, { params }: RouteContext<"/valve/pieces/[id]">) {
  const { id } = await params;
  const piece = await db.pieceJointe.findUnique({
    where: { id },
    include: { media: true, communique: true },
  });
  if (!piece) return new Response("Introuvable", { status: 404 });
  const c = piece.communique;
  let autorise = c.cible === "PUBLIC" && estEnLigne(c);
  if (!autorise) {
    const u = await utilisateurConnecte();
    if (!u) return new Response("Connexion requise", { status: 401 });
    autorise =
      c.auteurId === u.id ||
      u.permissions.has("valve.publier") ||
      u.permissions.has("valve.valider") ||
      (estEnLigne(c) && concerne(c, await contexteEtudiant(u.id)));
  }
  if (!autorise) return new Response("Introuvable", { status: 404 });
  const fichier = await stockage().lire(piece.media.cle);
  if (!fichier) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(fichier.contenu), {
    headers: {
      "Content-Type": piece.media.typeMime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(piece.media.nomFichier)}`,
      "Cache-Control": c.cible === "PUBLIC" ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
