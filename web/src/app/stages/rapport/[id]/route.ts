import { utilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { stockage } from "@/lib/stockage";

/** Rapport de stage : l'étudiant, son encadreur et le responsable des stages. */
export async function GET(_r: Request, { params }: RouteContext<"/stages/rapport/[id]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { id } = await params;
  const s = await db.stage.findUnique({
    where: { id },
    include: { rapport: true, etudiant: true },
  });
  if (!s?.rapport) return new Response("Introuvable", { status: 404 });
  const autorise =
    s.etudiant.utilisateurId === u.id ||
    s.encadreurId === u.id ||
    u.permissions.has("stages.gerer");
  if (!autorise) return new Response("Introuvable", { status: 404 });
  const f = await stockage().lire(s.rapport.cle);
  if (!f) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(f.contenu), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(s.rapport.nomFichier)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
