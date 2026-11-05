import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  Apercu,
  EnteteOfficiel,
  Feuille,
  PiedFeuille,
  Rubrique,
  Signatures,
  T,
  TitreDocument,
} from "@/components/documents/papier";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { lireParametresDocuments } from "@/features/documents/parametres";
import { enHeureBukavu, MODALITES, TYPES_SESSION } from "@/features/examens/regles";
import { nomComplet, sessionDetaillee } from "@/features/examens/requetes";
import { libelleJour } from "@/features/horaires/regles";
import { cn } from "@/lib/cn";

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
  const [institut, parametres] = await Promise.all([lireInstitut(), lireParametresDocuments()]);
  const promotions = new Map<string, { libelle: string; epreuves: typeof s.epreuves }>();
  for (const e of s.epreuves) {
    const p = e.coursOffert.promotion;
    const entree = promotions.get(p.id) ?? { libelle: libellePromotion(p), epreuves: [] };
    entree.epreuves.push(e);
    promotions.set(p.id, entree);
  }
  const liste = [...promotions.values()].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));

  return (
    <Apercu
      libelleImprimer="Imprimer"
      informations={
        <>
          {liste.length} promotion{liste.length > 1 ? "s" : ""} · une page par promotion.
          {s.statut !== "PUBLIEE" && " Brouillon : non encore publié."}
        </>
      }
    >
      {liste.map((p) => {
        const securite = `${institut.sigle} ${s.libelle} ${p.libelle}`;
        const jours = [...Map.groupBy(p.epreuves, (e) => enHeureBukavu(e.debut).jour).entries()];
        return (
          <Feuille
            key={p.libelle}
            securite={securite}
            tampon={s.statut !== "PUBLIEE" ? { texte: "Brouillon", ton: "attention" } : null}
          >
            <EnteteOfficiel institut={institut} tutelle={parametres.entete} />
            <TitreDocument
              titre="Calendrier des examens"
              sousTitre={
                <>
                  <strong className="font-semibold text-encre">{p.libelle}</strong> · {s.libelle} (
                  {TYPES_SESSION[s.type].toLowerCase()}) · année académique {s.annee.libelle}
                </>
              }
            />
            <table className={cn(T.tableau, "mt-7 text-[9pt]")}>
              <thead>
                <tr>
                  <th className={cn(T.th, "w-[32mm]")}>Jour</th>
                  <th className={cn(T.th, "w-[24mm]")}>Heures</th>
                  <th className={T.th}>Cours</th>
                  <th className={cn(T.th, "w-[22mm]")}>Modalité</th>
                  <th className={cn(T.th, "w-[22mm]")}>Salle</th>
                  <th className={cn(T.th, "w-[38mm]")}>Surveillance</th>
                </tr>
              </thead>
              {jours.map(([jour, epreuves]) => (
                <tbody key={jour} className="break-inside-avoid">
                  {epreuves.map((e, i) => (
                    <tr key={e.id}>
                      {i === 0 && (
                        <td
                          rowSpan={epreuves.length}
                          className={cn(T.td, "font-semibold text-encre first-letter:uppercase")}
                        >
                          {libelleJour(jour)}
                        </td>
                      )}
                      <td className={cn(T.td, "font-mono text-[8pt] whitespace-nowrap")}>
                        {formatHeure.format(e.debut)}–{formatHeure.format(e.fin)}
                      </td>
                      <td className={cn(T.td, "font-medium text-encre")}>
                        {e.coursOffert.cours.intitule}
                      </td>
                      <td className={T.td}>{MODALITES[e.modalite]}</td>
                      <td className={T.td}>{e.salle ?? "—"}</td>
                      <td className={cn(T.td, "text-[8pt] text-pierre-700")}>
                        {e.surveillants
                          .map((x) => nomComplet(x.enseignant.utilisateur))
                          .join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
            {s.consignes && (
              <section className="mt-7 break-inside-avoid">
                <Rubrique titre="Consignes" />
                <p className="mt-2 text-[9pt] leading-relaxed whitespace-pre-line">{s.consignes}</p>
              </section>
            )}
            <Signatures
              className="mt-auto pt-10"
              lieu={institut.ville}
              date={formatJour.format(s.publieeLe ?? new Date(s.creeLe))}
              signataires={[{ fonction: "Le secrétariat académique", nom: null }]}
            />
            <PiedFeuille
              securite={securite}
              gauche={`${institut.statut} · ${institut.acteCreation}`}
              droite={`${p.epreuves.length} épreuve${p.epreuves.length > 1 ? "s" : ""}`}
            />
          </Feuille>
        );
      })}
    </Apercu>
  );
}

export default function PageCalendrier({ params }: PageProps<"/examens/[id]/imprimer">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Calendrier params={params} />
    </Suspense>
  );
}
