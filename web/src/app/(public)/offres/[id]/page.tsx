import { CalendarClock, ArrowUpRight, Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EntetePage } from "@/components/public/entete-page";
import { TexteArticle } from "@/components/public/texte-article";
import { TransitionPage } from "@/components/public/transition-page";
import { Etiquette } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { lireOffre, lireOffres } from "@/features/offres/lecture";
import { TYPES_OFFRE } from "@/features/offres/regles";

export async function generateStaticParams() {
  const offres = await lireOffres();
  return offres.length ? offres.map((o) => ({ id: o.id })) : [{ id: "aucune" }];
}

export async function generateMetadata({ params }: PageProps<"/offres/[id]">): Promise<Metadata> {
  const o = await lireOffre((await params).id);
  return o ? { title: o.titre, description: `${TYPES_OFFRE[o.type]} · ${o.organisation}` } : {};
}

export default function PageOffre({ params }: PageProps<"/offres/[id]">) {
  return (
    <TransitionPage>
      <Suspense fallback={<div className="trame min-h-[50vh] border-b border-pierre-200" />}>
        <Contenu params={params} />
      </Suspense>
    </TransitionPage>
  );
}

async function Contenu({ params }: { params: PageProps<"/offres/[id]">["params"] }) {
  const o = await lireOffre((await params).id);
  if (!o) notFound();
  return (
    <>
      <EntetePage
        ariane={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Stages et emplois", href: "/offres" },
          { libelle: o.titre },
        ]}
        surtitre={`${TYPES_OFFRE[o.type]} · ${o.organisation}`}
        titre={o.titre}
      />
      <section className="conteneur grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <TexteArticle texte={o.description} />
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="space-y-4 rounded-md border border-pierre-200 bg-white p-6 lg:sticky lg:top-24">
            <p className="font-medium text-encre">{o.organisation}</p>
            {o.lieu && (
              <p className="flex items-center gap-2 text-sm text-pierre-800">
                <MapPin aria-hidden className="size-4 text-pierre-500" /> {o.lieu}
              </p>
            )}
            {o.dateLimite && (
              <p className="flex items-center gap-2 text-sm text-pierre-800">
                <CalendarClock aria-hidden className="size-4 text-pierre-500" /> Candidatures
                jusqu&apos;au {formatJour.format(new Date(o.dateLimite))}
              </p>
            )}
            {o.filieres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {o.filieres.map((f) => (
                  <Etiquette key={f}>{f}</Etiquette>
                ))}
              </div>
            )}
            <div className="space-y-2 border-t border-pierre-200 pt-4">
              {o.lienCandidature && (
                <a
                  href={o.lienCandidature}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex h-11 items-center justify-center gap-2 rounded-xs bg-chantier px-5 text-corps font-medium text-encre hover:bg-chantier-fonce"
                >
                  <ArrowUpRight aria-hidden className="size-4" /> Postuler en ligne
                </a>
              )}
              {o.emailCandidature && (
                <a
                  href={`mailto:${o.emailCandidature}?subject=${encodeURIComponent(`Candidature : ${o.titre}`)}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-xs border border-pierre-300 px-5 text-corps font-medium text-encre hover:border-encre"
                >
                  <Mail aria-hidden className="size-4" /> {o.emailCandidature}
                </a>
              )}
            </div>
            <p className="text-xs text-pierre-600">
              Offre relayée par l&apos;ISPT-Bukavu. Les candidatures sont adressées directement à
              l&apos;organisation.
            </p>
          </div>
          <p className="mt-6">
            <Link href="/offres" className="text-sm text-ispt-700 underline hover:no-underline">
              Toutes les offres
            </Link>
          </p>
        </aside>
      </section>
    </>
  );
}
