import type { Metadata } from "next";
import { EtatVide, Etiquette } from "@/components/ui/elements";
import { exigerEtudiant } from "@/features/espaces/acces";
import { bilanSemestre, noteCours, TYPES_EVALUATION } from "@/features/notes/regles";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Notes" };

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export default async function NotesEtudiant() {
  const { profil } = await exigerEtudiant();
  const inscription = profil.inscriptions[0];
  if (!inscription) return <EtatVide titre="Aucune inscription pour l'année en cours" />;
  const seuil = Number(inscription.promotion.annee.seuilReussite);
  const cours = await db.coursOffert.findMany({
    where: { promotionId: inscription.promotionId },
    include: {
      cours: { include: { ue: true } },
      // Seules les évaluations publiées sont lues : rien d'autre ne quitte la base.
      evaluations: {
        where: { statut: "PUBLIEE" },
        include: { notes: { where: { etudiantId: profil.id } } },
        orderBy: { date: "asc" },
      },
    },
    orderBy: [{ cours: { ue: { semestre: "asc" } } }, { cours: { intitule: "asc" } }],
  });
  const lignes = cours.map((c) => ({
    id: c.id,
    intitule: c.cours.intitule,
    semestre: c.cours.ue.semestre,
    credits: c.cours.credits,
    evaluations: c.evaluations.map((e) => ({
      id: e.id,
      intitule: e.intitule,
      type: e.type,
      ponderation: Number(e.ponderation),
      note: e.notes[0]
        ? {
            valeur: e.notes[0].valeur === null ? null : Number(e.notes[0].valeur),
            absent: e.notes[0].absent,
          }
        : null,
    })),
  }));
  const parSemestre = Map.groupBy(lignes, (l) => l.semestre);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-titre-page leading-tight">Notes</h1>
        <p className="mt-2 text-pierre-600">
          Notes publiées par le secrétariat académique, sur 20. Un cours est validé à partir de{" "}
          {fmt(seuil)}/20.
        </p>
      </header>
      {[...parSemestre.entries()].map(([semestre, liste]) => {
        const avecNotes = liste.map((l) => ({
          ...l,
          note: noteCours(l.evaluations.map((e) => ({ ...e, statut: "PUBLIEE" as const }))),
        }));
        const bilan = bilanSemestre(avecNotes, seuil);
        return (
          <section key={semestre}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl">Semestre {semestre}</h2>
              <p className="text-sm text-pierre-700">
                {bilan.moyenne !== null ? (
                  <>
                    Moyenne{" "}
                    <strong className="font-semibold text-encre">{fmt(bilan.moyenne)}/20</strong>{" "}
                    ·{" "}
                  </>
                ) : null}
                {bilan.creditsAcquis}/{bilan.creditsTotal} crédits acquis
              </p>
            </div>
            <ul className="mt-4 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
              {avecNotes.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="flex-1 font-medium text-encre">{c.intitule}</p>
                    <span className="text-xs text-pierre-500">{c.credits} cr.</span>
                    {c.note === null ? (
                      <span className="text-sm text-pierre-400">Pas encore de note</span>
                    ) : (
                      <>
                        <span
                          className={cn(
                            "font-mono text-lg",
                            c.note < seuil ? "text-erreur" : "text-encre",
                          )}
                        >
                          {fmt(c.note)}
                        </span>
                        <Etiquette ton={c.note >= seuil ? "succes" : "erreur"}>
                          {c.note >= seuil ? "Validé" : "Non validé"}
                        </Etiquette>
                      </>
                    )}
                  </div>
                  {c.evaluations.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-pierre-600">
                      {c.evaluations.map((e) => (
                        <li key={e.id}>
                          {e.intitule} ({TYPES_EVALUATION[e.type]}, {e.ponderation} %) :{" "}
                          <span className="font-mono text-pierre-900">
                            {e.note?.absent
                              ? "absent"
                              : e.note?.valeur != null
                                ? fmt(e.note.valeur)
                                : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {lignes.length === 0 && <EtatVide titre="Aucun cours pour le moment" />}
    </div>
  );
}
