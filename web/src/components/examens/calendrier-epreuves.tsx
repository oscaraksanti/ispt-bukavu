import { CalendarPlus, Clock, MapPin } from "lucide-react";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure } from "@/features/actualites/dates";
import {
  libelleSalle,
  MODALITES,
  modifieeApresPublication,
  parJour,
} from "@/features/examens/regles";
import type { epreuvesDeLEtudiant } from "@/features/examens/requetes";
import { aujourdhuiBukavu, libelleJour } from "@/features/horaires/regles";
import { cn, majuscule } from "@/lib/cn";

type Epreuve = Awaited<ReturnType<typeof epreuvesDeLEtudiant>>[number];

/**
 * Calendrier personnel des examens, jour par jour. Les épreuves passées sont
 * atténuées ; celles modifiées après la publication sont signalées.
 */
export function CalendrierEpreuves({
  epreuves,
  lienAgenda,
  avecPromotion = false,
  role = () => null,
}: {
  epreuves: Epreuve[];
  lienAgenda: string;
  avecPromotion?: boolean;
  role?: (e: Epreuve) => string | null;
}) {
  if (epreuves.length === 0)
    return (
      <EtatVide
        titre="Aucun examen publié"
        description="Le calendrier apparaîtra ici dès sa publication par le secrétariat. Vous serez prévenu par une notification."
      />
    );
  const aujourdhui = aujourdhuiBukavu();
  const sessions = [...new Map(epreuves.map((e) => [e.session.id, e.session])).values()];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-pierre-700">{sessions.map((s) => s.libelle).join(" · ")}</p>
        <a
          href={lienAgenda}
          className="inline-flex h-9 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm font-medium text-encre hover:border-encre"
        >
          <CalendarPlus aria-hidden className="size-4" /> Ajouter à mon agenda
        </a>
      </div>
      {sessions
        .filter((s) => s.consignes)
        .map((s) => (
          <div key={s.id} className="rounded-md border border-chantier/50 bg-chantier/10 p-4">
            <p className="text-sm font-semibold text-encre">Consignes · {s.libelle}</p>
            <p className="mt-1 text-sm whitespace-pre-line text-pierre-800">{s.consignes}</p>
          </div>
        ))}
      {parJour(epreuves).map(({ jour, epreuves: liste }) => {
        const passe = jour < aujourdhui;
        return (
          <section
            key={jour}
            aria-labelledby={`jour-${jour}`}
            className={cn(passe && "opacity-70")}
          >
            <h2
              id={`jour-${jour}`}
              className="flex items-center gap-3 font-sans text-sm font-semibold text-encre"
            >
              {majuscule(libelleJour(jour))}
              {jour === aujourdhui && <Etiquette ton="chantier">Aujourd&apos;hui</Etiquette>}
            </h2>
            <ul className="mt-3 space-y-3">
              {liste.map((e) => {
                const r = role(e);
                return (
                  <li
                    key={e.id}
                    className="flex flex-col gap-3 rounded-md border border-pierre-200 bg-white p-4 sm:flex-row sm:items-center"
                  >
                    <p className="flex items-center gap-2 font-mono text-sm text-encre sm:w-36">
                      <Clock aria-hidden className="size-4 text-ispt-600" />
                      {formatHeure.format(e.debut)}–{formatHeure.format(e.fin)}
                    </p>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-pierre-900">{e.coursOffert.cours.intitule}</p>
                      <p className="text-sm text-pierre-600">
                        {avecPromotion && `${libellePromotion(e.coursOffert.promotion)} · `}
                        {MODALITES[e.modalite]}
                        {e.remarque ? ` · ${e.remarque}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r && <Etiquette ton="ispt">{r}</Etiquette>}
                      {modifieeApresPublication(e, e.session.publieeLe) && (
                        <Etiquette ton="attention">Modifiée</Etiquette>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-sm text-pierre-800">
                        <MapPin aria-hidden className="size-4 text-pierre-500" />
                        {libelleSalle(e.salle)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
