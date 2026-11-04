import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { BoutonAction } from "@/components/admin/bouton-action";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ImportPersonnel } from "@/components/admin/import-personnel";
import { Case, Champ, Liste, Saisie } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import { importerPersonnel, inviterCompte, relancerInvitations } from "@/features/comptes/actions";
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
  const { q, statut: st } = await searchParams;
  const recherche = typeof q === "string" ? q.trim() : "";
  const statut = st === "INVITE" || st === "ACTIF" || st === "SUSPENDU" ? st : null;
  const attribuables = await rolesAttribuablesPar(auteur);

  const [roles, comptes, enAttente] = await Promise.all([
    db.role.findMany({ where: { code: { in: attribuables } }, orderBy: { libelle: "asc" } }),
    db.utilisateur.findMany({
      where: {
        roles: { some: { role: { code: { in: [...attribuables, "super_admin"] } } } },
        ...(statut ? { statut } : {}),
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
    db.utilisateur.count({
      where: {
        statut: "INVITE",
        profilEtudiant: null,
        roles: { some: { role: { code: { in: attribuables } } } },
      },
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

      <Panneau
        className="mt-6"
        titre="Inviter une liste (personnel ou enseignants)"
        description="Pour ouvrir en une fois les comptes de l'appariteur, de la caisse, des secrétariats et des enseignants."
      >
        <ImportPersonnel
          action={importerPersonnel}
          libellesRoles={Object.fromEntries(roles.map((r) => [r.code, r.libelle]))}
        />
      </Panneau>

      {enAttente > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-md border border-attention/40 bg-attention-fond p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-pierre-800">
            {enAttente} personne{enAttente > 1 ? "s n'ont" : " n'a"} pas encore choisi de mot de
            passe.{" "}
            <Link href="/admin/utilisateurs?statut=INVITE" className="underline hover:no-underline">
              Voir la liste
            </Link>
          </p>
          <BoutonAction
            action={relancerInvitations}
            confirmation="Renvoyer toutes les invitations ?"
          >
            Relancer les invitations
          </BoutonAction>
        </div>
      )}

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-sans text-base font-semibold text-encre">
            {comptes.length} compte{comptes.length > 1 ? "s" : ""}
          </h2>
          <form role="search" className="flex flex-wrap gap-2">
            <label htmlFor="statut" className="sr-only">
              Statut du compte
            </label>
            <Liste id="statut" name="statut" defaultValue={statut ?? ""} className="h-9 w-48">
              <option value="">Tous les statuts</option>
              <option value="INVITE">Invitation en attente</option>
              <option value="ACTIF">Actifs</option>
              <option value="SUSPENDU">Suspendus</option>
            </Liste>
            <label htmlFor="q" className="sr-only">
              Rechercher un compte
            </label>
            <Saisie
              id="q"
              name="q"
              type="search"
              defaultValue={recherche}
              placeholder="Nom ou email"
              className="h-9 w-56"
            />
            <button
              type="submit"
              className="h-9 rounded-xs bg-encre px-3 text-sm font-medium text-white hover:bg-ispt-700"
            >
              Filtrer
            </button>
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
