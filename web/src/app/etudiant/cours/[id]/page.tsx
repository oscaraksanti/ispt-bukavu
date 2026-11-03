import { ExternalLink, FileText, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EtatVide } from "@/components/ui/elements";
import { exigerEtudiant } from "@/features/espaces/acces";
import { db } from "@/lib/db";

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
  const parChapitre = Map.groupBy(co.supports, (s) => s.chapitre ?? "Documents");
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/etudiant/cours" className="text-sm text-ispt-600 underline hover:no-underline">
        ← Mes cours
      </Link>
      <p className="mt-4 font-mono text-xs text-ispt-600">
        {co.cours.ue.code} · S{co.cours.ue.semestre} · {co.cours.credits} crédit(s) ·{" "}
        {co.cours.volumeHoraire} h
      </p>
      <h1 className="mt-2 text-[2.25rem] leading-tight">{co.cours.intitule}</h1>
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
                        <ExternalLink aria-hidden className="size-3.5 text-pierre-400" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
