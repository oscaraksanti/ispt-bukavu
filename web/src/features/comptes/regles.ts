import { ROLES_PERSONNEL } from "@/lib/permissions";

/**
 * Rôles qu'un gestionnaire de comptes peut attribuer depuis l'administration.
 * Le rôle d'administrateur technique ne peut être attribué que par un autre
 * administrateur technique ; les rôles étudiant et candidat sont attribués
 * par les inscriptions et les candidatures, pas à la main.
 */
export function rolesAttribuables(rolesAuteur: string[]) {
  const roles = [...ROLES_PERSONNEL, "enseignant"];
  return rolesAuteur.includes("super_admin") ? roles : roles.filter((r) => r !== "super_admin");
}

export const LIBELLES_STATUT: Record<string, string> = {
  INVITE: "Invitation en attente",
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
};
