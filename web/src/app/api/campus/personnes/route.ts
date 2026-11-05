import { utilisateurConnecte } from "@/features/auth/acces";
import { profilsMessagerie } from "@/features/messagerie/acces";
import { aAccesMessagerie } from "@/features/messagerie/regles";
import { contactsPossibles } from "@/features/messagerie/requetes";

/**
 * Suggestions de mentions (« @… ») : mêmes personnes que celles à qui
 * l'utilisateur peut écrire, recherchées par nom ou matricule.
 */
export async function GET(requete: Request) {
  const u = await utilisateurConnecte();
  if (!u) return Response.json([], { status: 401 });
  const profil = (await profilsMessagerie([u.id])).get(u.id);
  if (!profil || !aAccesMessagerie(profil)) return Response.json([], { status: 403 });
  const q = (new URL(requete.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  if (q.length < 2) return Response.json([]);
  const contacts = await contactsPossibles(profil, q);
  return Response.json(
    contacts.slice(0, 8).map((c) => ({ id: c.id, nom: c.nom, detail: c.detail })),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
