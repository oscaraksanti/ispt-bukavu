import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Case, Champ, Saisie } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import { inviterCompte } from "@/features/comptes/actions";
import { rolesAttribuablesPar } from "@/features/comptes/catalogue";
import { LIBELLES_STATUT } from "@/features/comptes/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Comptes" };

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "Africa/Lubumbashi",
});

const TON_STATUT = { ACTIF: "succes", INVITE: "attention", SUSPENDU: "erreur" } as const;

export default async function Comptes({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const auteur = await exigerPermission("utilisateurs.gerer");
  const { q } = await searchParams;
  const recherche = typeof q === "string" ? q.trim() : "";
  const attribuables = await rolesAttribuablesPar(auteur);

  const [roles, comptes] = await Promise.all([
    db.role.findMany({ where: { code: { in: attribuables } }, orderBy: { libelle: "asc" } }),
    db.utilisateur.findMany({
      where: {
        roles: { some: { role: { code: { in: [...attribuables, "super_admin"] } } } },
        ...(recherche
          ? {
              OR: [
                { email: { contains: recherche, mode: "insensitive" } },
                { nom: { contains: recherche, mode: "insensitive" } },
                { prenom: { contains: recherche, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { roles: { include: { role: true } } },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      take: 200,
    }),
  ]);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Comptes" }]}
        titre="Comptes du personnel"
        description="Chaque personne reçoit un lien personnel pour choisir son mot de passe. Les rôles déterminent ce qu'elle peut faire."
      />

      <Panneau className="mt-8" titre="Inviter une personne">
        <FormulaireAction
          action={inviterCompte}
          libelleEnvoi="Envoyer l'invitation"
          viderApresSucces
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Champ id="prenom" libelle="Prénom" obligatoire>
              <Saisie id="prenom" name="prenom" required maxLength={80} autoComplete="off" />
            </Champ>
            <Champ id="nom" libelle="Nom" obligatoire>
              <Saisie id="nom" name="nom" required maxLength={80} autoComplete="off" />
            </Champ>
            <Champ id="postnom" libelle="Postnom">
              <Saisie id="postnom" name="postnom" maxLength={80} autoComplete="off" />
            </Champ>
            <Champ id="email" libelle="Adresse email" obligatoire>
              <Saisie
                id="email"
                name="email"
                type="email"
                required
                maxLength={160}
                autoComplete="off"
              />
            </Champ>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-pierre-800">Rôles</legend>
            <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => (
                <label key={r.id} className="flex items-start gap-2.5 text-sm">
                  <Case name="roles" value={r.code} className="mt-0.5" />
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
      </Panneau>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-sans text-base font-semibold text-encre">
            {comptes.length} compte{comptes.length > 1 ? "s" : ""}
          </h2>
          <form role="search" className="flex gap-2">
            <label htmlFor="q" className="sr-only">
              Rechercher un compte
            </label>
            <Saisie
              id="q"
              name="q"
              type="search"
              defaultValue={recherche}
              placeholder="Nom ou email"
              className="h-9 w-64"
            />
          </form>
        </div>
        <div
          className="mt-4 overflow-x-auto rounded-md border border-pierre-200 bg-white"
          tabIndex={0}
          role="region"
          aria-label="Liste des comptes"
        >
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-pierre-200 bg-pierre-50 font-mono text-xs tracking-wide text-pierre-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Personne
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Rôles
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Statut
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Dernière connexion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pierre-200">
              {comptes.map((c) => (
                <tr key={c.id} className="hover:bg-pierre-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/utilisateurs/${c.id}`}
                      className="font-medium text-encre hover:text-ispt-600"
                    >
                      {[c.prenom, c.nom, c.postnom].filter(Boolean).join(" ")}
                    </Link>
                    <span className="block text-xs text-pierre-500">{c.email}</span>
                  </td>
                  <td className="px-4 py-3 text-pierre-700">
                    {c.roles.map((r) => r.role.libelle).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <Etiquette ton={TON_STATUT[c.statut]}>{LIBELLES_STATUT[c.statut]}</Etiquette>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-pierre-600">
                    {c.derniereConnexion ? formatDate.format(c.derniereConnexion) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
