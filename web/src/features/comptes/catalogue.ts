import "server-only";
import type { UtilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { rolesAttribuables } from "./regles";

/** Rôles que cet utilisateur peut attribuer, selon les permissions réelles des rôles. */
export async function rolesAttribuablesPar(auteur: UtilisateurConnecte) {
  const roles = await db.role.findMany({ include: { permissions: true } });
  return rolesAttribuables(
    auteur,
    roles.map((r) => ({ code: r.code, permissions: r.permissions.map((p) => p.permissionCode) })),
  );
}
