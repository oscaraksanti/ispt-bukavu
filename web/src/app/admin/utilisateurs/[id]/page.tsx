import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Case } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import {
  changerStatutCompte,
  modifierRolesCompte,
  renvoyerInvitation,
} from "@/features/comptes/actions";
import { rolesAttribuablesPar } from "@/features/comptes/catalogue";
import { compteModifiable, LIBELLES_STATUT } from "@/features/comptes/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Compte" };

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Africa/Lubumbashi",
});

export default async function Compte({ params }: PageProps<"/admin/utilisateurs/[id]">) {
  const auteur = await exigerPermission("utilisateurs.gerer");
  const { id } = await params;
  const attribuables = await rolesAttribuablesPar(auteur);
  const [c, roles] = await Promise.all([
    db.utilisateur.findUnique({ where: { id }, include: { roles: { include: { role: true } } } }),
    db.role.findMany({ where: { code: { in: attribuables } }, orderBy: { libelle: "asc" } }),
  ]);
  if (!c) notFound();
  const actuels = new Set(c.roles.map((r) => r.role.code));
  const nomComplet = [c.prenom, c.nom, c.postnom].filter(Boolean).join(" ");
  const protege = !compteModifiable(auteur, { id: c.id, roles: [...actuels] });

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Comptes", href: "/admin/utilisateurs" },
          { libelle: nomComplet },
        ]}
        titre={nomComplet}
        description={c.email}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panneau titre="Situation" className="lg:col-span-1">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">Statut</dt>
              <dd className="mt-1">
                <Etiquette
                  ton={
                    c.statut === "ACTIF" ? "succes" : c.statut === "INVITE" ? "attention" : "erreur"
                  }
                >
                  {LIBELLES_STATUT[c.statut]}
                </Etiquette>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">Créé le</dt>
              <dd className="mt-1 text-pierre-800">{formatDate.format(c.creeLe)}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">
                Dernière connexion
              </dt>
              <dd className="mt-1 text-pierre-800">
                {c.derniereConnexion ? formatDate.format(c.derniereConnexion) : "Jamais"}
              </dd>
            </div>
          </dl>
          {c.id !== auteur.id && !protege && (
            <div className="mt-6 flex flex-col items-start gap-3 border-t border-pierre-200 pt-5">
              {c.statut === "INVITE" && !c.motDePasseHash && (
                <BoutonAction action={renvoyerInvitation.bind(null, c.id)}>
                  Renvoyer l&apos;invitation
                </BoutonAction>
              )}
              {c.statut === "SUSPENDU" ? (
                <BoutonAction action={changerStatutCompte.bind(null, c.id, "ACTIF")}>
                  Réactiver le compte
                </BoutonAction>
              ) : (
                <BoutonAction
                  action={changerStatutCompte.bind(null, c.id, "SUSPENDU")}
                  confirmation="Suspendre et déconnecter ?"
                  variante="fantome"
                  className="text-erreur hover:bg-erreur-fond"
                >
                  Suspendre le compte
                </BoutonAction>
              )}
            </div>
          )}
        </Panneau>

        <Panneau
          titre="Rôles"
          description="Les permissions de chaque rôle se règlent dans « Rôles et permissions »."
          className="lg:col-span-2"
        >
          {protege ? (
            <p className="text-sm text-pierre-600">
              {c.id === auteur.id
                ? "Vos propres rôles ne peuvent être changés que par un autre gestionnaire."
                : "Seul un administrateur technique peut modifier ce compte."}
            </p>
          ) : (
            <FormulaireAction
              action={modifierRolesCompte.bind(null, c.id)}
              libelleEnvoi="Enregistrer les rôles"
            >
              <fieldset>
                <legend className="sr-only">Rôles attribués</legend>
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {roles.map((r) => (
                    <label key={r.id} className="flex items-start gap-2.5 text-sm">
                      <Case
                        name="roles"
                        value={r.code}
                        defaultChecked={actuels.has(r.code)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-pierre-900">{r.libelle}</span>
                        {r.description && (
                          <span className="block text-xs text-pierre-500">{r.description}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </FormulaireAction>
          )}
        </Panneau>
      </div>
    </>
  );
}
