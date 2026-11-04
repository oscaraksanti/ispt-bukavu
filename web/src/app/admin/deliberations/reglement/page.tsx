import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { exigerPermission } from "@/features/auth/acces";
import { enregistrerReglement } from "@/features/deliberations/actions";
import { reglementDeLAnnee } from "@/features/deliberations/donnees";
import { LIBELLES_ARRONDI } from "@/features/deliberations/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Règlement de délibération" };

const fmt = (n: number) => String(n).replace(".", ",");

export default async function Reglement({
  searchParams,
}: PageProps<"/admin/deliberations/reglement">) {
  await exigerPermission("academique.notes.valider");
  const { annee: a } = await searchParams;
  const annee = a
    ? await db.anneeAcademique.findUnique({ where: { id: String(a) } })
    : await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) notFound();
  const { reglement: r, defini } = await reglementDeLAnnee(annee.id);

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Délibérations", href: `/admin/deliberations?annee=${annee.id}` },
          { libelle: "Règlement" },
        ]}
        titre={`Règlement de délibération ${annee.libelle}`}
        description={
          defini
            ? "Règles appliquées aux délibérations de cette année. Une délibération clôturée garde le règlement en vigueur au moment de sa clôture."
            : "Règles par défaut, reprises du fichier de délibération de l'institut : à confirmer, puis enregistrer."
        }
      />
      <div className="mt-8 max-w-4xl">
        <FormulaireAction
          action={enregistrerReglement.bind(null, annee.id)}
          libelleEnvoi="Enregistrer le règlement"
        >
          <div className="space-y-6">
            <Panneau titre="Validation des cours">
              <div className="grid gap-5 sm:grid-cols-2">
                <Champ id="seuilValidation" libelle="Note minimale pour valider (/20)">
                  <Saisie
                    id="seuilValidation"
                    name="seuilValidation"
                    inputMode="decimal"
                    defaultValue={fmt(r.seuilValidation)}
                    required
                  />
                </Champ>
                <Champ
                  id="niveauValidation"
                  libelle="Validation"
                  aide="Par UE : les cours d'une même UE se compensent."
                >
                  <Liste
                    id="niveauValidation"
                    name="niveauValidation"
                    defaultValue={r.niveauValidation}
                    aria-describedby="niveauValidation-aide"
                  >
                    <option value="COURS">Par cours</option>
                    <option value="UE">Par unité d&apos;enseignement (UE)</option>
                  </Liste>
                </Champ>
                <Champ id="coursNonPresente" libelle="Cours non présenté">
                  <Liste
                    id="coursNonPresente"
                    name="coursNonPresente"
                    defaultValue={r.coursNonPresente}
                  >
                    <option value="ZERO">Compté 0</option>
                    <option value="BLOQUANT">Empêche la décision (à régulariser)</option>
                  </Liste>
                </Champ>
              </div>
            </Panneau>

            <Panneau titre="Moyennes">
              <div className="grid gap-5 sm:grid-cols-2">
                <Champ id="calculMoyenne" libelle="Calcul">
                  <Liste id="calculMoyenne" name="calculMoyenne" defaultValue={r.calculMoyenne}>
                    <option value="PONDEREE">Pondérée par les crédits</option>
                    <option value="SIMPLE">Moyenne simple des cours</option>
                  </Liste>
                </Champ>
                <Champ id="arrondi" libelle="Arrondi">
                  <Liste id="arrondi" name="arrondi" defaultValue={r.arrondi}>
                    {Object.entries(LIBELLES_ARRONDI).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Liste>
                </Champ>
              </div>
            </Panneau>

            <Panneau
              titre="Décisions annuelles"
              description="ADM si tous les crédits sont validés ; sinon COMP si la moyenne annuelle atteint le seuil (et que la dette ne dépasse pas le plafond) ; sinon RATTRAPAGE."
            >
              <div className="grid gap-5 sm:grid-cols-3">
                <Champ id="seuilAdmissionDette" libelle="Moyenne minimale pour COMP">
                  <Saisie
                    id="seuilAdmissionDette"
                    name="seuilAdmissionDette"
                    inputMode="decimal"
                    defaultValue={fmt(r.seuilAdmissionDette)}
                    required
                  />
                </Champ>
                <Champ
                  id="plafondCreditsDette"
                  libelle="Plafond de crédits en dette"
                  aide="Vide = pas de plafond."
                >
                  <Saisie
                    id="plafondCreditsDette"
                    name="plafondCreditsDette"
                    inputMode="numeric"
                    defaultValue={r.plafondCreditsDette ?? ""}
                    aria-describedby="plafondCreditsDette-aide"
                  />
                </Champ>
                <Champ
                  id="zoneVigilance"
                  libelle="Cas limites signalés à"
                  aide="Points sous un seuil."
                >
                  <Saisie
                    id="zoneVigilance"
                    name="zoneVigilance"
                    inputMode="decimal"
                    defaultValue={fmt(r.zoneVigilance)}
                    aria-describedby="zoneVigilance-aide"
                  />
                </Champ>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                {(["ADM", "COMP", "RATTRAPAGE"] as const).map((c) => (
                  <Champ key={c} id={`decision-${c}`} libelle={`Libellé ${c}`}>
                    <Saisie
                      id={`decision-${c}`}
                      name={`decision-${c}`}
                      defaultValue={r.decisions[c]}
                      maxLength={60}
                    />
                  </Champ>
                ))}
              </div>
            </Panneau>

            <Panneau titre="Échelle des mentions">
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label="Échelle des mentions"
              >
                <table className="w-full text-sm">
                  <thead className="text-left font-mono text-xs text-pierre-600 uppercase">
                    <tr>
                      <th scope="col" className="pb-2 font-medium">
                        À partir de
                      </th>
                      <th scope="col" className="pb-2 font-medium">
                        Lettre
                      </th>
                      <th scope="col" className="pb-2 font-medium">
                        Mention
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.mentions.map((m, i) => (
                      <tr key={i}>
                        <td className="py-1 pr-3">
                          <Saisie
                            aria-label={`Seuil de la mention ${i + 1}`}
                            name={`mention-seuil-${i}`}
                            inputMode="decimal"
                            defaultValue={fmt(m.seuil)}
                            className="w-24"
                          />
                        </td>
                        <td className="py-1 pr-3">
                          <Saisie
                            aria-label={`Lettre de la mention ${i + 1}`}
                            name={`mention-lettre-${i}`}
                            defaultValue={m.lettre}
                            maxLength={3}
                            className="w-20"
                          />
                        </td>
                        <td className="py-1">
                          <Saisie
                            aria-label={`Libellé de la mention ${i + 1}`}
                            name={`mention-libelle-${i}`}
                            defaultValue={m.libelle}
                            maxLength={40}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panneau>

            <Panneau
              titre="Jury"
              description="Proposé par défaut à chaque nouvelle délibération ; modifiable pour chaque session."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Champ id="secretaireJury" libelle="Secrétaire du jury">
                  <Saisie
                    id="secretaireJury"
                    name="secretaireJury"
                    defaultValue={r.secretaireJury}
                    maxLength={120}
                  />
                </Champ>
                <Champ id="presidentJury" libelle="Président du jury">
                  <Saisie
                    id="presidentJury"
                    name="presidentJury"
                    defaultValue={r.presidentJury}
                    maxLength={120}
                  />
                </Champ>
              </div>
            </Panneau>
          </div>
        </FormulaireAction>
      </div>
    </>
  );
}
