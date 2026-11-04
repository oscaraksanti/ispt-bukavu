import { ArrowRight, FileBadge } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourbeProgression } from "@/components/deliberations/courbe-progression";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { creditsAcquis, resultatsProclames } from "@/features/deliberations/etudiant";
import { reglementDeLAnnee } from "@/features/deliberations/donnees";
import { exigerEtudiant } from "@/features/espaces/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Mes résultats" };

const TON: Record<string, "succes" | "attention" | "erreur" | "neutre"> = {
  ADM: "succes",
  COMP: "attention",
  RATTRAPAGE: "erreur",
};

export default async function Resultats() {
  const { profil } = await exigerEtudiant();
  const [resultats, nbNiveaux] = await Promise.all([
    resultatsProclames(profil.id),
    db.niveau.count(),
  ]);
  const acquis = creditsAcquis(resultats);
  const licence = Math.max(nbNiveaux, 1) * 60;
  const semestres = resultats
    .filter((r) => r.periode === "SEMESTRE" && r.moyenne !== null)
    .sort((a, b) => a.anneeDebut.getTime() - b.anneeDebut.getTime() || a.semestre - b.semestre);
  const dernierAnnuel = resultats.find((r) => r.periode === "ANNUELLE");
  const dettes = dernierAnnuel ? dernierAnnuel.details.filter((c) => !c.valide) : [];
  const seuil = resultats[0]
    ? (await reglementDeLAnnee(resultats[0].anneeId)).reglement.seuilValidation
    : 10;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[2.25rem] leading-tight">Mes résultats</h1>
      <p className="mt-2 text-pierre-600">
        Résultats proclamés par le jury, semestre après semestre. Chaque bulletin porte un QR code
        qui permet d&apos;en vérifier l&apos;authenticité.
      </p>

      {resultats.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucun résultat proclamé pour le moment"
            description="Vos notes de l'année en cours restent consultables dans l'onglet Notes."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-pierre-200 bg-white p-5">
              <p className="text-sm text-pierre-600">Crédits validés vers la licence</p>
              <p className="mt-1 font-mono text-3xl text-encre">
                {acquis}
                <span className="text-lg text-pierre-600"> / {licence}</span>
              </p>
              <div
                className="mt-3 h-2 rounded-full bg-pierre-100"
                role="progressbar"
                aria-label="Crédits validés vers la licence"
                aria-valuemin={0}
                aria-valuemax={licence}
                aria-valuenow={acquis}
              >
                <div
                  className="h-full rounded-full bg-ispt-600"
                  style={{ width: `${Math.min(100, (acquis / licence) * 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-md border border-pierre-200 bg-white p-5">
              <p className="text-sm text-pierre-600">Dernière moyenne proclamée</p>
              <p className="mt-1 font-mono text-3xl text-encre">
                {resultats[0].moyenne?.toLocaleString("fr-FR") ?? "—"}
                <span className="text-lg text-pierre-600"> /20</span>
              </p>
              <p className="mt-2 text-sm text-pierre-700">
                {resultats[0].libelle} · {resultats[0].annee}
              </p>
            </div>
            <div className="rounded-md border border-pierre-200 bg-white p-5">
              <p className="text-sm text-pierre-600">Cours à rattraper</p>
              <p className="mt-1 font-mono text-3xl text-encre">{dettes.length}</p>
              <p className="mt-2 text-sm text-pierre-700">
                {dettes.length
                  ? `${dettes.reduce((t, c) => t + c.credits, 0)} crédits en dette`
                  : "Aucune dette de crédits"}
              </p>
            </div>
          </div>

          {semestres.length >= 2 && (
            <section
              className="mt-8 rounded-md border border-pierre-200 bg-white p-5"
              aria-labelledby="titre-progression"
            >
              <h2 id="titre-progression" className="font-sans text-base font-semibold text-encre">
                Progression
              </h2>
              <div className="mt-3">
                <CourbeProgression
                  points={semestres.map((s) => ({
                    libelle: `S${s.semestre}`,
                    moyenne: s.moyenne!,
                  }))}
                  seuil={seuil}
                />
              </div>
            </section>
          )}

          {dettes.length > 0 && (
            <section
              className="mt-8 rounded-md border border-attention/30 bg-attention-fond p-5"
              aria-labelledby="titre-dettes"
            >
              <h2 id="titre-dettes" className="font-sans text-base font-semibold text-encre">
                Cours à rattraper ({dernierAnnuel!.annee})
              </h2>
              <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm text-pierre-800 sm:grid-cols-2">
                {dettes.map((c) => (
                  <li key={c.coursId} className="flex justify-between gap-3">
                    <span>{c.intitule}</span>
                    <span className="font-mono text-pierre-600">
                      {c.note === null ? "non présenté" : `${c.note.toLocaleString("fr-FR")}/20`} ·{" "}
                      {c.credits} cr.
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8" aria-labelledby="titre-sessions">
            <h2 id="titre-sessions" className="font-sans text-base font-semibold text-encre">
              Résultats proclamés
            </h2>
            <ul className="mt-3 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
              {resultats.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                  <Link href={`/etudiant/resultats/${r.id}`} className="group min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-medium text-encre group-hover:text-ispt-600">
                      {r.libelle} · {r.niveau} {r.annee}
                      <ArrowRight aria-hidden className="size-3.5" />
                    </span>
                    <span className="mt-0.5 block text-sm text-pierre-600">
                      Moyenne {r.moyenne?.toLocaleString("fr-FR") ?? "—"}/20 · {r.creditsValides}/
                      {r.creditsTotal} crédits
                      {r.mention ? ` · ${r.mention}` : ""}
                    </span>
                  </Link>
                  {r.decision && (
                    <Etiquette ton={TON[r.decision] ?? "neutre"}>{r.decision}</Etiquette>
                  )}
                  {r.documentId && (
                    <a
                      href={`/documents/${r.documentId}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 text-sm text-ispt-600 underline hover:no-underline"
                    >
                      <FileBadge aria-hidden className="size-4" /> Bulletin
                      <span className="sr-only">
                        {" "}
                        : {r.libelle} {r.annee}
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
