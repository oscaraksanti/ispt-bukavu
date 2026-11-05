import { MapPin } from "lucide-react";
import { formatHeure, formatJourCourt } from "@/features/actualites/dates";
import type { EvenementPublic } from "@/features/contenu/lecture";

/** Liste des prochains événements, datés à l'heure de Bukavu. */
export function Agenda({ evenements }: { evenements: EvenementPublic[] }) {
  return (
    <ol className="divide-y divide-pierre-200 border-y border-pierre-200">
      {evenements.map((e, i) => {
        const debut = new Date(e.debut);
        const [jour, mois] = formatJourCourt.format(debut).split(" ");
        return (
          <li
            key={e.id}
            className="revele flex gap-5 py-5"
            style={{ "--i": i } as React.CSSProperties}
          >
            <time
              dateTime={e.debut}
              className="flex w-14 shrink-0 flex-col items-center rounded-xs border border-pierre-300 bg-white py-2 leading-none"
            >
              <span className="font-serif text-2xl text-encre">{jour}</span>
              <span className="mt-1 font-mono text-legende text-pierre-600 uppercase">
                {mois?.replace(".", "")}
              </span>
            </time>
            <div className="min-w-0">
              <p className="font-serif text-xl leading-snug text-encre">{e.titre}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-pierre-600">
                <span>
                  {formatHeure.format(debut)}
                  {e.fin && ` – ${formatHeure.format(new Date(e.fin))}`}
                </span>
                {e.lieu && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden className="size-3.5" />
                    {e.lieu}
                  </span>
                )}
              </p>
              {e.description && (
                <p className="mt-2 text-corps leading-relaxed text-pierre-700">{e.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
