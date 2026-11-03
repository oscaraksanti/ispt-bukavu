import Link from "next/link";
import { formatJour } from "@/features/actualites/dates";
import type { ActualiteResume } from "@/features/contenu/lecture";
import { Photo } from "./photo";
import { PhotoPartagee } from "./transition-page";

export function CarteActualite({
  actualite,
  index = 0,
  sizes = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw",
}: {
  actualite: ActualiteResume;
  index?: number;
  sizes?: string;
}) {
  return (
    <article
      className="revele group relative flex h-full flex-col"
      style={{ "--i": index } as React.CSSProperties}
    >
      <PhotoPartagee nom={`actualite-${actualite.slug}`}>
        <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-pierre-100">
          <Photo image={actualite.couverture} sizes={sizes} className="zoom-survol" />
        </div>
      </PhotoPartagee>
      <time
        dateTime={actualite.publieLe}
        className="mt-5 font-mono text-xs text-pierre-500 uppercase"
      >
        {formatJour.format(new Date(actualite.publieLe))}
      </time>
      <h3 className="mt-2 text-2xl leading-snug">
        <Link
          href={`/actualites/${actualite.slug}`}
          className="group-hover:text-ispt-600 after:absolute after:inset-0"
        >
          {actualite.titre}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-pierre-600">
        {actualite.resume}
      </p>
    </article>
  );
}
