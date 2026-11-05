import { FileBadge } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Etiquette, LienRetour } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { libellePeriode } from "@/features/deliberations/donnees";
import {
  decisionFinale,
  type LigneCours,
  type Periode,
  reglementComplet,
  type Reglement,
} from "@/features/deliberations/regles";
import { exigerEtudiant } from "@/features/espaces/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Résultat" };

const fr = (v: number | null) =>
  v === null ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export default async function Resultat({ params }: PageProps<"/etudiant/resultats/[id]">) {
  const { profil } = await exigerEtudiant();
  const { id } = await params;
  // Uniquement un résultat proclamé appartenant à l'étudiant connecté.
  const r = await db.resultatDeliberation.findFirst({
    where: { id, etudiantId: profil.id, deliberation: { statut: "PROCLAMEE" } },
    include: {
      deliberation: {
        include: { promotion: { include: { annee: true, niveau: true, filiere: true } } },
      },
      document: { select: { id: true, revoqueLe: true } },
    },
  });
  if (!r) notFound();
  const d = r.deliberation;
  const reglement = reglementComplet(d.regles as Partial<Reglement> | null);
  // Moyenne de la promotion par cours (aucune note individuelle d'un autre étudiant n'est exposée).
  const autres = await db.resultatDeliberation.findMany({
    where: { deliberationId: d.id },
    select: { details: true },
  });
  const moyennes = new Map<string, number>();
  for (const [coursId, notes] of Map.groupBy(
    autres.flatMap((a) => (a.details as LigneCours[]).filter((c) => c.note !== null)),
    (c) => c.coursId,
  ))
    moyennes.set(coursId, notes.reduce((t, c) => t + c.note!, 0) / notes.length);
  const lignes = r.details as LigneCours[];
  const decision = decisionFinale(r.decisionProposee, r.decisionJury);
  const titre = `${libellePeriode({ periode: d.periode as Periode, semestre: d.semestre })} · ${d.promotion.niveau.code} ${d.promotion.annee.libelle}`;

  return (
    <div className="mx-auto max-w-4xl">
      <LienRetour href="/etudiant/resultats">Mes résultats</LienRetour>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-titre-page leading-tight">{titre}</h1>
          <p className="mt-2 text-pierre-600">
            Proclamé le {d.proclameLe ? formatJour.format(d.proclameLe) : "—"} ·{" "}
            {d.promotion.filiere.nom}
          </p>
        </div>
        {r.document && !r.document.revoqueLe && (
          <a
            href={`/documents/${r.document.id}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-11 items-center gap-2 rounded-xs bg-ispt-600 px-5 text-corps text-white hover:bg-ispt-700"
          >
            <FileBadge aria-hidden className="size-4" /> Télécharger le bulletin
          </a>
        )}
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ["Moyenne", `${fr(r.moyenne === null ? null : Number(r.moyenne))}/20`],
          ["Crédits validés", `${r.creditsValides} / ${r.creditsTotal}`],
          ["Mention", r.mention ? `${r.mention} – ${r.mentionLibelle}` : "—"],
          ["Rang", r.rang ? `${r.rang} sur ${autres.length}` : "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border border-pierre-200 bg-white p-4">
            <dt className="text-sm text-pierre-600">{k}</dt>
            <dd className="mt-1 font-mono text-xl text-encre">{v}</dd>
          </div>
        ))}
      </dl>
      {decision && d.periode === "ANNUELLE" && decision !== "INCOMPLET" && (
        <p className="mt-4 text-pierre-800">
          Décision du jury :{" "}
          <Etiquette
            ton={decision === "ADM" ? "succes" : decision === "COMP" ? "attention" : "erreur"}
          >
            {decision}
          </Etiquette>{" "}
          {reglement.decisions[decision as "ADM" | "COMP" | "RATTRAPAGE"]}
        </p>
      )}

      <section className="mt-8" aria-labelledby="titre-cours">
        <h2 id="titre-cours" className="font-sans text-base font-semibold text-encre">
          Détail par cours
        </h2>
        <div
          className="mt-3 overflow-x-auto rounded-md border border-pierre-200 bg-white"
          tabIndex={0}
          role="region"
          aria-label="Détail par cours"
        >
          <table className="w-full text-sm">
            <thead className="bg-pierre-50 text-left font-mono text-xs text-pierre-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Cours
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Crédits
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Ma note
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Moyenne promo
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Résultat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pierre-200">
              {lignes.map((c) => {
                const promo = moyennes.get(c.coursId) ?? null;
                return (
                  <tr key={c.coursId}>
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      <span className="block text-encre">{c.intitule}</span>
                      <span className="text-xs text-pierre-600">
                        S{c.semestre} · {c.ue}
                      </span>
                    </th>
                    <td className="px-3 py-2.5 text-right font-mono">{c.credits}</td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono font-semibold ${c.valide ? "text-encre" : "text-erreur"}`}
                    >
                      {fr(c.note)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-pierre-600">
                      {fr(promo === null ? null : Math.round(promo * 100) / 100)}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.note === null ? (
                        <Etiquette ton="attention">Non présenté</Etiquette>
                      ) : c.valide ? (
                        <Etiquette ton="succes">Validé</Etiquette>
                      ) : (
                        <Etiquette ton="erreur">À rattraper</Etiquette>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
