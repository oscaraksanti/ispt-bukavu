import { utilisateurConnecte } from "@/features/auth/acces";
import { lecteurDe } from "@/features/campus/requetes";
import { peutVoir } from "@/features/campus/regles";
import { profilsMessagerie } from "@/features/messagerie/acces";
import { db } from "@/lib/db";
import { servirFichier } from "@/lib/servir-fichier";

/** Photo d'une publication du Campus : visible de ceux qui voient la publication. */
export async function GET(_r: Request, { params }: RouteContext<"/campus/photos/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;
  const lien = await db.publicationMedia.findFirst({
    where: { mediaId: id },
    include: { media: true, publication: true },
  });
  const profil = (await profilsMessagerie([u.id])).get(u.id);
  if (!lien || !profil) return new Response("Introuvable", { status: 404 });
  const p = lien.publication;
  const ok = peutVoir(
    {
      auteurId: p.auteurId,
      audience: p.audience,
      filiereId: p.filiereId,
      promotionId: p.promotionId,
      statut: p.statut,
      supprime: !!p.supprimeLe,
      masque: !!p.masqueLe,
    },
    lecteurDe(profil, u.permissions),
  );
  if (!ok) return new Response("Introuvable", { status: 404 });
  return servirFichier(lien.media);
}
