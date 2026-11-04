import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { exigerPermission } from "@/features/auth/acces";
import {
  LIBELLES_EVALUATION,
  type StatutEvaluation,
  TYPES_EVALUATION,
} from "@/features/notes/regles";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Notes" };

const VUES: { cle: StatutEvaluation; libelle: string }[] = [
  { cle: "SOUMISE", libelle: "À valider" },
  { cle: "VALIDEE", libelle: "À publier" },
  { cle: "PUBLIEE", libelle: "Publiées" },
  { cle: "BROUILLON", libelle: "En saisie" },
];

export default async function Notes({ searchParams }: PageProps<"/admin/notes">) {
  await exigerPermission("academique.notes.valider");
  const { vue: v } = await searchParams;
  const vue = VUES.find((x) => x.cle === v)?.cle ?? "SOUMISE";
  const [evaluations, comptes] = await Promise.all([
    db.evaluation.findMany({
      where: { statut: vue, coursOffert: { promotion: { annee: { courante: true } } } },
      include: {
        coursOffert: {
          include: {
            cours: true,
            promotion: { include: { filiere: true, niveau: true } },
            enseignants: { include: { enseignant: { include: { utilisateur: true } } } },
          },
        },
        _count: { select: { notes: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
    db.evaluation.groupBy({
      by: ["statut"],
      where: { coursOffert: { promotion: { annee: { courante: true } } } },
      _count: true,
    }),
  ]);
  const compte = (s: StatutEvaluation) => comptes.find((c) => c.statut === s)?._count ?? 0;

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Notes" }]}
        titre="Notes"
        description="Les enseignants saisissent et transmettent leurs notes ; le secrétariat académique les relit, les valide puis les publie aux étudiants."
      />
      <nav aria-label="État des évaluations" className="mt-8 flex flex-wrap gap-2">
        {VUES.map((x) => (
          <Link
            key={x.cle}
            href={`/admin/notes?vue=${x.cle}`}
            aria-current={x.cle === vue ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              x.cle === vue
                ? "border-encre bg-encre text-white"
                : "border-pierre-300 bg-white text-pierre-700 hover:border-encre",
            )}
          >
            {x.libelle} <span className="font-mono text-xs opacity-85">{compte(x.cle)}</span>
          </Link>
        ))}
      </nav>
      {evaluations.length === 0 ? (
        <div className="mt-6">
          <EtatVide titre="Aucune évaluation dans cet état" />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
          {evaluations.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/notes/${e.id}`}
                className="flex flex-col gap-1 px-5 py-4 hover:bg-pierre-50 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-encre">
                    {e.coursOffert.cours.intitule} · {e.intitule}
                  </p>
                  <p className="text-sm text-pierre-600">
                    {libellePromotion(e.coursOffert.promotion)} · {TYPES_EVALUATION[e.type]} ·{" "}
                    {Number(e.ponderation)} % ·{" "}
                    {e.coursOffert.enseignants.map((x) => x.enseignant.utilisateur.nom).join(", ")}
                  </p>
                </div>
                <span className="text-sm text-pierre-600">{e._count.notes} note(s)</span>
                <Etiquette ton="ispt">{LIBELLES_EVALUATION[e.statut]}</Etiquette>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
