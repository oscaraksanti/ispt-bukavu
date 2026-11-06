import { utilisateurConnecte } from "@/features/auth/acces";
import { peutVoirPhoto } from "@/features/compte/regles";
import { db } from "@/lib/db";
import { stockage } from "@/lib/stockage";

/**
 * Photo de profil d'un compte, pour les membres connectés de l'institut.
 * L'adresse porte la date de mise à jour (?v=…) : le navigateur peut garder
 * l'image en cache privé sans risque d'afficher une photo périmée.
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lecteur = await utilisateurConnecte();
  if (!peutVoirPhoto(lecteur, id)) return new Response(null, { status: 404 });
  const u = await db.utilisateur.findUnique({ where: { id }, select: { photoCle: true } });
  const fichier = u?.photoCle ? await stockage().lire(u.photoCle) : null;
  if (!fichier) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(fichier.contenu), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
