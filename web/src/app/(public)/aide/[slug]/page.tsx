import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { LienBouton } from "@/components/ui/bouton";
import { GUIDES, guide } from "@/features/aide/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/aide/[slug]">): Promise<Metadata> {
  const g = guide((await params).slug);
  return g ? { title: g.titre, description: g.resume } : {};
}

export default function PageGuide({ params }: PageProps<"/aide/[slug]">) {
  return (
    <TransitionPage>
      <Suspense fallback={<div className="trame min-h-[50vh] border-b border-pierre-200" />}>
        <Contenu params={params} />
      </Suspense>
    </TransitionPage>
  );
}

async function Contenu({ params }: { params: PageProps<"/aide/[slug]">["params"] }) {
  const g = guide((await params).slug);
  if (!g) notFound();
  return (
    <>
      <EntetePage
        ariane={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Aide", href: "/aide" },
          { libelle: g.titre },
        ]}
        surtitre={g.pour}
        titre={g.titre}
        intro={g.resume}
      />
      <section className="conteneur grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
        <nav aria-label="Sommaire du guide" className="lg:col-span-3">
          <ol className="space-y-2 text-sm lg:sticky lg:top-24">
            {g.sections.map((s, i) => (
              <li key={s.titre}>
                <a href={`#section-${i + 1}`} className="text-pierre-700 hover:text-encre">
                  <span className="font-mono text-xs text-pierre-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>{" "}
                  {s.titre}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="space-y-12 lg:col-span-8 lg:col-start-5">
          {g.sections.map((s, i) => (
            <article key={s.titre} id={`section-${i + 1}`} className="scroll-mt-24">
              <h2 className="text-3xl">{s.titre}</h2>
              {s.texte && <p className="mt-4 text-lg leading-relaxed text-pierre-800">{s.texte}</p>}
              {s.etapes && (
                <ol className="mt-5 space-y-3">
                  {s.etapes.map((e, j) => (
                    <li key={j} className="flex gap-4">
                      <span
                        aria-hidden
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ispt-50 font-mono text-xs text-ispt-700"
                      >
                        {j + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed text-pierre-800">{e}</span>
                    </li>
                  ))}
                </ol>
              )}
              {s.conseil && (
                <p className="mt-5 flex gap-3 rounded-md border border-chantier/50 bg-chantier/10 p-4 text-sm text-pierre-800">
                  <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-attention" />
                  <span>{s.conseil}</span>
                </p>
              )}
            </article>
          ))}
          <div className="flex flex-wrap items-center gap-4 border-t border-pierre-200 pt-8">
            {g.espace && <LienBouton href={g.espace.href}>{g.espace.libelle}</LienBouton>}
            <Link href="/aide" className="text-sm text-ispt-700 underline hover:no-underline">
              Tous les guides
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
