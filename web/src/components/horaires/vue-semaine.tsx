import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Etiquette } from "@/components/ui/elements";
import type { SeanceSemaine } from "@/features/horaires/requetes";
import {
  ajouterJours,
  JOURS,
  libelleJour,
  libelleSemaine,
  PLAGES,
} from "@/features/horaires/regles";
import { cn } from "@/lib/cn";

/** Horaire d'une semaine présenté jour par jour (lisible sur téléphone). */
export function VueSemaine({
  lundi,
  aujourdhui,
  seances,
  base,
  avecPromotion = false,
}: {
  lundi: string;
  aujourdhui: string;
  seances: SeanceSemaine[];
  base: string;
  avecPromotion?: boolean;
}) {
  const jours = JOURS.map((_, i) => ajouterJours(lundi, i));
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`${base}?semaine=${ajouterJours(lundi, -7)}`}
          className="inline-flex h-9 items-center gap-1 rounded-xs border border-pierre-300 bg-white px-3 text-sm hover:border-encre"
        >
          <ChevronLeft aria-hidden className="size-4" />{" "}
          <span className="sr-only sm:not-sr-only">Précédente</span>
        </Link>
        <p className="text-center font-medium text-encre">Semaine {libelleSemaine(lundi)}</p>
        <Link
          href={`${base}?semaine=${ajouterJours(lundi, 7)}`}
          className="inline-flex h-9 items-center gap-1 rounded-xs border border-pierre-300 bg-white px-3 text-sm hover:border-encre"
        >
          <span className="sr-only sm:not-sr-only">Suivante</span>{" "}
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      </div>
      <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {jours.map((jour) => {
          const duJour = seances.filter((s) => s.jour === jour);
          return (
            <li
              key={jour}
              className={cn(
                "rounded-md border bg-white",
                jour === aujourdhui ? "border-ispt-600 ring-1 ring-ispt-600" : "border-pierre-200",
              )}
            >
              <p className="border-b border-pierre-200 px-4 py-2.5 text-sm font-medium text-encre first-letter:uppercase">
                {libelleJour(jour)}
                {jour === aujourdhui && (
                  <span className="ml-2 text-xs font-normal text-ispt-600">Aujourd&apos;hui</span>
                )}
              </p>
              <ul className="divide-y divide-pierre-100">
                {PLAGES.map((p) => {
                  const s = duJour.filter((x) => x.plage === p.cle);
                  return (
                    <li key={p.cle} className="flex gap-3 px-4 py-3">
                      <span className="w-12 shrink-0 font-mono text-xs leading-6 text-pierre-500">
                        {p.libelle}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        {s.length === 0 && <p className="text-sm leading-6 text-pierre-400">—</p>}
                        {s.map((x) => (
                          <div key={x.id}>
                            <p
                              className={cn(
                                "text-sm text-encre",
                                x.statut === "ANNULEE" && "line-through",
                              )}
                            >
                              {x.cours}
                            </p>
                            <p className="flex flex-wrap items-center gap-x-2 text-xs text-pierre-600">
                              {avecPromotion && <span>{x.promotion}</span>}
                              {x.salle && (
                                <span className="inline-flex items-center gap-0.5">
                                  <MapPin aria-hidden className="size-3" /> {x.salle}
                                </span>
                              )}
                              {!avecPromotion && x.enseignants && <span>{x.enseignants}</span>}
                            </p>
                            {x.statut !== "PREVUE" && (
                              <p className="mt-1 flex items-center gap-2 text-xs">
                                <Etiquette ton={x.statut === "ANNULEE" ? "erreur" : "attention"}>
                                  {x.statut === "ANNULEE" ? "Annulé" : "Reporté"}
                                </Etiquette>
                                {x.remarque && (
                                  <span className="text-pierre-600">{x.remarque}</span>
                                )}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
