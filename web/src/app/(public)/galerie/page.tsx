import type { Metadata } from "next";
import Link from "next/link";
import { EntetePage } from "@/components/public/entete-page";
import { Photo } from "@/components/public/photo";
import { TransitionPage } from "@/components/public/transition-page";
import { EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { lireAlbums } from "@/features/galerie/lecture";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "La vie de l'ISPT-Bukavu en images : collations, travaux pratiques, stages et événements.",
};

export default async function Galerie() {
  const albums = await lireAlbums();
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Galerie" }]}
        surtitre="Galerie"
        titre="L'institut en images"
        intro="Cérémonies, ateliers, laboratoires et sorties de terrain, album par album."
      />
      <section className="conteneur py-14 lg:py-20">
        {albums.length === 0 ? (
          <EtatVide
            titre="Les premiers albums arrivent bientôt"
            description="L'institut publiera ici les photos de ses événements."
          />
        ) : (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => (
              <li key={a.slug} className="revele" style={{ "--i": i % 3 } as React.CSSProperties}>
                <Link href={`/galerie/${a.slug}`} className="group block">
                  <span className="zoom-survol relative block aspect-[4/3] overflow-hidden bg-pierre-100">
                    <Photo
                      image={a.couverture}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    />
                  </span>
                  <span className="mt-4 flex items-baseline justify-between gap-3">
                    <span className="font-serif text-2xl text-encre group-hover:text-ispt-700">
                      {a.titre}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-pierre-600">
                      {a.nombre} photo{a.nombre > 1 ? "s" : ""}
                    </span>
                  </span>
                  {a.date && (
                    <span className="mt-1 block text-sm text-pierre-600">
                      {formatJour.format(new Date(a.date))}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </TransitionPage>
  );
}
