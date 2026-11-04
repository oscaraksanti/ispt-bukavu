import type { Metadata } from "next";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Saisie, ZoneTexte } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerEnseignant } from "@/features/espaces/acces";
import { evaluerStage } from "@/features/stages/actions";
import { STATUTS_STAGE, TYPES_STAGE } from "@/features/stages/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Stages encadrés" };

export default async function StagesEncadres() {
  const { u } = await exigerEnseignant();
  const stages = await db.stage.findMany({
    where: { encadreurId: u.id },
    include: { lieu: true, etudiant: { include: { utilisateur: true } }, rapport: true },
    orderBy: [{ statut: "asc" }, { debut: "asc" }],
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-[2.25rem] leading-tight">Stages encadrés</h1>
      {stages.length === 0 && <EtatVide titre="Aucun stage à encadrer" />}
      {stages.map((s) => (
        <section key={s.id} className="rounded-md border border-pierre-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex-1 text-xl">
              {[
                s.etudiant.utilisateur.nom,
                s.etudiant.utilisateur.postnom,
                s.etudiant.utilisateur.prenom,
              ]
                .filter(Boolean)
                .join(" ")}
            </h2>
            <Etiquette ton={s.statut === "TERMINE" ? "succes" : "ispt"}>
              {STATUTS_STAGE[s.statut]}
            </Etiquette>
          </div>
          <p className="mt-1 text-sm text-pierre-600">
            {TYPES_STAGE[s.type]} · {s.lieu.nom}
            {s.debut && ` · du ${formatJour.format(s.debut)}`}
            {s.fin && ` au ${formatJour.format(s.fin)}`}
          </p>
          <p className="mt-3 text-sm">
            {s.rapport ? (
              <a
                href={`/stages/rapport/${s.id}`}
                target="_blank"
                rel="noopener"
                className="text-ispt-600 underline"
              >
                Lire le rapport
              </a>
            ) : (
              <span className="text-pierre-500">Rapport non déposé</span>
            )}
          </p>
          <div className="mt-4 border-t border-pierre-200 pt-4">
            <FormulaireAction
              action={evaluerStage.bind(null, s.id)}
              libelleEnvoi="Enregistrer l'évaluation"
            >
              <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
                <Champ id={`note-${s.id}`} libelle="Note / 20">
                  <Saisie
                    id={`note-${s.id}`}
                    name="note"
                    inputMode="decimal"
                    defaultValue={s.note === null ? "" : String(Number(s.note))}
                  />
                </Champ>
                <Champ id={`app-${s.id}`} libelle="Appréciation">
                  <ZoneTexte
                    id={`app-${s.id}`}
                    name="appreciation"
                    rows={2}
                    defaultValue={s.appreciation ?? ""}
                    maxLength={1000}
                  />
                </Champ>
              </div>
            </FormulaireAction>
          </div>
        </section>
      ))}
    </div>
  );
}
