import { utilisateurConnecte } from "@/features/auth/acces";
import { accesConversation, profilsMessagerie } from "@/features/messagerie/acces";
import { db } from "@/lib/db";
import { servirFichier } from "@/lib/servir-fichier";

/** Pièce jointe d'un message : réservée aux membres de la conversation. */
export async function GET(_r: Request, { params }: RouteContext<"/messages/pieces/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;
  const m = await db.message.findUnique({ where: { id }, include: { media: true } });
  if (!m?.media || m.supprimeLe || m.masqueLe) return new Response("Introuvable", { status: 404 });
  const profil = (await profilsMessagerie([u.id])).get(u.id);
  if (!profil || !(await accesConversation(profil, m.conversationId)))
    return new Response("Introuvable", { status: 404 });
  return servirFichier(m.media);
}
