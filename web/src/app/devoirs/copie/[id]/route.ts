import { utilisateurConnecte } from "@/features/auth/acces";
import { peutGererCours } from "@/features/notes/acces";
import { db } from "@/lib/db";
import { servirFichier } from "@/lib/servir-fichier";

/** Copie d'un étudiant : son auteur, ou les enseignants du cours. */
export async function GET(_r: Request, { params }: RouteContext<"/devoirs/copie/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;
  const r = await db.remise.findUnique({
    where: { id },
    include: { fichier: true, devoir: true, etudiant: { select: { utilisateurId: true } } },
  });
  if (!r) return new Response("Introuvable", { status: 404 });
  if (r.etudiant.utilisateurId !== u.id && !(await peutGererCours(u, r.devoir.coursOffertId)))
    return new Response("Introuvable", { status: 404 });
  return servirFichier(r.fichier);
}
