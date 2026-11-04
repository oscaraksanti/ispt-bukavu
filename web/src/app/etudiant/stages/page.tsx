import type { Metadata } from "next";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerEtudiant } from "@/features/espaces/acces";
import { deposerRapport } from "@/features/stages/actions";
import { STATUTS_STAGE, TYPES_STAGE } from "@/features/stages/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Stages" };

export default async function StagesEtudiant() {
  const { profil } = await exigerEtudiant();
  const stages = await db.stage.findMany({
    where: { etudiantId: profil.id },
    include: { lieu: true, encadreur: true, annee: true, rapport: true },
    orderBy: { debut: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-[2.25rem] leading-tight">Stages</h1>
      {stages.length === 0 && (
        <EtatVide
          titre="Aucun stage pour le moment"
          description="Le responsable des stages vous affectera un lieu de stage."
        />
      )}
      {stages.map((s) => (
        <section key={s.id} className="rounded-md border border-pierre-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex-1 text-2xl">{s.lieu.nom}</h2>
            <Etiquette ton={s.statut === "TERMINE" ? "succes" : "ispt"}>
              {STATUTS_STAGE[s.statut]}
            </Etiquette>
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Type", TYPES_STAGE[s.type]],
              ["Année", s.annee.libelle],
              [
                "Période",
                s.debut
                  ? `${formatJour.format(s.debut)}${s.fin ? ` → ${formatJour.format(s.fin)}` : ""}`
                  : "À préciser",
              ],
              [
                "Encadreur",
                s.encadreur
                  ? [s.encadreur.prenom, s.encadreur.nom].filter(Boolean).join(" ")
                  : "À désigner",
              ],
              ["Adresse", s.lieu.adresse ?? "—"],
              ["Contact", [s.lieu.contact, s.lieu.telephone].filter(Boolean).join(" · ") || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">{k}</dt>
                <dd className="mt-0.5 text-pierre-900">{v}</dd>
              </div>
            ))}
          </dl>
          {s.note !== null ? (
            <div className="mt-6 rounded-xs bg-succes-fond p-4 text-sm">
              <p className="font-medium text-encre">Évaluation : {Number(s.note)}/20</p>
              {s.appreciation && <p className="mt-1 text-pierre-700">{s.appreciation}</p>}
            </div>
          ) : (
            <div className="mt-6 border-t border-pierre-200 pt-5">
              {s.rapport && (
                <p className="mb-3 text-sm">
                  Rapport déposé :{" "}
                  <a
                    href={`/stages/rapport/${s.id}`}
                    target="_blank"
                    rel="noopener"
                    className="text-ispt-600 underline"
                  >
                    {s.rapport.nomFichier}
                  </a>
                </p>
              )}
              <FormulaireAction
                action={deposerRapport.bind(null, s.id)}
                libelleEnvoi={s.rapport ? "Remplacer le rapport" : "Déposer le rapport"}
              >
                <Champ id={`rapport-${s.id}`} libelle="Rapport de stage (PDF, 4 Mo au plus)">
                  <input
                    id={`rapport-${s.id}`}
                    name="rapport"
                    type="file"
                    accept="application/pdf"
                    className="block w-full text-sm file:mr-3 file:rounded-xs file:border file:border-pierre-300 file:bg-white file:px-3 file:py-1.5"
                  />
                </Champ>
              </FormulaireAction>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
