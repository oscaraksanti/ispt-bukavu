import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/features/auth/acces";

/**
 * Lien des notifications de messagerie : conduit chacun à la conversation
 * dans son propre espace (étudiant, enseignant ou administration).
 */
export async function GET(_r: Request, { params }: RouteContext<"/messages/aller/[id]">) {
  const { id } = await params;
  const u = await utilisateurConnecte();
  if (!u) redirect(`/connexion?suite=/messages/aller/${encodeURIComponent(id)}`);
  const base = u.roles.includes("etudiant")
    ? "/etudiant/messages"
    : u.roles.includes("enseignant") && !u.estPersonnel
      ? "/enseignant/messages"
      : u.estPersonnel
        ? "/admin/messagerie"
        : "/";
  redirect(base === "/" ? "/" : `${base}/${encodeURIComponent(id)}`);
}
