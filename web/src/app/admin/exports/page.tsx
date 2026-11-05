import { Download, FileSpreadsheet } from "lucide-react";
import type { Metadata } from "next";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { Encadre } from "@/components/ui/elements";
import { exigerPersonnel } from "@/features/auth/acces";
import { EXPORTS, type TypeExport } from "@/features/exports/requetes";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Exports" };

export default async function Exports({ searchParams }: PageProps<"/admin/exports">) {
  const u = await exigerPersonnel();
  const types = (Object.keys(EXPORTS) as TypeExport[]).filter((t) =>
    u.permissions.has(EXPORTS[t].permission),
  );
  const { annee: choisie } = await searchParams;
  const annees = await db.anneeAcademique.findMany({ orderBy: { debut: "desc" } });
  const annee = annees.find((a) => a.id === choisie) ?? annees.find((a) => a.courante) ?? annees[0];

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Exports" }]}
        titre="Exports"
        description="Tableaux prêts pour Excel ou pour les échanges avec le ministère. Chaque téléchargement est inscrit au journal d'activité."
      />
      {types.length === 0 ? (
        <p className="mt-8 text-pierre-600">Aucun export n&apos;est ouvert à votre rôle.</p>
      ) : (
        <>
          <form className="mt-8 flex flex-wrap items-end gap-3" method="get">
            <label className="text-sm font-medium text-encre" htmlFor="annee">
              Année académique
              <select
                id="annee"
                name="annee"
                defaultValue={annee?.id}
                className="mt-1.5 block h-10 min-w-48 rounded-xs border border-pierre-300 bg-white px-3 text-sm"
              >
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.libelle}
                    {a.courante ? " (en cours)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="h-10 rounded-xs border border-pierre-300 bg-white px-4 text-sm font-medium text-encre hover:border-encre"
            >
              Afficher
            </button>
          </form>

          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {types.map((t) => {
              const lien = (format: "xlsx" | "csv") =>
                `/admin/exports/${t}?${new URLSearchParams({ annee: annee?.id ?? "", format })}`;
              return (
                <li
                  key={t}
                  className="flex flex-col rounded-md border border-pierre-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet aria-hidden className="mt-0.5 size-5 shrink-0 text-ispt-600" />
                    <div>
                      <h2 className="font-sans text-base font-semibold text-encre">
                        {EXPORTS[t].titre}
                      </h2>
                      <p className="mt-1 text-sm text-pierre-600">{EXPORTS[t].description}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-pierre-100 pt-4">
                    <a
                      href={lien("xlsx")}
                      download
                      className="inline-flex h-10 items-center gap-2 rounded-xs bg-ispt-600 px-4 text-sm font-medium text-white hover:bg-ispt-700"
                    >
                      <Download aria-hidden className="size-4" />
                      Excel
                      <span className="sr-only"> : {EXPORTS[t].titre}</span>
                    </a>
                    <a
                      href={lien("csv")}
                      download
                      className="inline-flex h-10 items-center gap-2 rounded-xs border border-pierre-300 px-4 text-sm font-medium text-encre hover:border-encre"
                    >
                      CSV
                      <span className="sr-only"> : {EXPORTS[t].titre}</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>

          <Encadre className="mt-8" titre="Format du ministère (OptSolution)">
            Les colonnes suivent les rubriques usuelles des registres académiques. Dès que
            l&apos;institut transmet un modèle de fichier OptSolution, elles seront alignées
            exactement sur ce modèle.
          </Encadre>
        </>
      )}
    </>
  );
}
