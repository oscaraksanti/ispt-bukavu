import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Visionneuse } from "@/components/galerie/visionneuse";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { formatJour } from "@/features/actualites/dates";
import { lireAlbum, lireAlbums } from "@/features/galerie/lecture";

export async function generateStaticParams() {
  const albums = await lireAlbums();
  // Au moins un paramètre : le prérendu exige une valeur, même sans album publié.
  return albums.length ? albums.map((a) => ({ slug: a.slug })) : [{ slug: "aucun" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/galerie/[slug]">): Promise<Metadata> {
  const album = await lireAlbum((await params).slug);
  return album
    ? { title: album.titre, description: album.description ?? `Album photo : ${album.titre}.` }
    : {};
}

export default function PageAlbum({ params }: PageProps<"/galerie/[slug]">) {
  return (
    <TransitionPage>
      <Suspense fallback={<div className="trame min-h-[50vh] border-b border-pierre-200" />}>
        <Contenu params={params} />
      </Suspense>
    </TransitionPage>
  );
}

async function Contenu({ params }: { params: PageProps<"/galerie/[slug]">["params"] }) {
  const album = await lireAlbum((await params).slug);
  if (!album) notFound();
  return (
    <>
      <EntetePage
        ariane={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Galerie", href: "/galerie" },
          { libelle: album.titre },
        ]}
        surtitre={`${album.nombre} photo${album.nombre > 1 ? "s" : ""}${album.date ? ` · ${formatJour.format(new Date(album.date))}` : ""}`}
        titre={album.titre}
        intro={album.description ?? undefined}
      />
      <section className="conteneur py-12 lg:py-16">
        <Visionneuse photos={album.photos} titre={album.titre} />
        <p className="mt-10">
          <Link href="/galerie" className="text-sm text-ispt-700 underline hover:no-underline">
            Tous les albums
          </Link>
        </p>
      </section>
    </>
  );
}
