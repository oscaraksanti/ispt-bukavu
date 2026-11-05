import { TriangleAlert, CircleCheck, Download, FileText, RefreshCw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Etapes } from "@/components/deliberations/etapes";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { versChampDate } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import {
  annulerProclamation,
  cloturer,
  deciderJury,
  enregistrerJury,
  proclamer,
  recalculer,
  rouvrir,
} from "@/features/deliberations/actions";
import {
  INCLURE_DELIBERATION,
  notesDeLaPromotion,
  reglementDe,
  titreDeliberation,
} from "@/features/deliberations/donnees";
import {
  controles,
  decisionFinale,
  LIBELLES_STATUT,
  type LigneCours,
  type Periode,
  type Resultat,
  statistiquesSession,
} from "@/features/deliberations/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Délibération" };

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const fr = (v: number | null, d = 2) =>
  v === null ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: d });
const TON_DECISION: Record<string, "succes" | "attention" | "erreur" | "neutre"> = {
  ADM: "succes",
  COMP: "attention",
  RATTRAPAGE: "erreur",
  INCOMPLET: "neutre",
};

export default async function Deliberation({
  params,
  searchParams,
}: PageProps<"/admin/deliberations/[id]">) {
  await exigerPermission("academique.notes.valider");
  const { id } = await params;
  const { tri } = await searchParams;
  const d = await db.deliberation.findUnique({
    where: { id },
    include: {
      ...INCLURE_DELIBERATION,
      resultats: { include: { etudiant: { include: { utilisateur: true } } } },
    },
  });
  if (!d) notFound();
  const reglement = await reglementDe(d);
  const annuelle = d.periode === "ANNUELLE";
  const enPreparation = d.statut === "PREPARATION";
  const { coursSansNotes, nbCours } = await notesDeLaPromotion(
    d.promotionId,
    d.periode as Periode,
    d.semestre,
  );
  const nom = (r: (typeof d.resultats)[number]) =>
    [r.etudiant.utilisateur.nom, r.etudiant.utilisateur.postnom, r.etudiant.utilisateur.prenom]
      .filter(Boolean)
      .join(" ");
  const resultats = [...d.resultats].sort((a, b) =>
    tri === "rang" ? (a.rang ?? 999) - (b.rang ?? 999) : nom(a).localeCompare(nom(b), "fr"),
  );
  const c = controles(
    resultats.map((r) => ({
      coursNonPresentes: r.coursNonPresentes,
      casLimite: r.casLimite,
      decisionJury: r.decisionJury,
      motifJury: r.motifJury,
      decision: r.decisionProposee,
    })),
    coursSansNotes,
    d.statut === "PREPARATION"
      ? { nbCours, secretaire: d.secretaireJury, president: d.presidentJury }
      : { nbCours },
  );
  const pourStats: Resultat[] = resultats.map((r) => ({
    etudiantId: r.etudiantId,
    cours: r.details as LigneCours[],
    total: n(r.total) ?? 0,
    creditsTotal: r.creditsTotal,
    creditsValides: r.creditsValides,
    coursNonPresentes: r.coursNonPresentes,
    moyenneBrute: n(r.moyenneBrute),
    moyenne: n(r.moyenne),
    mention: r.mention ? { lettre: r.mention, libelle: r.mentionLibelle ?? "", seuil: 0 } : null,
    decision: null,
    casLimite: r.casLimite,
    rang: r.rang,
  }));
  const stats = statistiquesSession(pourStats, reglement.seuilValidation);
  const finales = resultats.map((r) => decisionFinale(r.decisionProposee, r.decisionJury));
  const compte = (code: string) => finales.filter((x) => x === code).length;
  const reussite = resultats.length
    ? annuelle
      ? Math.round(((compte("ADM") + compte("COMP")) / resultats.length) * 100)
      : Math.round(
          (resultats.filter((r) => r.creditsValides === r.creditsTotal).length / resultats.length) *
            100,
        )
    : 0;
  const maxMention = Math.max(1, ...Object.values(stats.parMention));

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Délibérations", href: `/admin/deliberations?annee=${d.promotion.anneeId}` },
          { libelle: titreDeliberation(d) },
        ]}
        titre={titreDeliberation(d)}
        description={
          d.calculeLe
            ? `Calculé le ${d.calculeLe.toLocaleString("fr-FR", { timeZone: "Africa/Lubumbashi", dateStyle: "long", timeStyle: "short" })} à partir des notes publiées.`
            : undefined
        }
        actions={
          <>
            <Link
              href={`/deliberations/${d.id}/pv`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm text-encre hover:border-encre"
            >
              <FileText aria-hidden className="size-4" /> Procès-verbal
            </Link>
            <a
              href={`/deliberations/${d.id}/export`}
              className="inline-flex h-10 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm text-encre hover:border-encre"
            >
              <Download aria-hidden className="size-4" /> Export (tableur)
            </a>
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panneau titre="Étapes">
            <Etapes statut={d.statut} />
            <div className="mt-5 flex flex-wrap gap-2">
              {enPreparation && (
                <>
                  <BoutonAction action={recalculer.bind(null, d.id)}>
                    <RefreshCw aria-hidden className="size-4" /> Recalculer
                  </BoutonAction>
                  <BoutonAction
                    action={cloturer.bind(null, d.id)}
                    variante="institutionnel"
                    confirmation="Clôturer le jury ? Les résultats seront figés."
                  >
                    Clôturer le jury
                  </BoutonAction>
                </>
              )}
              {d.statut === "CLOTUREE" && (
                <>
                  <BoutonAction action={rouvrir.bind(null, d.id)} confirmation="Rouvrir le jury ?">
                    Rouvrir le jury
                  </BoutonAction>
                  <BoutonAction
                    action={proclamer.bind(null, d.id)}
                    variante="institutionnel"
                    confirmation={`Proclamer et émettre ${resultats.length} bulletin(s) ?`}
                  >
                    Proclamer les résultats
                  </BoutonAction>
                </>
              )}
            </div>
            {d.statut === "PROCLAMEE" && d.proclameLe && (
              <p className="mt-5 flex items-center gap-2 rounded-xs bg-succes-fond px-4 py-3 text-sm text-succes">
                <CircleCheck aria-hidden className="size-4 shrink-0" />
                Résultats proclamés le{" "}
                {d.proclameLe.toLocaleString("fr-FR", {
                  timeZone: "Africa/Lubumbashi",
                  dateStyle: "long",
                  timeStyle: "short",
                })}{" "}
                : {resultats.filter((r) => r.documentId).length} bulletin(s) émis et vérifiables.
              </p>
            )}
            {d.statut === "PROCLAMEE" && (
              <details className="mt-5 rounded-xs bg-pierre-50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-erreur">
                  Annuler la proclamation (rectification)
                </summary>
                <div className="mt-3">
                  <FormulaireAction
                    action={annulerProclamation.bind(null, d.id)}
                    libelleEnvoi="Annuler la proclamation"
                  >
                    <Champ
                      id="motif-annulation"
                      libelle="Motif, communiqué aux étudiants"
                      aide="Les bulletins émis seront révoqués : leur vérification en ligne l'indiquera."
                    >
                      <Saisie
                        id="motif-annulation"
                        name="motif"
                        maxLength={300}
                        required
                        aria-describedby="motif-annulation-aide"
                      />
                    </Champ>
                  </FormulaireAction>
                </div>
              </details>
            )}
          </Panneau>

          <Panneau titre="Contrôles avant le jury">
            {c.bloquants.length === 0 && c.avertissements.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-succes">
                <CircleCheck aria-hidden className="size-4" /> Aucune anomalie : le jury peut
                statuer.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {c.bloquants.map((b) => (
                  <li key={b} className="flex gap-2 text-erreur">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <span className="font-medium">Bloquant : </span>
                      {b}
                    </span>
                  </li>
                ))}
                {c.avertissements.map((b) => (
                  <li key={b} className="flex gap-2 text-attention">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>
        </div>

        <div className="space-y-6">
          <Panneau titre="Synthèse">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-pierre-600">Statut</dt>
                <dd className="mt-1">
                  <Etiquette ton={d.statut === "PROCLAMEE" ? "succes" : "attention"}>
                    {LIBELLES_STATUT[d.statut]}
                  </Etiquette>
                </dd>
              </div>
              <div>
                <dt className="text-pierre-600">Effectif</dt>
                <dd className="mt-1 font-mono text-lg text-encre">{resultats.length}</dd>
              </div>
              <div>
                <dt className="text-pierre-600">Moyenne de la promotion</dt>
                <dd className="mt-1 font-mono text-lg text-encre">{fr(stats.moyennePromotion)}</dd>
              </div>
              <div>
                <dt className="text-pierre-600">
                  {annuelle ? "Réussite (ADM + COMP)" : "Semestre entièrement validé"}
                </dt>
                <dd className="mt-1 font-mono text-lg text-encre">{reussite} %</dd>
              </div>
              {annuelle &&
                (["ADM", "COMP", "RATTRAPAGE"] as const).map((k) => (
                  <div key={k}>
                    <dt className="text-pierre-600">{k}</dt>
                    <dd className="mt-1 font-mono text-lg text-encre">{compte(k)}</dd>
                  </div>
                ))}
            </dl>
          </Panneau>
          <Panneau titre="Jury">
            <FormulaireAction action={enregistrerJury.bind(null, d.id)} libelleEnvoi="Enregistrer">
              <Champ id="dateJury" libelle="Date de la délibération">
                <Saisie
                  id="dateJury"
                  name="dateJury"
                  type="date"
                  defaultValue={versChampDate(d.dateJury).slice(0, 10)}
                  disabled={d.statut === "PROCLAMEE"}
                />
              </Champ>
              <Champ id="secretaireJury" libelle="Secrétaire du jury">
                <Saisie
                  id="secretaireJury"
                  name="secretaireJury"
                  defaultValue={d.secretaireJury ?? ""}
                  disabled={d.statut === "PROCLAMEE"}
                />
              </Champ>
              <Champ id="presidentJury" libelle="Président du jury">
                <Saisie
                  id="presidentJury"
                  name="presidentJury"
                  defaultValue={d.presidentJury ?? ""}
                  disabled={d.statut === "PROCLAMEE"}
                />
              </Champ>
            </FormulaireAction>
          </Panneau>
        </div>
      </div>

      <section className="mt-10" aria-labelledby="titre-resultats">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="titre-resultats" className="font-sans text-lg font-semibold text-encre">
            Résultats
          </h2>
          <nav aria-label="Tri des résultats" className="flex gap-2 text-sm">
            {[
              ["nom", "Par nom"],
              ["rang", "Par rang"],
            ].map(([k, l]) => (
              <Link
                key={k}
                href={`/admin/deliberations/${d.id}?tri=${k}`}
                aria-current={(tri ?? "nom") === k ? "page" : undefined}
                className={
                  (tri ?? "nom") === k
                    ? "font-medium text-encre underline"
                    : "text-ispt-600 hover:underline"
                }
              >
                {l}
              </Link>
            ))}
          </nav>
        </div>
        <div
          className="mt-3 overflow-x-auto rounded-md border border-pierre-200 bg-white"
          tabIndex={0}
          role="region"
          aria-label="Résultats de la délibération"
        >
          <table className="w-full text-sm">
            <thead className="bg-pierre-50 text-left font-mono text-xs text-pierre-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Étudiant
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Moyenne
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Crédits
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Mention
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Rang
                </th>
                {annuelle && (
                  <th scope="col" className="px-3 py-3 font-medium">
                    Décision
                  </th>
                )}
                <th scope="col" className="px-4 py-3 font-medium">
                  Remarques
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pierre-200">
              {resultats.map((r) => {
                const finale = decisionFinale(r.decisionProposee, r.decisionJury);
                return (
                  <tr key={r.id} className="align-top">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="block font-medium text-encre">{nom(r)}</span>
                      <span className="font-mono text-xs text-pierre-600">
                        {r.etudiant.matricule}
                      </span>
                    </th>
                    <td
                      className={`px-3 py-3 text-right font-mono ${n(r.moyenne) !== null && n(r.moyenne)! < reglement.seuilValidation ? "text-erreur" : "text-encre"}`}
                    >
                      {fr(n(r.moyenne))}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.creditsValides}/{r.creditsTotal}
                    </td>
                    <td className="px-3 py-3">
                      {r.mention ? `${r.mention} – ${r.mentionLibelle}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{r.rang ?? "—"}</td>
                    {annuelle && (
                      <td className="px-3 py-3">
                        {finale && (
                          <Etiquette ton={TON_DECISION[finale] ?? "neutre"}>{finale}</Etiquette>
                        )}
                        {r.decisionJury && (
                          <span className="mt-1 block text-xs text-pierre-600">
                            Proposée : {r.decisionProposee} · jury : « {r.motifJury} »
                          </span>
                        )}
                        {enPreparation && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-ispt-600">
                              Décision du jury<span className="sr-only"> pour {nom(r)}</span>
                            </summary>
                            <div className="mt-2 w-64">
                              <FormulaireAction
                                action={deciderJury.bind(null, r.id)}
                                libelleEnvoi="Appliquer"
                              >
                                <Champ id={`decision-${r.id}`} libelle="Décision">
                                  <Liste
                                    id={`decision-${r.id}`}
                                    name="decision"
                                    defaultValue={r.decisionJury ?? ""}
                                  >
                                    <option value="">Proposée ({r.decisionProposee})</option>
                                    <option value="ADM">ADM</option>
                                    <option value="COMP">COMP</option>
                                    <option value="RATTRAPAGE">RATTRAPAGE</option>
                                  </Liste>
                                </Champ>
                                <Champ
                                  id={`motif-${r.id}`}
                                  libelle="Motif (obligatoire si différente)"
                                >
                                  <Saisie
                                    id={`motif-${r.id}`}
                                    name="motif"
                                    defaultValue={r.motifJury ?? ""}
                                    maxLength={500}
                                  />
                                </Champ>
                              </FormulaireAction>
                            </div>
                          </details>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs">
                      {r.coursNonPresentes > 0 && (
                        <span className="block text-attention">
                          {r.coursNonPresentes} cours non présenté(s)
                        </span>
                      )}
                      {r.casLimite && (
                        <span className="block text-attention">Cas limite : {r.casLimite}</span>
                      )}
                      {r.creditsValides < r.creditsTotal && (
                        <span className="block text-pierre-600">
                          À rattraper :{" "}
                          {(r.details as LigneCours[])
                            .filter((l) => !l.valide)
                            .map((l) => l.intitule)
                            .join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panneau titre="Répartition des mentions">
          <ul className="space-y-2 text-sm">
            {reglement.mentions.map((m) => {
              const k = stats.parMention[m.lettre] ?? 0;
              return (
                <li key={m.lettre} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3">
                  <span className="text-pierre-700">
                    {m.lettre} – {m.libelle}
                  </span>
                  <span className="h-2.5 rounded-full bg-pierre-100" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-ispt-600"
                      style={{ width: `${(k / maxMention) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-mono">{k}</span>
                </li>
              );
            })}
          </ul>
        </Panneau>
        <Panneau
          titre="Réussite par cours"
          description="Du cours le moins réussi au plus réussi : utile pour repérer les difficultés."
        >
          <ul className="space-y-2 text-sm">
            {stats.cours.map((x) => (
              <li key={x.coursId} className="grid grid-cols-[1fr_6rem_3rem] items-center gap-3">
                <span className="truncate text-pierre-800" title={x.intitule}>
                  {x.intitule}
                  <span className="text-pierre-600"> · moy. {fr(x.moyenne)}</span>
                </span>
                <span className="h-2.5 rounded-full bg-pierre-100" aria-hidden>
                  <span
                    className={`block h-full rounded-full ${x.tauxValidation < 50 ? "bg-erreur" : x.tauxValidation < 75 ? "bg-attention" : "bg-succes"}`}
                    style={{ width: `${x.tauxValidation}%` }}
                  />
                </span>
                <span className="text-right font-mono">{x.tauxValidation} %</span>
              </li>
            ))}
          </ul>
        </Panneau>
      </div>
    </>
  );
}
