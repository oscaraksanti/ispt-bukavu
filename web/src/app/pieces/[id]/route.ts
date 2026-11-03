import { utilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { stockage } from "@/lib/stockage";

/**
 * Pièce justificative d'un candidat. Accessible uniquement au candidat
 * lui-même et au personnel habilité à consulter les admissions.
 */
export async function GET(_requete: Request, { params }: RouteContext<"/pieces/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;
  const depot = await db.pieceDeposee.findUnique({
    where: { id },
    include: { media: true, candidature: { select: { candidatId: true } } },
  });
  const autorise =
    !!depot && (depot.candidature.candidatId === u.id || u.permissions.has("admissions.consulter"));
  if (!depot || !autorise) return new Response("Introuvable", { status: 404 });

  const fichier = await stockage().lire(depot.media.cle);
  if (!fichier) return new Response("Introuvable", { status: 404 });
  const nom = encodeURIComponent(depot.media.nomFichier);
  return new Response(new Uint8Array(fichier.contenu), {
    headers: {
      "Content-Type": depot.media.typeMime,
      "Content-Disposition": `inline; filename*=UTF-8''${nom}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
