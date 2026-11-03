import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlocPage, EntetePage } from "@/components/public/entete-page";
import { lienCandidature } from "@/components/public/navigation";
import { LienBouton } from "@/components/ui/bouton";
import { lireFilieres, lireInstitut, lirePage } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";

export async function generateStaticParams() {
  return (await lireFilieres()).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/formations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const filiere = (await lireFilieres()).find((f) => f.slug === slug);
  if (!filiere) return {};
  return { title: filiere.nom, description: filiere.presentation };
}

export default function PageFiliere({ params }: PageProps<"/formations/[slug]">) {
  return (
    <Suspense fallback={<div className="trame min-h-[60vh] border-b border-pierre-200" />}>
      <ContenuFiliere params={params} />
    </Suspense>
  );
}

async function ContenuFiliere({ params }: { params: PageProps<"/formations/[slug]">["params"] }) {
  const { slug } = await params;
  return <FicheFiliere slug={slug} />;
}

async function FicheFiliere({ slug }: { slug: string }) {
  "use cache";
  cacheLife("max");
  const [filieres, institut, pageInstitut] = await Promise.all([
    lireFilieres(),
    lireInstitut(),
    lirePage("institut"),
  ]);
  const stages = lecteur(pageInstitut.stages);
  const filiere = filieres.find((f) => f.slug === slug);
  if (!filiere) notFound();
  const autres = filieres.filter((f) => f.slug !== slug);

  return (
    <>
      <EntetePage
        ariane={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Formations", href: "/formations" },
          { libelle: filiere.nomCourt },
        ]}
        surtitre={`${institut.diplome} · ${institut.semestres} semestres`}
        titre={filiere.nom}
        intro={filiere.presentation}
        photo={filiere.photo}
        legende={filiere.nomCourt}
        enfants={
          <div className="mt-8 flex flex-wrap gap-3">
            <LienBouton href={lienCandidature}>Candidater</LienBouton>
            <LienBouton href="/admissions" variante="contour">
              Conditions d&apos;admission
            </LienBouton>
          </div>
        }
      />

      <BlocPage numero="01" titre="Ce que l'on apprend">
        <ul className="grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
          {filiere.domaines.map((d, i) => (
            <li key={d} className="flex items-baseline gap-4 bg-papier px-5 py-4">
              <span className="font-mono text-xs text-pierre-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-pierre-900">{d}</span>
            </li>
          ))}
        </ul>
      </BlocPage>

      <BlocPage numero="02" titre="Métiers visés" fond="blanc">
        <ul className="divide-y divide-pierre-200 border-y border-pierre-200">
          {filiere.metiers.map((m) => (
            <li key={m} className="py-3.5 font-serif text-xl text-encre">
              {m}
            </li>
          ))}
        </ul>
      </BlocPage>

      <BlocPage numero="03" titre="Débouchés">
        <div className="space-y-8">
          <div>
            <h3 className="font-sans text-base font-semibold text-encre">Secteurs d&apos;emploi</h3>
            <p className="mt-2 leading-relaxed text-pierre-700">{filiere.debouches}</p>
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-encre">Créer son activité</h3>
            <p className="mt-2 leading-relaxed text-pierre-700">{filiere.entreprendre}</p>
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-encre">Enseigner</h3>
            <p className="mt-2 leading-relaxed text-pierre-700">
              Comme toutes les filières de l&apos;institut, elle prépare aussi à l&apos;enseignement
              dans les humanités techniques, grâce au{" "}
              {stages.texte("titrePedagogique").toLowerCase()}.
            </p>
          </div>
        </div>
      </BlocPage>

      <section className="border-t border-pierre-200 bg-white">
        <div className="conteneur py-14">
          <p className="surtitre">Autres filières</p>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 md:grid-cols-3">
            {autres.map((f) => (
              <li key={f.slug} className="bg-white">
                <Link
                  href={`/formations/${f.slug}`}
                  className="block p-6 font-serif text-2xl text-encre hover:text-ispt-600"
                >
                  {f.nomCourt}
                  <span className="mt-2 block font-sans text-sm text-pierre-600">{f.accroche}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
