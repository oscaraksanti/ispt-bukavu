import { utilisateurConnecte } from "@/features/auth/acces";
import { etudiantDuCours } from "@/features/devoirs/acces";
import { peutGererCours } from "@/features/notes/acces";
import { db } from "@/lib/db";
import { servirFichier } from "@/lib/servir-fichier";

/** Énoncé d'un devoir : étudiants du cours et enseignants du cours. */
export async function GET(_r: Request, { params }: RouteContext<"/devoirs/enonce/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;
  const d = await db.devoir.findUnique({ where: { id }, include: { enonce: true } });
  if (!d?.enonce) return new Response("Introuvable", { status: 404 });
  if (!(await etudiantDuCours(u, d.coursOffertId)) && !(await peutGererCours(u, d.coursOffertId)))
    return new Response("Introuvable", { status: 404 });
  return servirFichier(d.enonce);
}
