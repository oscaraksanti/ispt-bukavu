"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { EtatFormulaire } from "@/lib/etat-formulaire";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";
import { cn } from "@/lib/cn";

/** Case modifiable de l'horaire : un clic ouvre le choix du cours et de la salle. */
export function CelluleHoraire({
  action,
  cours,
  coursActuel,
  salleActuelle,
  statut,
  libelle,
}: {
  action: (etat: EtatFormulaire, fd: FormData) => Promise<EtatFormulaire>;
  cours: { id: string; intitule: string }[];
  coursActuel: string | null;
  salleActuelle: string | null;
  statut: string | null;
  libelle: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, envoyer, enCours] = useActionState(action, ETAT_INITIAL);
  const panneau = useRef<HTMLDivElement>(null);
  const intitule = cours.find((c) => c.id === coursActuel)?.intitule;

  // Ferme le panneau après un enregistrement réussi (ajustement pendant le rendu).
  const [traite, setTraite] = useState<number | undefined>(undefined);
  if (etat.statut === "succes" && etat.horodatage !== traite) {
    setTraite(etat.horodatage);
    setOuvert(false);
  }

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (panneau.current && !panneau.current.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);

  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className={cn(
          "flex h-full min-h-14 w-full flex-col items-center justify-center px-2 py-1.5 text-center text-[0.8125rem] leading-snug transition-colors hover:bg-ispt-50 print:min-h-0",
          !intitule && "text-pierre-400",
          statut === "ANNULEE" && "line-through",
        )}
      >
        <span>
          {intitule ?? (
            <>
              <span aria-hidden className="print:hidden">
                +
              </span>
              <span className="sr-only">Aucun cours</span>
            </>
          )}
        </span>
        {salleActuelle && (
          <span className="mt-0.5 text-[0.6875rem] text-pierre-500">{salleActuelle}</span>
        )}
        <span className="sr-only">, {libelle}</span>
      </button>
      {ouvert && (
        <div
          ref={panneau}
          className="absolute top-full left-1/2 z-20 mt-1 w-64 -translate-x-1/2 rounded-md border border-pierre-200 bg-white p-3 text-left shadow-xl print:hidden"
        >
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(() => envoyer(fd));
            }}
          >
            <label className="block text-xs font-medium text-pierre-700">
              Cours
              <select
                name="coursOffertId"
                defaultValue={coursActuel ?? ""}
                className="mt-1 h-9 w-full rounded-xs border border-pierre-300 bg-white px-2 text-sm"
              >
                <option value="">— Pas de cours —</option>
                {cours.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.intitule}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-pierre-700">
              Salle
              <input
                name="salle"
                defaultValue={salleActuelle ?? ""}
                maxLength={60}
                className="mt-1 h-9 w-full rounded-xs border border-pierre-300 px-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="h-8 rounded-xs px-3 text-sm text-pierre-700 hover:bg-pierre-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={enCours}
                className="h-8 rounded-xs bg-ispt-600 px-3 text-sm font-medium text-white hover:bg-ispt-700 disabled:opacity-50"
              >
                {enCours ? "…" : "Enregistrer"}
              </button>
            </div>
            {etat.statut === "erreur" && <p className="text-xs text-erreur">{etat.message}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
