import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { SituationFinanciere } from "@/components/finances/situation";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { libellePromotion } from "@/features/academique/regles";
import { aujourdhuiBukavu } from "@/features/horaires/regles";
import { aPermission, exigerPermission } from "@/features/auth/acces";
import {
  ajouterExoneration,
  annulerPaiement,
  enregistrerPaiement,
} from "@/features/finances/actions";
import { MODES_PAIEMENT } from "@/features/finances/regles";
import { situationEtudiant } from "@/features/finances/requetes";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Situation financière" };

export default async function SituationAdmin({
  params,
}: PageProps<"/admin/finances/etudiants/[id]">) {
  const u = await exigerPermission("finances.consulter");
  const encaisse = aPermission(u, "finances.encaisser");
  const { id } = await params;
  const profil = await db.profilEtudiant.findUnique({
    where: { id },
    include: { utilisateur: true },
  });
  if (!profil) notFound();
  const s = await situationEtudiant(id);
  if (!s) notFound();
  const promotion = s.inscription
    ? await db.promotion.findUnique({
        where: { id: s.inscription.promotionId },
        include: { niveau: true, filiere: true },
      })
    : null;
  const nom = [profil.utilisateur.nom, profil.utilisateur.postnom, profil.utilisateur.prenom]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Frais et paiements", href: "/admin/finances" },
          { libelle: profil.matricule },
        ]}
        titre={nom}
        description={`Matricule ${profil.matricule}${promotion ? ` · ${libellePromotion(promotion)}` : " · non inscrit cette année"}`}
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SituationFinanciere
            s={s}
            actionsPaiement={(pid, annule) =>
              encaisse && !annule ? (
                <details className="w-full">
                  <summary className="cursor-pointer text-xs text-erreur">
                    Annuler ce paiement
                  </summary>
                  <div className="mt-2">
                    <FormulaireAction
                      action={annulerPaiement.bind(null, pid)}
                      libelleEnvoi="Confirmer l'annulation"
                    >
                      <Champ id={`motif-${pid}`} libelle="Motif">
                        <Saisie
                          id={`motif-${pid}`}
                          name="motif"
                          maxLength={200}
                          placeholder="Erreur de saisie, chèque rejeté…"
                        />
                      </Champ>
                    </FormulaireAction>
                  </div>
                </details>
              ) : null
            }
          />
        </div>
        {encaisse && (
          <div className="space-y-6 lg:col-span-2">
            <Panneau titre="Enregistrer un paiement">
              <FormulaireAction
                action={enregistrerPaiement.bind(null, id)}
                libelleEnvoi="Enregistrer et émettre le reçu"
                viderApresSucces
              >
                <div className="grid grid-cols-[1fr_6rem] gap-3">
                  <Champ id="montant" libelle="Montant">
                    <Saisie id="montant" name="montant" inputMode="decimal" required />
                  </Champ>
                  <Champ id="devise" libelle="Devise">
                    <Liste id="devise" name="devise" defaultValue="USD">
                      <option value="USD">$</option>
                      <option value="CDF">FC</option>
                    </Liste>
                  </Champ>
                </div>
                <Champ id="mode" libelle="Mode">
                  <Liste id="mode" name="mode" defaultValue="BANQUE">
                    {Object.entries(MODES_PAIEMENT).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Liste>
                </Champ>
                <Champ
                  id="reference"
                  libelle="Référence"
                  aide="Numéro du bordereau, de la transaction ou du reçu de banque."
                >
                  <Saisie
                    id="reference"
                    name="reference"
                    maxLength={80}
                    required
                    aria-describedby="reference-aide"
                  />
                </Champ>
                <Champ id="payeLe" libelle="Date du paiement">
                  <Saisie
                    id="payeLe"
                    name="payeLe"
                    type="date"
                    defaultValue={aujourdhuiBukavu()}
                    max={aujourdhuiBukavu()}
                  />
                </Champ>
              </FormulaireAction>
            </Panneau>
            <Panneau titre="Exonération" description="Bourse ou réduction accordée par l'institut.">
              <FormulaireAction
                action={ajouterExoneration.bind(null, id)}
                libelleEnvoi="Enregistrer"
                viderApresSucces
              >
                <div className="grid grid-cols-[1fr_6rem] gap-3">
                  <Champ id="ex-montant" libelle="Montant">
                    <Saisie id="ex-montant" name="montant" inputMode="decimal" />
                  </Champ>
                  <Champ id="ex-devise" libelle="Devise">
                    <Liste id="ex-devise" name="devise" defaultValue="USD">
                      <option value="USD">$</option>
                      <option value="CDF">FC</option>
                    </Liste>
                  </Champ>
                </div>
                <Champ id="ex-motif" libelle="Motif">
                  <Saisie id="ex-motif" name="motif" maxLength={200} />
                </Champ>
              </FormulaireAction>
            </Panneau>
          </div>
        )}
      </div>
    </>
  );
}
