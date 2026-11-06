import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { CodesActivation } from "@/components/admin/codes-activation";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ImportRegistre } from "@/components/admin/import-registre";
import { LienBouton } from "@/components/ui/bouton";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import {
  ajouterEtudiant,
  changerStatutInscription,
  genererCodes,
  importerRegistre,
} from "@/features/academique/actions-etudiants";
import { libellePromotion } from "@/features/academique/regles";
import { exigerPermission } from "@/features/auth/acces";
import { qrSvg } from "@/features/documents/qr";
import { db } from "@/lib/db";
import { urlSite } from "@/lib/email";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Étudiants" };

const STATUTS = {
  EN_ATTENTE: { texte: "En attente", ton: "attention" },
  EN_REGLE: { texte: "En règle", ton: "succes" },
  SUSPENDUE: { texte: "Suspendue", ton: "erreur" },
  DIPLOME: { texte: "Diplômé", ton: "ispt" },
  ABANDON: { texte: "Abandon", ton: "neutre" },
} as const;

export default async function Etudiants({ searchParams }: PageProps<"/admin/etudiants">) {
  await exigerPermission("etudiants.gerer");
  const { promotion: pr } = await searchParams;
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  const promotions = annee
    ? await db.promotion.findMany({
        where: { anneeId: annee.id },
        include: { filiere: true, niveau: true, _count: { select: { inscriptions: true } } },
        orderBy: [{ filiere: { ordre: "asc" } }, { niveau: { ordre: "asc" } }],
      })
    : [];
  if (promotions.length === 0)
    return (
      <>
        <EnteteAdmin
          ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Étudiants" }]}
          titre="Étudiants"
        />
        <div className="mt-8">
          <EtatVide
            titre="Aucune promotion pour l'année courante"
            description="Créez d'abord les promotions de l'année."
            action={
              <LienBouton href="/admin/academique" variante="contour" taille="sm">
                Années et promotions
              </LienBouton>
            }
          />
        </div>
      </>
    );
  const promotion = promotions.find((p) => p.id === pr) ?? promotions[0];
  const inscriptions = await db.inscription.findMany({
    where: { promotionId: promotion.id },
    include: { etudiant: { include: { utilisateur: true } } },
    orderBy: [
      { etudiant: { utilisateur: { nom: "asc" } } },
      { etudiant: { utilisateur: { prenom: "asc" } } },
    ],
  });
  const aActiver = inscriptions.filter((i) => i.etudiant.utilisateur.statut === "INVITE").length;
  const avecEmail = inscriptions.filter(
    (i) => i.etudiant.utilisateur.statut === "INVITE" && i.etudiant.utilisateur.email,
  ).length;
  const qrActivation = await qrSvg(`${urlSite()}/activer`);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Étudiants" }]}
        titre="Étudiants"
        description={`Année ${annee!.libelle}. Les étudiants se connectent avec leur matricule, après activation de leur compte par un code remis par le secrétariat.`}
      />

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-80">
          <label htmlFor="promotion" className="block text-sm font-medium text-pierre-800">
            Promotion
          </label>
          <Liste id="promotion" name="promotion" defaultValue={promotion.id} className="mt-1.5">
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>
                {libellePromotion(p)} ({p._count.inscriptions})
              </option>
            ))}
          </Liste>
        </div>
        <button
          type="submit"
          className="h-11 rounded-xs bg-encre px-4 text-sm font-medium text-white hover:bg-ispt-700"
        >
          Afficher
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-2xl">
          {libellePromotion(promotion)} · {inscriptions.length} étudiant(s)
        </h2>
        {inscriptions.length === 0 ? (
          <div className="mt-4">
            <EtatVide
              titre="Aucun étudiant inscrit"
              description="Importez le registre de la promotion ou ajoutez les étudiants un à un."
            />
          </div>
        ) : (
          <div
            className="mt-4 overflow-x-auto rounded-md border border-pierre-200 bg-white"
            tabIndex={0}
            role="region"
            aria-label="Liste des étudiants"
          >
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-pierre-200 bg-pierre-50 font-mono text-xs tracking-wide text-pierre-600 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    N°
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Nom, post-nom et prénom
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Sexe
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Matricule
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Compte
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pierre-200">
                {inscriptions.map((i, n) => {
                  const u = i.etudiant.utilisateur;
                  return (
                    <tr key={i.id}>
                      <td className="px-4 py-2.5 font-mono text-xs text-pierre-500">{n + 1}</td>
                      <td className="px-4 py-2.5 text-pierre-900">
                        <Link
                          href={`/admin/etudiants/${u.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {[u.nom, u.postnom, u.prenom].filter(Boolean).join(" ")}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{i.etudiant.sexe ?? "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{i.etudiant.matricule}</td>
                      <td className="px-4 py-2.5">
                        {u.statut === "ACTIF" ? (
                          <Etiquette ton="succes">Activé</Etiquette>
                        ) : u.statut === "SUSPENDU" ? (
                          <Etiquette ton="erreur">Suspendu</Etiquette>
                        ) : (
                          <Etiquette ton="attention">À activer</Etiquette>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <details className="relative">
                          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <Etiquette ton={STATUTS[i.statut].ton}>
                              {STATUTS[i.statut].texte}
                            </Etiquette>
                          </summary>
                          <div className="absolute right-0 z-10 mt-2 flex w-44 flex-col gap-1 rounded-xs border border-pierre-200 bg-white p-2 shadow-lg">
                            {(["EN_REGLE", "EN_ATTENTE", "SUSPENDUE", "ABANDON"] as const)
                              .filter((s) => s !== i.statut)
                              .map((s) => (
                                <BoutonAction
                                  key={s}
                                  action={changerStatutInscription.bind(null, i.id, s)}
                                  variante="fantome"
                                  className="w-full justify-start"
                                >
                                  {STATUTS[s].texte}
                                </BoutonAction>
                              ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panneau
          titre="Importer le registre"
          description="Fichier CSV exporté du tableur de la promotion."
        >
          <ImportRegistre action={importerRegistre.bind(null, promotion.id)} />
        </Panneau>
        <Panneau titre="Ajouter un étudiant">
          <FormulaireAction
            action={ajouterEtudiant.bind(null, promotion.id)}
            libelleEnvoi="Ajouter"
            viderApresSucces
          >
            <Champ
              id="nomComplet"
              libelle="Nom, post-nom et prénom"
              obligatoire
              aide="Nom et post-nom en capitales, puis le prénom."
            >
              <Saisie
                id="nomComplet"
                name="nomComplet"
                placeholder="BAHATI MUKENGERE Grâce"
                aria-describedby="nomComplet-aide"
              />
            </Champ>
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <Champ id="matricule" libelle="Matricule" obligatoire>
                <Saisie id="matricule" name="matricule" autoCapitalize="characters" />
              </Champ>
              <Champ id="sexe" libelle="Sexe">
                <Liste id="sexe" name="sexe" defaultValue="">
                  <option value="">—</option>
                  <option value="F">F</option>
                  <option value="M">M</option>
                </Liste>
              </Champ>
            </div>
            <Champ id="email" libelle="Email (facultatif)">
              <Saisie id="email" name="email" type="email" />
            </Champ>
          </FormulaireAction>
        </Panneau>
      </div>

      <Panneau
        className="mt-6"
        titre="Codes d'activation"
        description={`${aActiver} étudiant(s) de la promotion n'ont pas encore activé leur compte.`}
      >
        <CodesActivation
          action={genererCodes.bind(null, promotion.id, false)}
          actionEmail={genererCodes.bind(null, promotion.id, true)}
          avecEmail={avecEmail}
          qr={qrActivation}
          promotion={libellePromotion(promotion)}
          urlActivation={`${urlSite().replace(/^https?:\/\//, "")}/activer`}
        />
      </Panneau>
    </>
  );
}
