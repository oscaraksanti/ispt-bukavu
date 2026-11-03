import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CarteActualite } from "@/components/public/carte-actualite";
import { Photo } from "@/components/public/photo";
import { TexteArticle } from "@/components/public/texte-article";
import { FilAriane, LienFleche } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { tempsDeLecture } from "@/features/actualites/texte";
import { lireActualite, lireActualites } from "@/features/contenu/lecture";

export async function generateStaticParams() {
  const { actualites } = await lireActualites(1);
  // Au moins un paramètre est requis pour le rendu partiel ; les autres articles
  // sont rendus à la première visite puis mis en cache.
  return actualites.length
    ? actualites.map((a) => ({ slug: a.slug }))
    : [{ slug: "aucune-actualite" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/actualites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await lireActualite(slug);
  if (!a) return { title: "Actualité introuvable" };
  return {
    title: a.titre,
    description: a.resume,
    openGraph: {
      type: "article",
      title: a.titre,
      description: a.resume,
      publishedTime: a.publieLe,
      images: a.couverture ? [{ url: a.couverture.url, alt: a.couverture.alt }] : undefined,
    },
  };
}

export default function PageActualite({ params }: PageProps<"/actualites/[slug]">) {
  return (
    <Suspense fallback={<div className="trame min-h-[60vh] border-b border-pierre-200" />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: { params: PageProps<"/actualites/[slug]">["params"] }) {
  const { slug } = await params;
  return <Article slug={slug} />;
}

async function Article({ slug }: { slug: string }) {
  "use cache";
  cacheLife("max");
  const [a, { actualites }] = await Promise.all([lireActualite(slug), lireActualites(1)]);
  if (!a) notFound();
  const autres = actualites.filter((x) => x.slug !== slug).slice(0, 3);

  return (
    <>
      <article>
        <header className="trame border-b border-pierre-200">
          <div className="conteneur max-w-4xl py-10 lg:py-16">
            <FilAriane
              elements={[
                { libelle: "Accueil", href: "/" },
                { libelle: "Actualités", href: "/actualites" },
                { libelle: a.titre },
              ]}
            />
            <p className="surtitre entree mt-10">
              <time dateTime={a.publieLe}>{formatJour.format(new Date(a.publieLe))}</time>
              <span aria-hidden> · </span>
              {tempsDeLecture(a.contenu)} min de lecture
            </p>
            <h1
              className="entree mt-5 text-[2.25rem] leading-[1.08] sm:text-5xl"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {a.titre}
            </h1>
            <p
              className="entree mt-6 text-xl leading-relaxed text-pierre-700"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {a.resume}
            </p>
          </div>
        </header>
        {a.couverture && (
          <figure className="conteneur max-w-5xl pt-10">
            <div className="entree-image relative aspect-[16/9] overflow-hidden rounded-md">
              <Photo image={a.couverture} sizes="(min-width: 1024px) 1024px, 100vw" prioritaire />
            </div>
          </figure>
        )}
        <div className="conteneur max-w-3xl py-12 lg:py-16">
          <TexteArticle texte={a.contenu} />
          <div className="mt-12 border-t border-pierre-200 pt-6">
            <LienFleche href="/actualites">Toutes les actualités</LienFleche>
          </div>
        </div>
      </article>
      {autres.length > 0 && (
        <section aria-labelledby="autres" className="border-t border-pierre-200 bg-white">
          <div className="conteneur py-16">
            <h2 id="autres" className="text-3xl">
              À lire aussi
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {autres.map((x, i) => (
                <CarteActualite key={x.slug} actualite={x} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
