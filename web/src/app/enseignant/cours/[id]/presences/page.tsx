import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnteteCours } from "@/components/cours/entete-cours";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { coursDeLEnseignant } from "@/features/devoirs/acces";
import { exigerEnseignant } from "@/features/espaces/acces";
import { etudiantsDuCours } from "@/features/notes/acces";
import { appelPossible } from "@/features/presences/regles";
import { bilansDuCours, seancesDuCours } from "@/features/presences/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Présences" };

export default async function PresencesEnseignant({
  params,
}: PageProps<"/enseignant/cours/[id]/presences">) {
  const { u } = await exigerEnseignant();
  const { id } = await params;
  const co = await coursDeLEnseignant(u, id);
  if (!co) notFound();
  const [seances, etudiants, bilans] = await Promise.all([
    seancesDuCours(id),
    etudiantsDuCours(id),
    bilansDuCours(id),
  ]);
  const maintenant = new Date();
  const passees = seances.filter((s) => appelPossible(s, maintenant));

  return (
    <div className="space-y-8">
      <EnteteCours
        coursOffertId={id}
        code={`${co.cours.ue.code} · S${co.cours.ue.semestre}`}
        intitule={co.cours.intitule}
        promotion={`${libellePromotion(co.promotion)} · ${etudiants.length} étudiant(s)`}
        actif="presences"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="titre-seances">
          <h2 id="titre-seances" className="font-sans text-base font-semibold text-encre">
            Séances
          </h2>
          <p className="mt-1 text-sm text-pierre-600">
            Les séances viennent de l&apos;horaire établi par le secrétariat. L&apos;appel est
            possible dès le début de la séance.
          </p>
          {passees.length === 0 ? (
            <div className="mt-4">
              <EtatVide
                titre="Aucune séance passée"
                description="Dès qu'une séance de ce cours a commencé, vous pourrez faire l'appel ici."
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
              {passees.map((s) => {
                const fait = s._count.presences > 0;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/enseignant/cours/${id}/presences/${s.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-pierre-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-encre first-letter:uppercase">
                          {formatJour.format(s.debut)}
                        </span>
                        <span className="font-mono text-xs text-pierre-600">
                          {formatHeure.format(s.debut)}–{formatHeure.format(s.fin)}
                          {s.salle ? ` · ${s.salle}` : ""}
                        </span>
                      </span>
                      <Etiquette ton={fait ? "succes" : "attention"}>
                        {fait ? `Appel fait (${s._count.presences})` : "Appel à faire"}
                      </Etiquette>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="titre-assiduite">
          <h2 id="titre-assiduite" className="font-sans text-base font-semibold text-encre">
            Assiduité
          </h2>
          <p className="mt-1 text-sm text-pierre-600">
            Un retard compte comme une présence ; une absence excusée n&apos;entre pas dans le taux.
          </p>
          <div
            className="mt-4 overflow-x-auto rounded-md border border-pierre-200 bg-white"
            tabIndex={0}
            role="region"
            aria-label="Assiduité des étudiants"
          >
            <table className="w-full text-sm">
              <thead className="bg-pierre-50 text-left font-mono text-xs text-pierre-600 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Étudiant
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    Abs.
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Taux
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pierre-200">
                {etudiants.map((e) => {
                  const b = bilans.get(e.id);
                  return (
                    <tr key={e.id}>
                      <th scope="row" className="px-4 py-2.5 text-left font-normal">
                        <span className="block text-encre">{e.nom}</span>
                        <span className="font-mono text-xs text-pierre-600">{e.matricule}</span>
                      </th>
                      <td className="px-3 py-2.5 text-right font-mono">{b ? b.absents : "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {b?.taux != null ? `${b.taux} %` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
