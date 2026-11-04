import type { Metadata } from "next";
import { FormulaireAncien } from "@/components/anciens/formulaire-ancien";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { lireFilieresAvecId } from "@/features/anciens/lecture";

export const metadata: Metadata = {
  title: "Rejoindre l'annuaire des anciens",
  description: "Diplômés de l'ISPT-Bukavu : partagez votre parcours dans l'annuaire des anciens.",
};

export default async function Rejoindre() {
  const filieres = await lireFilieresAvecId();
  return (
    <TransitionPage>
      <EntetePage
        ariane={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Anciens", href: "/anciens" },
          { libelle: "Rejoindre l'annuaire" },
        ]}
        surtitre="Anciens"
        titre="Rejoindre l'annuaire"
        intro="Votre fiche est publiée après vérification par l'institut. Vous recevez alors un lien personnel pour vous en retirer à tout moment."
      />
      <section className="conteneur max-w-3xl py-14 lg:py-20">
        <FormulaireAncien filieres={filieres} />
      </section>
    </TransitionPage>
  );
}
