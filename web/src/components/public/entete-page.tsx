import type { ReactNode } from "react";
import { FilAriane, FiletCote } from "@/components/ui/elements";
import type { ImageResolue } from "@/features/medias/url";
import { Legende, Photo } from "./photo";

/** En-tête des pages intérieures du site public. */
export function EntetePage({
  ariane,
  surtitre,
  titre,
  intro,
  photo,
  legende,
  position,
  enfants,
}: {
  ariane: { libelle: string; href?: string }[];
  surtitre: string;
  titre: ReactNode;
  intro?: ReactNode;
  photo?: ImageResolue | null;
  legende?: string;
  position?: string;
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
            className="entree mt-5 text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[3.75rem]"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {titre}
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
          <figure className="entree-image relative aspect-[4/3] self-end overflow-hidden rounded-md lg:col-span-5">
            <Photo
              image={photo}
              sizes="(min-width: 1024px) 480px, 100vw"
              style={{ objectPosition: position ?? "50% 50%" }}
              prioritaire
            />
            <Legende>{legende}</Legende>
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
        <div className="revele lg:col-span-4">
          <p className="surtitre">{numero}</p>
          <h2 className="mt-3 text-3xl lg:text-[2.25rem]">{titre}</h2>
        </div>
        <div className="revele lg:col-span-7 lg:col-start-6">{children}</div>
      </div>
    </section>
  );
}
