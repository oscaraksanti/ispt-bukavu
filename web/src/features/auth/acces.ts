import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { type CodePermission, ROLES_PERSONNEL } from "@/lib/permissions";
import { lireSession } from "./session";

export type UtilisateurConnecte = {
  id: string;
  email: string;
  nom: string;
  prenom: string | null;
  nomComplet: string;
  roles: string[];
  permissions: Set<string>;
  estPersonnel: boolean;
  doitChangerMotDePasse: boolean;
};

/**
 * Couche d'accès aux données d'identité : un seul endroit lit la session et
 * calcule les permissions. Mémorisé pour la durée d'une requête.
 */
export const utilisateurConnecte = cache(async (): Promise<UtilisateurConnecte | null> => {
  const session = await lireSession();
  if (!session) return null;
  const u = await db.utilisateur.findUnique({
    where: { id: session.utilisateurId },
    include: { roles: { include: { role: { include: { permissions: true } } } } },
  });
  if (!u || u.statut !== "ACTIF") return null;
  const roles = u.roles.map((r) => r.role.code);
  const permissions = new Set(
    u.roles.flatMap((r) => r.role.permissions.map((p) => p.permissionCode)),
  );
  return {
    id: u.id,
    email: u.email,
    nom: u.nom,
    prenom: u.prenom,
    nomComplet: [u.prenom, u.nom, u.postnom].filter(Boolean).join(" "),
    roles,
    permissions,
    estPersonnel: roles.some((r) => ROLES_PERSONNEL.includes(r)),
    doitChangerMotDePasse: u.doitChangerMotDePasse,
  };
});

/** Exige une session ; redirige vers la connexion sinon. */
export async function exigerConnexion(suite = "/admin") {
  const u = await utilisateurConnecte();
  if (!u) redirect(`/connexion?suite=${encodeURIComponent(suite)}`);
  return u;
}

/** Exige un compte du personnel (accès à l'administration). */
export async function exigerPersonnel() {
  const u = await exigerConnexion();
  if (!u.estPersonnel) redirect("/acces-refuse");
  return u;
}

/** Exige une permission précise. À appeler dans chaque page et action protégée. */
export async function exigerPermission(permission: CodePermission) {
  const u = await exigerPersonnel();
  if (!u.permissions.has(permission)) redirect("/acces-refuse");
  return u;
}

export function aPermission(u: UtilisateurConnecte | null, permission: CodePermission) {
  return !!u && u.permissions.has(permission);
}
