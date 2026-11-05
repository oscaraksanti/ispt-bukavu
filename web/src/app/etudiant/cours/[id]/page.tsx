import { ArrowUpRight, FileText, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Etiquette, EtatVide, LienRetour } from "@/components/ui/elements";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { etatRemise, LIBELLES_ETAT, type EtatRemise } from "@/features/devoirs/regles";
import { devoirsDeLEtudiant } from "@/features/devoirs/requetes";
import { exigerEtudiant } from "@/features/espaces/acces";
import { LIBELLES_PRESENCE, bilanPresences } from "@/features/presences/regles";
import { presencesEtudiant } from "@/features/presences/requetes";
import { db } from "@/lib/db";

const TON: Record<EtatRemise, "neutre" | "attention" | "ispt" | "succes" | "erreur"> = {
  a_rendre: "attention",
  rendu: "ispt",
  rendu_en_retard: "attention",
  corrige: "succes",
  non_rendu: "erreur",
};

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Cours" };

export default async function CoursDetailEtudiant({ params }: PageProps<"/etudiant/cours/[id]">) {
  const { profil } = await exigerEtudiant();
  const { id } = await params;
  const co = await db.coursOffert.findFirst({
    where: { id, promotionId: { in: profil.inscriptions.map((i) => i.promotionId) } },
    include: {
      cours: { include: { ue: true } },
      supports: { include: { media: true }, orderBy: [{ chapitre: "asc" }, { ordre: "asc" }] },
      enseignants: { include: { enseignant: { include: { utilisateur: true } } } },
    },
  });
  if (!co) notFound();
  const [devoirs, presences] = await Promise.all([
    devoirsDeLEtudiant(co.id, profil.id),
    presencesEtudiant(co.id, profil.id),
  ]);
  const bilan = bilanPresences(presences.map((p) => p.statut));
  const maintenant = new Date();
  const parChapitre = Map.groupBy(co.supports, (s) => s.chapitre ?? "Documents");
  return (
    <div className="mx-auto max-w-3xl">
      <LienRetour href="/etudiant/cours">Mes cours</LienRetour>
      <p className="mt-4 font-mono text-xs text-ispt-600">
        {co.cours.ue.code} · S{co.cours.ue.semestre} · {co.cours.credits} crédit(s) ·{" "}
        {co.cours.volumeHoraire} h
      </p>
      <h1 className="mt-2 text-titre-page leading-tight">{co.cours.intitule}</h1>
      <p className="mt-2 text-pierre-700">
        {co.enseignants
          .map((e) =>
            [e.enseignant.titre, e.enseignant.utilisateur.prenom, e.enseignant.utilisateur.nom]
              .filter(Boolean)
              .join(" "),
          )
          .join(", ") || "Enseignant à confirmer"}
      </p>
      <section className="mt-8">
        <h2 className="text-2xl">Supports</h2>
        {co.supports.length === 0 ? (
          <div className="mt-4">
            <EtatVide titre="Aucun support pour le moment" />
          </div>
        ) : (
          [...parChapitre.entries()].map(([chapitre, liste]) => (
            <div key={chapitre} className="mt-5">
              <h3 className="font-sans text-sm font-semibold text-pierre-600">{chapitre}</h3>
              <ul className="mt-2 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
                {liste.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.type === "LIEN" ? (s.url ?? "#") : `/supports/${s.id}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 px-4 py-3 text-ispt-700 hover:bg-pierre-50"
                    >
                      {s.type === "LIEN" ? (
                        <Link2 aria-hidden className="size-4" />
                      ) : (
                        <FileText aria-hidden className="size-4" />
                      )}
                      <span className="flex-1">{s.titre}</span>
                      {s.type === "LIEN" && (
                        <ArrowUpRight aria-hidden className="size-3.5 text-pierre-400" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="mt-10" aria-labelledby="titre-devoirs">
        <h2 id="titre-devoirs" className="text-2xl">
          Devoirs
        </h2>
        {devoirs.length === 0 ? (
          <div className="mt-4">
            <EtatVide titre="Aucun devoir pour le moment" />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
            {devoirs.map((d) => {
              const etat = etatRemise(d, d.remises[0] ?? null, maintenant);
              return (
                <li key={d.id}>
                  <Link
                    href={`/etudiant/cours/${co.id}/devoirs/${d.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-pierre-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-encre">{d.titre}</span>
                      <span className="text-sm text-pierre-600">
                        Pour le {formatJour.format(d.echeance)} à {formatHeure.format(d.echeance)}
                      </span>
                    </span>
                    <Etiquette ton={TON[etat]}>{LIBELLES_ETAT[etat]}</Etiquette>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="titre-assiduite">
        <h2 id="titre-assiduite" className="text-2xl">
          Assiduité
        </h2>
        {presences.length === 0 ? (
          <p className="mt-3 text-pierre-600">Aucun appel enregistré pour ce cours.</p>
        ) : (
          <>
            <p className="mt-3 text-pierre-700">
              {bilan.taux != null && (
                <>
                  <span className="font-mono text-2xl text-encre">{bilan.taux} %</span> de présence
                  ·{" "}
                </>
              )}
              {bilan.absents} absence(s){bilan.excuses ? `, ${bilan.excuses} excusée(s)` : ""}
              {bilan.retards ? `, ${bilan.retards} retard(s)` : ""} sur {bilan.seances} séance(s).
            </p>
            <ul className="mt-4 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white text-sm">
              {presences.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="first-letter:uppercase">
                    {formatJour.format(p.seance.debut)}
                  </span>
                  <span
                    className={
                      p.statut === "ABSENT" ? "font-medium text-erreur" : "text-pierre-700"
                    }
                  >
                    {LIBELLES_PRESENCE[p.statut]}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
