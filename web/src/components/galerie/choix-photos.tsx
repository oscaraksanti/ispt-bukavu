"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Saisie } from "@/components/ui/champs";
import type { MediaSelecteur } from "@/features/medias/requetes";

/** Choix de plusieurs photos de la médiathèque (cases à cocher filtrables). */
export function ChoixPhotos({ medias, deja }: { medias: MediaSelecteur[]; deja: string[] }) {
  const [recherche, setRecherche] = useState("");
  const proposees = useMemo(() => {
    const r = recherche.trim().toLowerCase();
    return medias
      .filter((m) => !deja.includes(m.id))
      .filter((m) => !r || `${m.nom} ${m.alt} ${m.dossier}`.toLowerCase().includes(r));
  }, [medias, deja, recherche]);

  return (
    <div className="space-y-3">
      <label htmlFor="filtre-photos" className="sr-only">
        Filtrer les photos
      </label>
      <Saisie
        id="filtre-photos"
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Filtrer par nom, description ou dossier"
        className="h-10"
      />
      {proposees.length === 0 ? (
        <p className="text-sm text-pierre-600">
          Aucune autre photo dans la médiathèque. Téléversez-en depuis « Médiathèque ».
        </p>
      ) : (
        <fieldset>
          <legend className="sr-only">Photos de la médiathèque</legend>
          <ul className="grid max-h-[28rem] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-4 lg:grid-cols-6">
            {proposees.map((m) => (
              <li key={m.id}>
                <label className="group block cursor-pointer">
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-xs bg-pierre-100 ring-ispt-600 group-has-[:checked]:ring-2">
                    <Image src={m.url} alt="" fill sizes="160px" className="object-cover" />
                    <input
                      type="checkbox"
                      name="medias"
                      value={m.id}
                      className="absolute top-2 left-2 size-4 accent-ispt-600"
                      aria-label={m.alt || m.nom}
                    />
                  </span>
                  <span className="mt-1 block truncate text-xs text-pierre-600">
                    {m.alt || m.nom}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </div>
  );
}
