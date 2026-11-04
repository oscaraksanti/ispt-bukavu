import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { Blason } from "@/components/marque/blason";
import { formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import {
  INCLURE_DELIBERATION,
  reglementDe,
  titreDeliberation,
} from "@/features/deliberations/donnees";
import { decisionFinale, LIBELLES_ARRONDI, LIBELLES_STATUT } from "@/features/deliberations/regles";
import { db } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = {
  title: "Procès-verbal de délibération",
  robots: { index: false },
};

const fr = (v: unknown) =>
  v === null || v === undefined
    ? "—"
    : Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

async function Contenu({ params }: { params: PageProps<"/deliberations/[id]/pv">["params"] }) {
  const u = await utilisateurConnecte();
  const { id } = await params;
  if (!u) redirect(`/connexion?suite=/deliberations/${id}/pv`);
  if (!u.permissions.has("academique.notes.valider")) notFound();
  const d = await db.deliberation.findUnique({
    where: { id },
    include: {
      ...INCLURE_DELIBERATION,
      resultats: { include: { etudiant: { include: { utilisateur: true } } } },
    },
  });
  if (!d) notFound();
  const [institut, reglement] = await Promise.all([lireInstitut(), reglementDe(d)]);
  const annuelle = d.periode === "ANNUELLE";
  const nom = (r: (typeof d.resultats)[number]) =>
    [r.etudiant.utilisateur.nom, r.etudiant.utilisateur.postnom, r.etudiant.utilisateur.prenom]
      .filter(Boolean)
      .join(" ");
  const lignes = [...d.resultats].sort((a, b) => nom(a).localeCompare(nom(b), "fr"));
  const finales = lignes.map((r) => decisionFinale(r.decisionProposee, r.decisionJury));
  const compte = (c: string) => finales.filter((x) => x === c).length;
  const brouillon = d.statut === "PREPARATION";

  return (
    <main className="min-h-svh bg-pierre-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[297mm] items-center justify-between px-4 print:hidden">
        <p className="text-sm text-pierre-700">Statut : {LIBELLES_STATUT[d.statut]}</p>
        <BoutonImprimer libelle="Imprimer ou enregistrer en PDF" />
      </div>
      <article className="pv-a4 relative mx-auto w-full max-w-[297mm] bg-white px-[12mm] py-[10mm] text-[9.5pt] text-black shadow-lg print:shadow-none">
        {brouillon && (
          <p className="mb-3 border-2 border-attention py-1 text-center text-xs font-bold text-attention uppercase">
            Document de travail : jury non clôturé
          </p>
        )}
        <header className="flex items-center gap-4 border-b-2 border-encre pb-3">
          <Blason hauteur={64} decoratif />
          <div className="flex-1 text-center leading-tight">
            <p className="font-sans text-[9pt] font-bold uppercase">
              Enseignement supérieur et universitaire
            </p>
            <p className="font-sans text-[11pt] font-bold">{institut.nom}</p>
            <p className="mt-2 font-sans text-[13pt] font-bold tracking-wide uppercase">
              Procès-verbal de délibération
            </p>
            <p className="text-[10pt]">{titreDeliberation(d)}</p>
          </div>
          <div className="w-[64px]" />
        </header>
        <table className="mt-4 w-full border-collapse text-[8.5pt]">
          <thead>
            <tr className="bg-pierre-100">
              {[
                "N°",
                "Matricule",
                "Nom, post-nom et prénom",
                "Moyenne /20",
                "Total points",
                "Crédits validés",
                "Mention",
                "Rang",
                ...(annuelle ? ["Décision"] : []),
                "Observations",
              ].map((h) => (
                <th key={h} className="border border-black px-1.5 py-1 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((r, i) => (
              <tr key={r.id}>
                <td className="border border-black px-1.5 py-0.5 text-center">{i + 1}</td>
                <td className="border border-black px-1.5 py-0.5 text-center font-mono">
                  {r.etudiant.matricule}
                </td>
                <td className="border border-black px-1.5 py-0.5">{nom(r)}</td>
                <td className="border border-black px-1.5 py-0.5 text-center font-semibold">
                  {fr(r.moyenne)}
                </td>
                <td className="border border-black px-1.5 py-0.5 text-center">{fr(r.total)}</td>
                <td className="border border-black px-1.5 py-0.5 text-center">
                  {r.creditsValides}/{r.creditsTotal}
                </td>
                <td className="border border-black px-1.5 py-0.5 text-center">
                  {r.mention ?? "—"}
                </td>
                <td className="border border-black px-1.5 py-0.5 text-center">{r.rang ?? "—"}</td>
                {annuelle && (
                  <td className="border border-black px-1.5 py-0.5 text-center font-semibold">
                    {finales[i]}
                  </td>
                )}
                <td className="border border-black px-1.5 py-0.5 text-[7.5pt]">
                  {r.decisionJury
                    ? `Décision du jury (proposée : ${r.decisionProposee}) : ${r.motifJury}`
                    : ""}
                  {r.coursNonPresentes
                    ? `${r.decisionJury ? " · " : ""}${r.coursNonPresentes} cours non présenté(s)`
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 grid grid-cols-[1fr_1fr] gap-6 text-[8.5pt]">
          <div>
            <p className="font-semibold">Synthèse</p>
            <p>
              Effectif : {lignes.length}
              {annuelle && (
                <>
                  {" "}
                  · ADM : {compte("ADM")} · COMP : {compte("COMP")} · RATTRAPAGE :{" "}
                  {compte("RATTRAPAGE")}
                </>
              )}
            </p>
            <p className="mt-1 text-pierre-700">
              Règles appliquées : validation à {reglement.seuilValidation}/20 (
              {reglement.niveauValidation === "UE" ? "par UE" : "par cours"}) ;{" "}
              {reglement.calculMoyenne === "PONDEREE"
                ? "moyennes pondérées par les crédits"
                : "moyennes simples"}{" "}
              ; arrondi : {LIBELLES_ARRONDI[reglement.arrondi].toLowerCase()}.
            </p>
            {annuelle && (
              <p className="mt-1 text-pierre-700">
                ADM : {reglement.decisions.ADM} · COMP : {reglement.decisions.COMP} · RATTRAPAGE :{" "}
                {reglement.decisions.RATTRAPAGE}
              </p>
            )}
          </div>
          <div className="text-right">
            <p>
              Fait à {institut.ville}, le{" "}
              {formatJour.format(d.dateJury ?? d.clotureLe ?? new Date())}
            </p>
          </div>
        </div>
        <footer className="mt-6 grid grid-cols-2 text-[9.5pt]">
          <div>
            <p className="font-semibold">Le Secrétaire du jury</p>
            <div className="h-[18mm]" />
            <p className="font-semibold">{d.secretaireJury ?? ""}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Le Président du jury</p>
            <div className="h-[18mm]" />
            <p className="font-semibold">{d.presidentJury ?? ""}</p>
          </div>
        </footer>
      </article>
    </main>
  );
}

export default function ProcesVerbal({ params }: PageProps<"/deliberations/[id]/pv">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Contenu params={params} />
    </Suspense>
  );
}
