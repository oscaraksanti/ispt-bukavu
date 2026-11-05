import { KeyRound, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { BoutonAction } from "@/components/admin/bouton-action";
import { Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Saisie } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/elements";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { changerMotDePasse, deconnecterAutresAppareils } from "@/features/compte/actions";
import { donneesCompte } from "@/features/compte/requetes";

const quand = (d: Date) => `${formatJour.format(d)} à ${formatHeure.format(d)}`;

/**
 * Contenu de « Mon compte », commun aux quatre espaces : identité,
 * changement de mot de passe et appareils connectés.
 */
export async function MonCompte({
  utilisateurId,
  nomComplet,
}: {
  utilisateurId: string;
  nomComplet: string;
}) {
  const c = await donneesCompte(utilisateurId);
  const autres = c.appareils.filter((a) => !a.actuel).length;
  const identite: [string, string][] = [
    ["Nom", nomComplet],
    ...(c.matricule ? [["Matricule", c.matricule] as [string, string]] : []),
    ...(c.email ? [["Adresse email", c.email] as [string, string]] : []),
    ...(c.telephone ? [["Téléphone", c.telephone] as [string, string]] : []),
    ["Rôle", c.roles.join(", ") || "—"],
    ...(c.derniereConnexion
      ? [["Dernière connexion", quand(c.derniereConnexion)] as [string, string]]
      : []),
  ];

  return (
    <div className="space-y-8">
      {c.doitChangerMotDePasse && (
        <Encadre ton="attention" titre="Mot de passe à changer" icone={<KeyRound />}>
          Votre mot de passe vous a été communiqué par l&apos;institut : remplacez-le par un mot de
          passe personnel, que personne d&apos;autre ne connaît.
        </Encadre>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <Panneau titre="Identité" className="lg:col-span-2">
          <dl className="divide-y divide-pierre-100 text-sm">
            {identite.map(([k, v]) => (
              <div key={k} className="py-2.5 first:pt-0 last:pb-0">
                <dt className="text-detail text-pierre-500">{k}</dt>
                <dd className="mt-0.5 [overflow-wrap:anywhere] text-encre">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-detail text-pierre-500">
            Une information inexacte ? Le secrétariat de l&apos;institut peut la corriger.
          </p>
        </Panneau>

        <Panneau
          titre="Changer de mot de passe"
          description="Au moins 10 caractères, avec des lettres et des chiffres."
          className="lg:col-span-3"
        >
          <FormulaireAction
            action={changerMotDePasse}
            libelleEnvoi="Changer le mot de passe"
            viderApresSucces
          >
            <Champ id="actuel" libelle="Mot de passe actuel" obligatoire>
              <Saisie
                id="actuel"
                name="actuel"
                type="password"
                autoComplete="current-password"
                required
              />
            </Champ>
            <div className="grid gap-5 sm:grid-cols-2">
              <Champ id="nouveau" libelle="Nouveau mot de passe" obligatoire>
                <Saisie
                  id="nouveau"
                  name="nouveau"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={128}
                  required
                />
              </Champ>
              <Champ id="confirmation" libelle="Confirmez-le" obligatoire>
                <Saisie
                  id="confirmation"
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={128}
                  required
                />
              </Champ>
            </div>
          </FormulaireAction>
        </Panneau>
      </div>

      <Panneau
        titre="Appareils connectés"
        description="Les téléphones et ordinateurs sur lesquels votre compte est ouvert."
        actions={
          autres > 0 ? (
            <BoutonAction
              action={deconnecterAutresAppareils}
              confirmation="Déconnecter tous les autres appareils ?"
            >
              Déconnecter les autres
            </BoutonAction>
          ) : undefined
        }
      >
        <ul className="divide-y divide-pierre-100">
          {c.appareils.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <MonitorSmartphone aria-hidden className="size-5 shrink-0 text-pierre-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-encre">{a.appareil}</p>
                <p className="text-detail text-pierre-500">Connecté depuis le {quand(a.depuis)}</p>
              </div>
              {a.actuel && (
                <span className="inline-flex items-center gap-1 text-detail font-medium text-succes">
                  <ShieldCheck aria-hidden className="size-4" /> Cet appareil
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-detail text-pierre-500">
          Un appareil que vous ne reconnaissez pas ? Déconnectez les autres appareils, puis changez
          votre mot de passe.
        </p>
      </Panneau>
    </div>
  );
}
