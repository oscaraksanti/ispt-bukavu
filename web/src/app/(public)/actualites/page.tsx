import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Agenda } from "@/components/public/agenda";
import { CarteActualite } from "@/components/public/carte-actualite";
import { EntetePage } from "@/components/public/entete-page";
import { EtatVide } from "@/components/ui/elements";
import { ACTUALITES_PAR_PAGE, lireActualites, lireAgenda } from "@/features/contenu/lecture";

export const metadata: Metadata = {
  title: "Actualités et agenda",
  description: "Vie de l'institut, annonces et prochains rendez-vous de l'ISPT-Bukavu.",
};

async function ListeActualites({ searchParams }: PageProps<"/actualites">) {
  const { page: p } = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof p === "string" ? p : "1", 10) || 1);
  return <Articles page={page} />;
}

async function Articles({ page }: { page: number }) {
  "use cache";
  cacheLife("max");
  const { actualites, total } = await lireActualites(page);
  const pages = Math.max(1, Math.ceil(total / ACTUALITES_PAR_PAGE));
  if (actualites.length === 0)
    return (
      <EtatVide
        titre="Aucune actualité publiée pour le moment"
        description="Les annonces et les nouvelles de l'institut paraîtront ici."
      />
    );
  return (
    <>
      <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {actualites.map((a, i) => (
          <CarteActualite key={a.slug} actualite={a} index={i % 3} />
        ))}
      </div>
      {pages > 1 && (
        <nav
          aria-label="Pagination des actualités"
          className="mt-14 flex items-center justify-between border-t border-pierre-200 pt-6 text-sm"
        >
          {page > 1 ? (
            <Link
              href={`/actualites?page=${page - 1}`}
              className="font-medium text-ispt-600 underline hover:no-underline"
            >
              Plus récentes
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-pierre-500">
            Page {page} sur {pages}
          </span>
          {page < pages ? (
            <Link
              href={`/actualites?page=${page + 1}`}
              className="font-medium text-ispt-600 underline hover:no-underline"
            >
              Plus anciennes
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

export default async function PageActualites(props: PageProps<"/actualites">) {
  const agenda = await lireAgenda();
  return (
    <>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Actualités" }]}
        surtitre="Actualités"
        titre="La vie de l'institut"
        intro="Annonces officielles, événements et nouvelles des filières."
      />
      <div className="conteneur grid gap-16 py-16 lg:grid-cols-12 lg:py-20">
        <section
          aria-labelledby="titre-articles"
          className={agenda.length ? "lg:col-span-8" : "lg:col-span-12"}
        >
          <h2 id="titre-articles" className="sr-only">
            Articles
          </h2>
          <Suspense fallback={<div className="min-h-96" />}>
            <ListeActualites {...props} />
          </Suspense>
        </section>
        {agenda.length > 0 && (
          <aside aria-labelledby="titre-agenda" className="lg:col-span-4">
            <p className="surtitre">Agenda</p>
            <h2 id="titre-agenda" className="mt-3 text-3xl">
              À venir
            </h2>
            <div className="mt-6">
              <Agenda evenements={agenda} />
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
