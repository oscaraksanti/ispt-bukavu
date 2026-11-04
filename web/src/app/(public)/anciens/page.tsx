import { ArrowRight, Briefcase, ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { LienBouton } from "@/components/ui/bouton";
import { Liste, Saisie } from "@/components/ui/champs";
import { Encadre, EtatVide } from "@/components/ui/elements";
import { lireAnnuaire } from "@/features/anciens/lecture";
import { filtrerAnnuaire, parPromotionDeSortie } from "@/features/anciens/regles";
import { lireFilieres } from "@/features/contenu/lecture";

export const metadata: Metadata = {
  title: "Anciens",
  description:
    "Annuaire des diplômés de l'ISPT-Bukavu, inscrits volontairement : parcours, métiers et entreprises.",
};

export default function Anciens({ searchParams }: PageProps<"/anciens">) {
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Anciens" }]}
        surtitre="Anciens et insertion"
        titre="Nos diplômés, sur le terrain"
        intro="Les anciens de l'institut qui ont choisi de partager leur parcours : un réseau pour les étudiants d'aujourd'hui et pour les employeurs."
        enfants={
          <div className="mt-8 flex flex-wrap gap-3">
            <LienBouton href="/anciens/rejoindre">Rejoindre l&apos;annuaire</LienBouton>
            <LienBouton href="/offres" variante="contour">
              Stages et emplois
            </LienBouton>
          </div>
        }
      />
      <Suspense fallback={<section className="conteneur min-h-[40vh] py-14" />}>
        <Annuaire searchParams={searchParams} />
      </Suspense>
    </TransitionPage>
  );
}

async function Annuaire({ searchParams }: { searchParams: PageProps<"/anciens">["searchParams"] }) {
  const { q: qq, filiere: ff, retrait } = await searchParams;
  const q = typeof qq === "string" ? qq.slice(0, 80) : "";
  const filiere = typeof ff === "string" ? ff : "";
  const [tous, filieres] = await Promise.all([lireAnnuaire(), lireFilieres()]);
  const trouves = filtrerAnnuaire(tous, { q, filiere });
  return (
    <section className="conteneur py-14 lg:py-20">
      {retrait === "1" && (
        <div className="mb-8">
          <Encadre ton="succes" titre="Vous êtes retiré de l'annuaire">
            Votre fiche et vos informations ont été effacées.
          </Encadre>
        </div>
      )}
      {tous.length === 0 ? (
        <EtatVide
          titre="L'annuaire s'ouvre"
          description="Diplômé de l'institut ? Soyez parmi les premiers à y paraître."
          action={
            <Link href="/anciens/rejoindre" className="font-medium text-ispt-700 underline">
              Rejoindre l&apos;annuaire
            </Link>
          }
        />
      ) : (
        <>
          <form role="search" className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="q" className="sr-only">
              Rechercher un ancien
            </label>
            <Saisie
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Nom, métier, entreprise, ville"
              className="sm:max-w-sm"
            />
            <label htmlFor="filiere" className="sr-only">
              Filière
            </label>
            <Liste id="filiere" name="filiere" defaultValue={filiere} className="sm:w-64">
              <option value="">Toutes les filières</option>
              {filieres.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.nomCourt}
                </option>
              ))}
            </Liste>
            <button
              type="submit"
              className="h-11 rounded-xs bg-encre px-5 text-sm font-medium text-white hover:bg-ispt-700"
            >
              Rechercher
            </button>
          </form>
          <p className="mt-4 text-sm text-pierre-600" aria-live="polite">
            {trouves.length} ancien{trouves.length > 1 ? "s" : ""}
            {trouves.length !== tous.length ? ` sur ${tous.length}` : ""}
          </p>
          <div className="mt-8 space-y-12">
            {parPromotionDeSortie(trouves).map(([annee, liste]) => (
              <section key={annee} aria-labelledby={`sortie-${annee}`}>
                <h2 id={`sortie-${annee}`} className="flex items-baseline gap-3 text-3xl">
                  Promotion {annee}
                  <span className="font-mono text-sm text-pierre-600">{liste.length}</span>
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {liste.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-col rounded-md border border-pierre-200 bg-white p-5"
                    >
                      <p className="font-serif text-xl text-encre">{a.nom}</p>
                      {a.filiere && <p className="text-sm text-pierre-600">{a.filiere}</p>}
                      {(a.poste || a.employeur) && (
                        <p className="mt-3 flex gap-2 text-sm text-pierre-800">
                          <Briefcase aria-hidden className="mt-0.5 size-4 shrink-0 text-ispt-600" />
                          {[a.poste, a.employeur].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {a.ville && (
                        <p className="mt-1 flex gap-2 text-sm text-pierre-800">
                          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ispt-600" />
                          {a.ville}
                        </p>
                      )}
                      {a.parcours && (
                        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-pierre-700">
                          {a.parcours}
                        </p>
                      )}
                      {a.lien && (
                        <a
                          href={a.lien}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-ispt-700 underline hover:no-underline"
                        >
                          <ExternalLink aria-hidden className="size-4" /> Profil professionnel
                          <span className="sr-only"> de {a.nom}</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
      <div className="mt-16 flex flex-col gap-4 border-t border-pierre-200 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-pierre-700">
          Diplômé de l&apos;ISPT-Bukavu ? Votre parcours inspire les étudiants. L&apos;inscription
          est volontaire, vérifiée par l&apos;institut et retirable à tout moment.
        </p>
        <Link
          href="/anciens/rejoindre"
          className="inline-flex items-center gap-2 font-medium text-ispt-700 underline hover:no-underline"
        >
          Rejoindre l&apos;annuaire <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  );
}
