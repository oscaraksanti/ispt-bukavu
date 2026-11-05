import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { EnteteCours } from "@/components/cours/entete-cours";
import { EtatVide, LienRetour } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { coursDeLEnseignant } from "@/features/devoirs/acces";
import { exigerEnseignant } from "@/features/espaces/acces";
import { etudiantsDuCours } from "@/features/notes/acces";
import { enregistrerAppel } from "@/features/presences/actions";
import { appelPossible, LIBELLES_PRESENCE, STATUTS_PRESENCE } from "@/features/presences/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Appel" };

export default async function AppelSeance({
  params,
}: PageProps<"/enseignant/cours/[id]/presences/[seanceId]">) {
  const { u } = await exigerEnseignant();
  const { id, seanceId } = await params;
  const co = await coursDeLEnseignant(u, id);
  if (!co) notFound();
  const [seance, etudiants] = await Promise.all([
    db.seance.findFirst({
      where: { id: seanceId, coursOffertId: id },
      include: { presences: true },
    }),
    etudiantsDuCours(id),
  ]);
  if (!seance) notFound();
  const saisies = new Map(seance.presences.map((p) => [p.etudiantId, p.statut]));

  return (
    <div className="space-y-8">
      <EnteteCours
        coursOffertId={id}
        code={`${co.cours.ue.code} · S${co.cours.ue.semestre}`}
        intitule={co.cours.intitule}
        promotion={libellePromotion(co.promotion)}
        actif="presences"
      />
      <div className="mx-auto max-w-3xl">
        <LienRetour href={`/enseignant/cours/${id}/presences`}>Toutes les séances</LienRetour>
        <h2 className="mt-4 text-2xl first-letter:uppercase">
          Appel du {formatJour.format(seance.debut)}, {formatHeure.format(seance.debut)}–
          {formatHeure.format(seance.fin)}
        </h2>
        <p className="mt-1 text-sm text-pierre-600">
          {seance.presences.length
            ? "Appel déjà enregistré : vous pouvez le corriger."
            : "Tous les étudiants sont proposés « présents » : signalez seulement les autres cas."}
        </p>
        {!appelPossible(seance) ? (
          <div className="mt-6">
            <EtatVide titre="Cette séance n'a pas encore commencé" />
          </div>
        ) : etudiants.length === 0 ? (
          <div className="mt-6">
            <EtatVide titre="Aucun étudiant inscrit dans cette promotion" />
          </div>
        ) : (
          <div className="mt-6">
            <FormulaireAction
              action={enregistrerAppel.bind(null, seance.id)}
              libelleEnvoi="Enregistrer l'appel"
            >
              <ul className="divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
                {etudiants.map((e) => (
                  <li key={e.id} className="px-4 py-3 sm:px-5">
                    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <legend className="float-left min-w-0 flex-1 pr-2">
                        <span className="block text-encre">{e.nom}</span>
                        <span className="font-mono text-xs text-pierre-600">{e.matricule}</span>
                      </legend>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUTS_PRESENCE.map((s) => (
                          <label
                            key={s}
                            className="cursor-pointer rounded-full border border-pierre-300 px-3 py-1 text-sm text-pierre-700 has-checked:border-encre has-checked:bg-encre has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ispt-600"
                          >
                            <input
                              type="radio"
                              name={`statut-${e.id}`}
                              value={s}
                              defaultChecked={(saisies.get(e.id) ?? "PRESENT") === s}
                              className="sr-only"
                            />
                            {LIBELLES_PRESENCE[s]}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ul>
            </FormulaireAction>
          </div>
        )}
      </div>
    </div>
  );
}
