import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { TableauNotes } from "@/components/notes/tableau-notes";
import { Case } from "@/components/ui/champs";
import { Encadre, Etiquette } from "@/components/ui/elements";
import { exigerEnseignant } from "@/features/espaces/acces";
import {
  enregistrerNotes,
  supprimerEvaluation,
  transmettreEvaluation,
} from "@/features/notes/actions";
import { etudiantsDuCours, peutGererCours } from "@/features/notes/acces";
import { LIBELLES_EVALUATION, statistiques, TYPES_EVALUATION } from "@/features/notes/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Saisie des notes" };

export default async function SaisieNotes({
  params,
}: PageProps<"/enseignant/cours/[id]/evaluations/[evaluationId]">) {
  const { u } = await exigerEnseignant();
  const { id, evaluationId } = await params;
  if (!(await peutGererCours(u, id))) notFound();
  const e = await db.evaluation.findFirst({
    where: { id: evaluationId, coursOffertId: id },
    include: {
      notes: true,
      coursOffert: { include: { cours: true, promotion: { include: { annee: true } } } },
    },
  });
  if (!e) notFound();
  const etudiants = await etudiantsDuCours(id);
  const enSaisie = e.statut === "BROUILLON";
  const seuil = Number(e.coursOffert.promotion.annee.seuilReussite);
  const stats = statistiques(
    e.notes.map((n) => ({ valeur: n.valeur === null ? null : Number(n.valeur), absent: n.absent })),
    seuil,
  );
  const lignes = etudiants.map((et) => {
    const n = e.notes.find((x) => x.etudiantId === et.id);
    return {
      ...et,
      valeur: n?.valeur === null || n === undefined ? null : Number(n.valeur),
      absent: n?.absent ?? false,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/enseignant/cours/${id}`}
          className="text-sm text-ispt-600 underline hover:no-underline"
        >
          ← {e.coursOffert.cours.intitule}
        </Link>
        <h1 className="mt-4 text-[2rem] leading-tight">{e.intitule}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-pierre-700">
          <Etiquette ton={enSaisie ? "neutre" : "ispt"}>{LIBELLES_EVALUATION[e.statut]}</Etiquette>
          {TYPES_EVALUATION[e.type]} · poids {Number(e.ponderation)} % · notes sur 20
        </p>
      </header>

      {stats && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Moyenne", stats.moyenne],
            ["Minimum", stats.min],
            ["Maximum", stats.max],
            ["Réussite", `${stats.reussite} %`],
            ["Absents", stats.absents],
          ].map(([l, v]) => (
            <div key={l} className="rounded-md border border-pierre-200 bg-white p-3">
              <dt className="font-mono text-[0.6875rem] tracking-wide text-pierre-500 uppercase">
                {l}
              </dt>
              <dd className="mt-1 font-serif text-2xl text-encre">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {!enSaisie && (
        <Encadre titre="Notes transmises">
          Le secrétariat académique valide puis publie les notes. Pour une correction, demandez-lui
          de vous renvoyer l&apos;évaluation.
        </Encadre>
      )}

      {enSaisie ? (
        <div className="rounded-md border border-pierre-200 bg-white p-5">
          <FormulaireAction
            action={enregistrerNotes.bind(null, e.id)}
            libelleEnvoi="Enregistrer les notes"
          >
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Notes des étudiants"
            >
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-pierre-200 font-mono text-xs tracking-wide text-pierre-600 uppercase">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      N°
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Étudiant
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Note / 20
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Absent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pierre-100">
                  {lignes.map((l, i) => (
                    <tr key={l.id}>
                      <td className="py-2 pr-3 font-mono text-xs text-pierre-500">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <span className="block text-pierre-900">{l.nom}</span>
                        <span className="font-mono text-xs text-pierre-500">{l.matricule}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <label className="sr-only" htmlFor={`note-${l.id}`}>
                          Note de {l.nom}
                        </label>
                        <input
                          id={`note-${l.id}`}
                          name={`note-${l.id}`}
                          inputMode="decimal"
                          defaultValue={l.valeur ?? ""}
                          className="h-10 w-24 rounded-xs border border-pierre-300 px-3 text-right font-mono focus:border-ispt-600 focus:ring-2 focus:ring-ispt-600/15 focus:outline-none"
                        />
                      </td>
                      <td className="py-2">
                        <Case
                          name={`absent-${l.id}`}
                          defaultChecked={l.absent}
                          aria-label={`${l.nom} absent`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormulaireAction>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-pierre-200 pt-5">
            <BoutonAction
              action={transmettreEvaluation.bind(null, e.id)}
              variante="institutionnel"
              taille="md"
              confirmation="Transmettre ? Les notes ne seront plus modifiables."
            >
              Transmettre au secrétariat
            </BoutonAction>
            <BoutonAction
              action={supprimerEvaluation.bind(null, e.id)}
              variante="fantome"
              confirmation="Supprimer l'évaluation ?"
              className="text-erreur hover:bg-erreur-fond"
            >
              Supprimer l&apos;évaluation
            </BoutonAction>
            <p className="text-xs text-pierre-500">
              Enregistrez d&apos;abord vos notes, puis transmettez-les.
            </p>
          </div>
        </div>
      ) : (
        <TableauNotes lignes={lignes} seuil={seuil} />
      )}
    </div>
  );
}
