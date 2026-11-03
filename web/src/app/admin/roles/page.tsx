import type { Metadata } from "next";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Case } from "@/components/ui/champs";
import { exigerPermission } from "@/features/auth/acces";
import { modifierPermissionsRole } from "@/features/comptes/actions";
import { PERMISSIONS, ROLES_PERSONNEL } from "@/lib/permissions";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Rôles et permissions" };

export default async function Roles() {
  await exigerPermission("roles.gerer");
  const roles = await db.role.findMany({
    where: { code: { in: [...ROLES_PERSONNEL, "enseignant"] } },
    include: { permissions: true, _count: { select: { utilisateurs: true } } },
  });
  roles.sort(
    (a, b) =>
      [...ROLES_PERSONNEL, "enseignant"].indexOf(a.code) -
      [...ROLES_PERSONNEL, "enseignant"].indexOf(b.code),
  );
  const domaines = Object.entries(PERMISSIONS).reduce<Record<string, [string, string][]>>(
    (acc, [code, p]) => {
      (acc[p.domaine] ??= []).push([code, p.libelle]);
      return acc;
    },
    {},
  );

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Rôles et permissions" },
        ]}
        titre="Rôles et permissions"
        description="Ce que chaque fonction peut faire dans l'administration. Les changements s'appliquent immédiatement à toutes les personnes ayant le rôle."
      />
      <div className="mt-8 space-y-6">
        {roles.map((role) => {
          const actives = new Set(role.permissions.map((p) => p.permissionCode));
          const verrouille = role.code === "super_admin";
          return (
            <details
              key={role.id}
              className="group rounded-md border border-pierre-200 bg-white open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block font-sans text-base font-semibold text-encre">
                    {role.libelle}
                  </span>
                  <span className="block text-sm text-pierre-600">{role.description}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-pierre-500">
                  {actives.size} permission{actives.size > 1 ? "s" : ""} ·{" "}
                  {role._count.utilisateurs} compte{role._count.utilisateurs > 1 ? "s" : ""}
                </span>
              </summary>
              <div className="border-t border-pierre-200 p-5">
                {verrouille ? (
                  <p className="text-sm text-pierre-600">
                    L&apos;administrateur technique dispose toujours de toutes les permissions.
                  </p>
                ) : (
                  <FormulaireAction
                    action={modifierPermissionsRole.bind(null, role.id)}
                    libelleEnvoi="Enregistrer"
                  >
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(domaines).map(([domaine, permissions]) => (
                        <fieldset key={domaine}>
                          <legend className="font-mono text-xs tracking-wide text-pierre-500 uppercase">
                            {domaine}
                          </legend>
                          <div className="mt-2 space-y-2">
                            {permissions.map(([code, libelle]) => (
                              <label key={code} className="flex items-start gap-2.5 text-sm">
                                <Case
                                  name="permissions"
                                  value={code}
                                  defaultChecked={actives.has(code)}
                                  className="mt-0.5"
                                />
                                <span className="text-pierre-800">{libelle}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                    </div>
                  </FormulaireAction>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
