import type { ReactNode } from "react";
import { FilAriane, FiletCote } from "@/components/ui/elements";
import type { ImageResolue } from "@/features/medias/url";
import { Legende, Photo } from "./photo";
import { PhotoPartagee } from "./transition-page";

/** En-tête des pages intérieures du site public. */
export function EntetePage({
  ariane,
  surtitre,
  titre,
  intro,
  photo,
  legende,
  position,
  nomPhoto,
  enfants,
}: {
  ariane: { libelle: string; href?: string }[];
  surtitre: string;
  titre: ReactNode;
  intro?: ReactNode;
  photo?: ImageResolue | null;
  legende?: string;
  position?: string;
  /** Nom partagé avec la vignette de la page précédente, pour la transition. */
  nomPhoto?: string;
  enfants?: ReactNode;
}) {
  return (
    <section className="trame border-b border-pierre-200">
      <div className="conteneur grid gap-10 py-10 lg:grid-cols-12 lg:gap-8 lg:py-16">
        <div className={photo ? "lg:col-span-7" : "lg:col-span-9"}>
          <FilAriane elements={ariane} />
          <p className="surtitre entree mt-10 flex items-center gap-3">
            <FiletCote className="w-8" />
            {surtitre}
          </p>
          <h1
            className="entree-ligne ligne-masquee mt-5 text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[3.75rem]"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <span>{titre}</span>
          </h1>
          {intro && (
            <p
              className="entree mt-6 max-w-2xl text-lg leading-relaxed text-pierre-700"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {intro}
            </p>
          )}
          <div className="entree" style={{ "--i": 3 } as React.CSSProperties}>
            {enfants}
          </div>
        </div>
        {photo && (
          <figure className="entree-image relative self-end lg:col-span-5">
            <PhotoPartagee nom={nomPhoto}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                <Photo
                  image={photo}
                  sizes="(min-width: 1024px) 480px, 100vw"
                  style={{ objectPosition: position ?? "50% 50%" }}
                  prioritaire
                />
                <Legende>{legende}</Legende>
              </div>
            </PhotoPartagee>
          </figure>
        )}
      </div>
    </section>
  );
}

/** Bloc de contenu à deux colonnes : titre à gauche, contenu à droite. */
export function BlocPage({
  numero,
  titre,
  children,
  fond = "papier",
}: {
  numero: string;
  titre: string;
  children: ReactNode;
  fond?: "papier" | "blanc";
}) {
  return (
    <section className={fond === "blanc" ? "border-y border-pierre-200 bg-white" : ""}>
      <div className="conteneur grid gap-8 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <p className="revele surtitre">{numero}</p>
          <h2 className="revele-titre ligne-masquee mt-3 text-3xl lg:text-titre-page">
            <span>{titre}</span>
          </h2>
        </div>
        <div
          className="revele lg:col-span-7 lg:col-start-6"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
