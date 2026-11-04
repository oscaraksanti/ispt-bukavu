import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { Blason } from "@/components/marque/blason";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { enHeureBukavu, MODALITES, TYPES_SESSION } from "@/features/examens/regles";
import { nomComplet, sessionDetaillee } from "@/features/examens/requetes";
import { libelleJour } from "@/features/horaires/regles";

export const instant = false;

export const metadata: Metadata = { title: "Calendrier des examens", robots: { index: false } };

/** Calendrier imprimable, une page par promotion, au format des valves. */
async function Calendrier({ params }: { params: PageProps<"/examens/[id]/imprimer">["params"] }) {
  const u = await utilisateurConnecte();
  const { id } = await params;
  if (!u) redirect(`/connexion?suite=/examens/${id}/imprimer`);
  if (!u.permissions.has("academique.horaires")) notFound();
  const s = await sessionDetaillee(id);
  if (!s) notFound();
  const institut = await lireInstitut();
  const promotions = new Map<string, { libelle: string; epreuves: typeof s.epreuves }>();
  for (const e of s.epreuves) {
    const p = e.coursOffert.promotion;
    const entree = promotions.get(p.id) ?? { libelle: libellePromotion(p), epreuves: [] };
    entree.epreuves.push(e);
    promotions.set(p.id, entree);
  }
  const liste = [...promotions.values()].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));

  return (
    <main className="min-h-svh bg-pierre-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[210mm] justify-between gap-4 px-4 print:hidden">
        <p className="text-sm text-pierre-700">
          {liste.length} promotion{liste.length > 1 ? "s" : ""} · une page par promotion.
          {s.statut !== "PUBLIEE" && " Brouillon : non encore publié."}
        </p>
        <BoutonImprimer libelle="Imprimer" />
      </div>
      {liste.map((p) => (
        <article
          key={p.libelle}
          className="document-a4 mx-auto mb-8 flex min-h-[297mm] w-full max-w-[210mm] break-after-page flex-col bg-white px-[16mm] py-[14mm] text-black shadow-lg print:mb-0 print:shadow-none"
        >
          <header className="flex items-center gap-5 border-b-2 border-encre pb-4">
            <Blason hauteur={72} decoratif />
            <div className="flex-1 leading-tight">
              <p className="font-sans text-[11pt] font-bold">{institut.nom}</p>
              <p className="text-[9pt]">
                {institut.rue}, {institut.ville}
              </p>
            </div>
          </header>
          <h1 className="mt-6 text-center font-sans text-[15pt] font-bold uppercase">
            Calendrier des examens · {p.libelle}
          </h1>
          <p className="text-center text-[10.5pt]">
            {s.libelle} ({TYPES_SESSION[s.type].toLowerCase()}) · année académique {s.annee.libelle}
          </p>
          <table className="mt-6 w-full border-collapse text-[10pt]">
            <thead>
              <tr className="bg-pierre-100">
                {["Jour", "Heures", "Cours", "Modalité", "Salle", "Surveillance"].map((t) => (
                  <th key={t} className="border border-black px-2 py-1.5 text-left">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.epreuves.map((e) => (
                <tr key={e.id}>
                  <td className="border border-black px-2 py-1.5 first-letter:uppercase">
                    {libelleJour(enHeureBukavu(e.debut).jour)}
                  </td>
                  <td className="border border-black px-2 py-1.5 whitespace-nowrap">
                    {formatHeure.format(e.debut)}–{formatHeure.format(e.fin)}
                  </td>
                  <td className="border border-black px-2 py-1.5">
                    {e.coursOffert.cours.intitule}
                  </td>
                  <td className="border border-black px-2 py-1.5">{MODALITES[e.modalite]}</td>
                  <td className="border border-black px-2 py-1.5">{e.salle ?? "—"}</td>
                  <td className="border border-black px-2 py-1.5 text-[9pt]">
                    {e.surveillants.map((x) => nomComplet(x.enseignant.utilisateur)).join(", ") ||
                      "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {s.consignes && (
            <div className="mt-6 text-[10pt]">
              <p className="font-bold">Consignes</p>
              <p className="mt-1 whitespace-pre-line">{s.consignes}</p>
            </div>
          )}
          <p className="mt-auto pt-8 text-right text-[9pt]">
            {institut.ville}, le {formatJour.format(s.publieeLe ?? new Date(s.creeLe))}
          </p>
        </article>
      ))}
    </main>
  );
}

export default function PageCalendrier({ params }: PageProps<"/examens/[id]/imprimer">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Calendrier params={params} />
    </Suspense>
  );
}
