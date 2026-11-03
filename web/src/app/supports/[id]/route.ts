import { utilisateurConnecte } from "@/features/auth/acces";
import { peutGererCours } from "@/features/notes/acces";
import { db } from "@/lib/db";
import { stockage } from "@/lib/stockage";

/** Support de cours : étudiants de la promotion, enseignants du cours et secrétariat académique. */
export async function GET(_r: Request, { params }: RouteContext<"/supports/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;
  const s = await db.support.findUnique({
    where: { id },
    include: { media: true, coursOffert: true },
  });
  if (!s?.media) return new Response("Introuvable", { status: 404 });
  const inscrit = await db.inscription.findFirst({
    where: {
      promotionId: s.coursOffert.promotionId,
      statut: { notIn: ["ABANDON", "SUSPENDUE"] },
      etudiant: { utilisateurId: u.id },
    },
  });
  if (!inscrit && !(await peutGererCours(u, s.coursOffertId)))
    return new Response("Introuvable", { status: 404 });
  const fichier = await stockage().lire(s.media.cle);
  if (!fichier) return new Response("Introuvable", { status: 404 });
  const enLigne = s.media.typeMime === "application/pdf" || s.media.typeMime.startsWith("image/");
  return new Response(new Uint8Array(fichier.contenu), {
    headers: {
      "Content-Type": s.media.typeMime,
      "Content-Disposition": `${enLigne ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(s.media.nomFichier)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
