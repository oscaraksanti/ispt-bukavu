"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { ImageResolue } from "@/features/medias/url";

type Photo = ImageResolue & { legende: string | null };

/**
 * Mosaïque de photos et visionneuse plein écran (élément <dialog> natif :
 * focus piégé, Échap pour fermer). Flèches du clavier pour naviguer.
 */
export function Visionneuse({ photos, titre }: { photos: Photo[]; titre: string }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const photo = photos[index];
  const aller = (i: number) => setIndex((i + photos.length) % photos.length);
  const ouvrir = (i: number) => {
    setIndex(i);
    dialogue.current?.showModal();
  };

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
        {photos.map((p, i) => (
          <li key={p.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => ouvrir(i)}
              className="group relative block w-full overflow-hidden rounded-xs bg-pierre-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ispt-600"
              style={{
                aspectRatio: p.largeur && p.hauteur ? `${p.largeur} / ${p.hauteur}` : "4 / 3",
              }}
            >
              <Image
                src={p.url}
                alt={p.alt}
                fill
                sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              />
              <span className="sr-only">
                Agrandir la photo {i + 1} sur {photos.length}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogue}
        aria-label={`${titre} : photo ${index + 1} sur ${photos.length}`}
        className="visionneuse m-0 h-dvh max-h-none w-screen max-w-none bg-encre/95 p-0 text-white backdrop:bg-encre/80"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") aller(index + 1);
          if (e.key === "ArrowLeft") aller(index - 1);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogue.current?.close();
        }}
      >
        {photo && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3 font-mono text-xs tracking-wide text-white/75">
              <p aria-live="polite">
                {index + 1} / {photos.length}
              </p>
              <button
                type="button"
                onClick={() => dialogue.current?.close()}
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10"
              >
                <X aria-hidden className="size-5" />
                <span className="sr-only">Fermer</span>
              </button>
            </div>
            <figure className="relative mx-4 flex-1">
              <Image
                key={photo.id}
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="100vw"
                className="visionneuse-image object-contain"
              />
            </figure>
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <button
                type="button"
                onClick={() => aller(index - 1)}
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 hover:bg-white/10"
              >
                <ChevronLeft aria-hidden className="size-5" />
                <span className="sr-only">Photo précédente</span>
              </button>
              <p className="max-w-2xl text-center text-sm text-white/85">
                {photo.legende || photo.alt}
              </p>
              <button
                type="button"
                onClick={() => aller(index + 1)}
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 hover:bg-white/10"
              >
                <ChevronRight aria-hidden className="size-5" />
                <span className="sr-only">Photo suivante</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
