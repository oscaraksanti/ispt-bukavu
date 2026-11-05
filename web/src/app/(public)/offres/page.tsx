import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { lecteur } from "@/features/contenu/lecteur";
import { lirePage } from "@/features/contenu/lecture";
import { lireOffres } from "@/features/offres/lecture";
import { TYPES_OFFRE } from "@/features/offres/regles";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Stages et emplois",
  description:
    "Offres de stage, d'emploi, de bourse et de formation relayées par l'ISPT-Bukavu pour ses étudiants et ses diplômés.",
};

export default async function Offres({ searchParams }: PageProps<"/offres">) {
  const entete = lecteur((await lirePage("offres")).entete);
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Stages et emplois" }]}
        surtitre="Insertion professionnelle"
        titre={entete.texte("titre") || "Stages et emplois"}
        intro={entete.texte("intro")}
        photo={entete.image("photo")}
        legende={entete.texte("legende")}
      />
      <Suspense fallback={<section className="conteneur min-h-[40vh] py-14" />}>
        <ListeOffres searchParams={searchParams} />
      </Suspense>
    </TransitionPage>
  );
}

async function ListeOffres({
  searchParams,
}: {
  searchParams: PageProps<"/offres">["searchParams"];
}) {
  const { type: t } = await searchParams;
  const type = typeof t === "string" && t in TYPES_OFFRE ? t : null;
  const toutes = await lireOffres();
  const offres = type ? toutes.filter((o) => o.type === type) : toutes;
  return (
    <section className="conteneur py-14 lg:py-20">
      {toutes.length > 0 && (
        <nav aria-label="Type d'offre" className="mb-8 flex flex-wrap gap-2">
          {[["", "Toutes"], ...Object.entries(TYPES_OFFRE)].map(([cle, libelle]) => (
            <Link
              key={cle}
              href={cle ? `/offres?type=${cle}` : "/offres"}
              aria-current={(type ?? "") === cle ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm",
                (type ?? "") === cle
                  ? "border-encre bg-encre text-white"
                  : "border-pierre-300 bg-white text-pierre-800 hover:border-encre",
              )}
            >
              {libelle}
            </Link>
          ))}
        </nav>
      )}
      {offres.length === 0 ? (
        <EtatVide
          titre="Aucune offre ouverte pour le moment"
          description="Les nouvelles offres sont aussi signalées aux étudiants dans leur espace."
        />
      ) : (
        <ul className="divide-y divide-pierre-200 border-y border-pierre-200">
          {offres.map((o) => (
            <li key={o.id}>
              <Link
                href={`/offres/${o.id}`}
                className="group flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:gap-8"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiquette ton="ispt">{TYPES_OFFRE[o.type]}</Etiquette>
                    {o.filieres.map((f) => (
                      <Etiquette key={f}>{f}</Etiquette>
                    ))}
                  </div>
                  <p className="mt-2 font-serif text-2xl text-encre group-hover:text-ispt-700">
                    {o.titre}
                  </p>
                  <p className="mt-1 text-pierre-700">{o.organisation}</p>
                </div>
                <div className="space-y-1 text-sm text-pierre-700 sm:w-56">
                  {o.lieu && (
                    <p className="flex items-center gap-2">
                      <MapPin aria-hidden className="size-4 text-pierre-500" /> {o.lieu}
                    </p>
                  )}
                  {o.dateLimite && (
                    <p className="flex items-center gap-2">
                      <CalendarClock aria-hidden className="size-4 text-pierre-500" /> Jusqu&apos;au{" "}
                      {formatJour.format(new Date(o.dateLimite))}
                    </p>
                  )}
                </div>
                <ArrowRight
                  aria-hidden
                  className="hidden size-5 text-pierre-400 transition-transform group-hover:translate-x-1 sm:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
