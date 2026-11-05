import { ROLES_PERSONNEL } from "@/lib/permissions";

/**
 * Rôles qu'un gestionnaire de comptes peut attribuer depuis l'administration.
 * - Les rôles étudiant et candidat viennent des inscriptions et candidatures.
 * - Le rôle d'administrateur technique n'est attribué que par un autre
 *   administrateur technique.
 * - Hors administrateur technique, on ne peut attribuer qu'un rôle dont on
 *   détient soi-même toutes les permissions : personne ne peut donner (ou se
 *   donner) plus de pouvoir qu'il n'en a.
 */
export function rolesAttribuables(
  auteur: { roles: string[]; permissions: Iterable<string> },
  catalogue?: { code: string; permissions: string[] }[],
) {
  const roles = [...ROLES_PERSONNEL, "enseignant"];
  if (auteur.roles.includes("super_admin")) return roles;
  const detenues = new Set(auteur.permissions);
  return roles.filter((code) => {
    if (code === "super_admin") return false;
    if (!catalogue) return true;
    const role = catalogue.find((r) => r.code === code);
    return !!role && role.permissions.every((p) => detenues.has(p));
  });
}

/**
 * Un gestionnaire peut-il modifier ce compte (rôles, invitation, statut) ?
 * Avec `attribuables` (résultat de `rolesAttribuables`), il faut en outre
 * pouvoir attribuer chacun des rôles du personnel que détient la cible :
 * sinon renvoyer une invitation ou suspendre ce compte reviendrait à agir
 * sur un pouvoir que l'on n'a pas.
 */
export function compteModifiable(
  auteur: { id: string; roles: string[] },
  cible: { id: string; roles: string[] },
  attribuables?: string[],
) {
  if (auteur.roles.includes("super_admin")) return true;
  if (cible.id === auteur.id) return false;
  if (cible.roles.includes("super_admin")) return false;
  if (!attribuables) return true;
  const personnel = new Set<string>([...ROLES_PERSONNEL, "enseignant"]);
  return cible.roles.filter((r) => personnel.has(r)).every((r) => attribuables.includes(r));
}

export const LIBELLES_STATUT: Record<string, string> = {
  INVITE: "Invitation en attente",
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
};
