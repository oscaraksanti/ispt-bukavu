import type { Metadata } from "next";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import {
  emettreDemande,
  emettreDirectement,
  refuserDemande,
  revoquerDocument,
} from "@/features/documents/actions";
import { LIBELLES_DOCUMENT } from "@/features/documents/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Documents officiels" };

export default async function Documents() {
  await exigerPermission("documents.emettre");
  const [demandes, documents] = await Promise.all([
    db.demandeDocument.findMany({
      where: { statut: "EN_ATTENTE" },
      include: { etudiant: { include: { utilisateur: true } } },
      orderBy: { creeLe: "asc" },
    }),
    db.documentOfficiel.findMany({
      include: { etudiant: { include: { utilisateur: true } } },
      orderBy: { emisLe: "desc" },
      take: 100,
    }),
  ]);
  const nom = (u: { nom: string; postnom: string | null; prenom: string | null }) =>
    [u.nom, u.postnom, u.prenom].filter(Boolean).join(" ");

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Documents" }]}
        titre="Documents officiels"
        description="Attestations et relevés générés à partir des données de la plateforme, avec code et QR code vérifiables publiquement. Le contenu est figé à l'émission."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panneau titre={`Demandes en attente (${demandes.length})`} className="lg:col-span-3">
          {demandes.length === 0 ? (
            <p className="text-sm text-pierre-600">Aucune demande en attente.</p>
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200 text-sm">
              {demandes.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-pierre-900">
                      {LIBELLES_DOCUMENT[d.type]} · {nom(d.etudiant.utilisateur)}
                    </p>
                    <p className="text-xs text-pierre-500">
                      {d.etudiant.matricule} · {formatJour.format(d.creeLe)}
                      {d.motif && ` · ${d.motif}`}
                    </p>
                  </div>
                  <BoutonAction
                    action={refuserDemande.bind(null, d.id)}
                    variante="fantome"
                    confirmation="Refuser ?"
                  >
                    Refuser
                  </BoutonAction>
                  <BoutonAction action={emettreDemande.bind(null, d.id)} variante="institutionnel">
                    Émettre
                  </BoutonAction>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
        <Panneau titre="Émettre directement" className="lg:col-span-2">
          <FormulaireAction action={emettreDirectement} libelleEnvoi="Émettre" viderApresSucces>
            <Champ id="matricule" libelle="Matricule">
              <Saisie id="matricule" name="matricule" autoCapitalize="characters" required />
            </Champ>
            <Champ id="type" libelle="Document">
              <Liste id="type" name="type" defaultValue="ATTESTATION_FREQUENTATION">
                {Object.entries(LIBELLES_DOCUMENT).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Liste>
            </Champ>
          </FormulaireAction>
        </Panneau>
      </div>
      <section className="mt-10">
        <h2 className="text-2xl">Documents émis</h2>
        <ul className="mt-4 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white text-sm">
          {documents.length === 0 && (
            <li className="px-5 py-4 text-pierre-600">Aucun document émis.</li>
          )}
          {documents.map((d) => (
            <li key={d.id} className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`/documents/${d.id}`}
                  target="_blank"
                  rel="noopener"
                  className="flex-1 text-ispt-600 underline hover:no-underline"
                >
                  {LIBELLES_DOCUMENT[d.type]} · {nom(d.etudiant.utilisateur)}
                </a>
                <span className="font-mono text-xs text-pierre-500">{d.code}</span>
                <span className="text-xs text-pierre-500">{formatJour.format(d.emisLe)}</span>
                {d.revoqueLe && <Etiquette ton="erreur">Révoqué</Etiquette>}
              </div>
              {!d.revoqueLe && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-erreur">Révoquer</summary>
                  <div className="mt-2 max-w-md">
                    <FormulaireAction
                      action={revoquerDocument.bind(null, d.id)}
                      libelleEnvoi="Confirmer la révocation"
                    >
                      <Champ id={`motif-${d.id}`} libelle="Motif">
                        <Saisie
                          id={`motif-${d.id}`}
                          name="motif"
                          maxLength={200}
                          placeholder="Erreur sur le document, remplacé par…"
                        />
                      </Champ>
                    </FormulaireAction>
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
