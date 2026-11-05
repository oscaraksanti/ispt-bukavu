import { utilisateurConnecte } from "@/features/auth/acces";
import { rolesAttribuablesPar } from "@/features/comptes/catalogue";
import { compteModifiable } from "@/features/comptes/regles";
import { donneesPersonnelles } from "@/features/exports/donnees-personnelles";
import { db } from "@/lib/db";
import { journaliser } from "@/lib/journal";

/**
 * Réponse à une demande d'accès transmise à l'institut : export des données
 * d'un compte par un gestionnaire des comptes. Tracé dans le journal.
 */
export async function GET(
  _r: Request,
  { params }: RouteContext<"/admin/utilisateurs/[id]/donnees">,
) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  if (!u.permissions.has("utilisateurs.gerer"))
    return new Response("Accès refusé", { status: 403 });
  const { id } = await params;
  const cible = await db.utilisateur.findUnique({
    where: { id },
    select: { roles: { select: { role: { select: { code: true } } } } },
  });
  if (!cible) return new Response("Compte introuvable", { status: 404 });
  // Mêmes limites que pour modifier le compte : pas d'accès aux comptes plus puissants.
  if (
    id !== u.id &&
    !compteModifiable(
      u,
      { id, roles: cible.roles.map((r) => r.role.code) },
      await rolesAttribuablesPar(u),
    )
  )
    return new Response("Accès refusé", { status: 403 });
  const donnees = await donneesPersonnelles(id);
  if (!donnees) return new Response("Compte introuvable", { status: 404 });
  await journaliser({
    auteurId: u.id,
    action: "donnees_personnelles_exportees",
    entite: "Utilisateur",
    entiteId: id,
  });
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="donnees-personnelles-${id}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
