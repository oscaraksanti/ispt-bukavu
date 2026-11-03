"use client";

import { Check, ImageOff, Search, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Saisie } from "@/components/ui/champs";
import type { MediaSelecteur } from "@/features/medias/requetes";
import { cn } from "@/lib/cn";

/** Choix d'une image dans la médiathèque, avec aperçu. */
export function SelecteurImage({
  id,
  libelle,
  valeur,
  medias,
  onChange,
}: {
  id: string;
  libelle: string;
  valeur: string | null;
  medias: MediaSelecteur[];
  onChange: (id: string | null) => void;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [recherche, setRecherche] = useState("");
  const choisie = medias.find((m) => m.id === valeur) ?? null;

  const filtrees = useMemo(() => {
    const r = recherche.trim().toLowerCase();
    if (!r) return medias;
    return medias.filter((m) => `${m.nom} ${m.alt} ${m.dossier}`.toLowerCase().includes(r));
  }, [medias, recherche]);

  function choisir(idMedia: string) {
    onChange(idMedia);
    dialogue.current?.close();
  }

  return (
    <div className="space-y-1.5">
      <p id={id} className="text-sm font-medium text-pierre-800">
        {libelle}
      </p>
      <div className="flex items-center gap-4 rounded-xs border border-pierre-300 bg-white p-2">
        <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xs bg-pierre-100">
          {choisie ? (
            <Image src={choisie.url} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <ImageOff aria-hidden className="absolute inset-0 m-auto size-5 text-pierre-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-pierre-900">
            {choisie ? choisie.nom : "Aucune image"}
          </p>
          {choisie && <p className="line-clamp-2 text-xs text-pierre-500">{choisie.alt}</p>}
          <div className="mt-2 flex gap-2">
            <Bouton
              type="button"
              variante="contour"
              taille="sm"
              aria-describedby={id}
              onClick={() => dialogue.current?.showModal()}
            >
              {choisie ? "Changer" : "Choisir"}
            </Bouton>
            {choisie && (
              <Bouton
                type="button"
                variante="fantome"
                taille="sm"
                aria-describedby={id}
                onClick={() => onChange(null)}
              >
                Retirer
              </Bouton>
            )}
          </div>
        </div>
      </div>

      <dialog
        ref={dialogue}
        aria-labelledby={`${id}-titre`}
        className="m-auto max-h-[85svh] w-[min(56rem,calc(100vw-2rem))] rounded-md border border-pierre-200 bg-papier p-0 shadow-2xl backdrop:bg-encre/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogue.current?.close();
        }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-pierre-200 bg-white px-5 py-4">
          <h2 id={`${id}-titre`} className="font-sans text-base font-semibold text-encre">
            Choisir une image
          </h2>
          <button
            type="button"
            onClick={() => dialogue.current?.close()}
            className="flex size-9 items-center justify-center rounded-xs text-pierre-600 hover:bg-pierre-100"
          >
            <X aria-hidden className="size-4" />
            <span className="sr-only">Fermer</span>
          </button>
        </div>
        <div className="border-b border-pierre-200 bg-white px-5 py-3">
          <label className="relative block">
            <span className="sr-only">Rechercher une image</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-pierre-500"
            />
            <Saisie
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom du fichier, description…"
              className="pl-9"
            />
          </label>
        </div>
        <div className="max-h-[60svh] overflow-y-auto p-5">
          {filtrees.length === 0 ? (
            <p className="py-10 text-center text-sm text-pierre-600">
              Aucune image ne correspond. Ajoutez des photos depuis la médiathèque.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtrees.map((m) => {
                const active = m.id === valeur;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => choisir(m.id)}
                      aria-pressed={active}
                      className={cn(
                        "group block w-full overflow-hidden rounded-xs border bg-white text-left transition-colors",
                        active
                          ? "border-ispt-600 ring-2 ring-ispt-600/30"
                          : "border-pierre-200 hover:border-pierre-400",
                      )}
                    >
                      <span className="relative block aspect-[4/3] bg-pierre-100">
                        <Image src={m.url} alt="" fill sizes="200px" className="object-cover" />
                        {active && (
                          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-ispt-600 text-white">
                            <Check aria-hidden className="size-3.5" />
                          </span>
                        )}
                      </span>
                      <span className="block truncate px-2 py-1.5 text-xs text-pierre-700">
                        {m.nom}
                      </span>
                      <span className="sr-only">{m.alt}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </dialog>
    </div>
  );
}
