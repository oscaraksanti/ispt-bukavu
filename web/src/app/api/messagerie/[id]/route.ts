import { utilisateurConnecte } from "@/features/auth/acces";
import { accesConversation, profilsMessagerie } from "@/features/messagerie/acces";
import { lecturesDe, messagesDe } from "@/features/messagerie/requetes";

const date = (v: string | null) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

/**
 * Actualisation d'une conversation ouverte (appelée toutes les quelques
 * secondes) : nouveaux messages après `apres`, accusés de lecture de mes
 * messages envoyés depuis `depuis`.
 */
export async function GET(requete: Request, { params }: RouteContext<"/api/messagerie/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return Response.json({ erreur: "Connexion requise" }, { status: 401 });
  const profil = (await profilsMessagerie([u.id])).get(u.id);
  const { id } = await params;
  const acces = profil ? await accesConversation(profil, id) : null;
  if (!acces) return Response.json({ erreur: "Introuvable" }, { status: 404 });
  const recherche = new URL(requete.url).searchParams;
  const apres = date(recherche.get("apres"));
  const depuis = date(recherche.get("depuis"));
  const [messages, lectures] = await Promise.all([
    apres ? messagesDe(id, u.id, acces.conversation.type, apres) : [],
    depuis ? lecturesDe(id, u.id, depuis) : {},
  ]);
  return Response.json(
    { messages, lectures, annoncesSeulement: acces.conversation.annoncesSeulement },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
