import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { GUIDES } from "@/features/aide/guides";

export const metadata: Metadata = {
  title: "Aide",
  description:
    "Guides d'utilisation de la plateforme de l'ISPT-Bukavu pour les étudiants, les enseignants, les candidats et l'administration.",
};

export default function Aide() {
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Aide" }]}
        surtitre="Centre d'aide"
        titre="Utiliser la plateforme"
        intro="Un guide court pour chaque profil : premiers pas, écrans utiles et démarches courantes."
      />
      <section className="conteneur py-14 lg:py-20">
        <ul className="grid gap-5 md:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/aide/${g.slug}`}
                className="group flex h-full flex-col rounded-md border border-pierre-200 bg-white p-6 transition-colors hover:border-encre"
              >
                <span className="surtitre">{g.pour}</span>
                <span className="mt-3 font-serif text-2xl text-encre">{g.titre}</span>
                <span className="mt-2 flex-1 text-pierre-700">{g.resume}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ispt-700">
                  Lire le guide
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </TransitionPage>
  );
}
