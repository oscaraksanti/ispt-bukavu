import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireRetrait } from "@/components/anciens/formulaire-retrait";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";

/** Coquille prérendue ; le jeton réel n'est lu qu'à la soumission du formulaire. */
export function generateStaticParams() {
  return [{ jeton: "exemple" }];
}

export const metadata: Metadata = {
  title: "Se retirer de l'annuaire",
  robots: { index: false },
};

async function Formulaire({ params }: { params: PageProps<"/anciens/retrait/[jeton]">["params"] }) {
  const { jeton } = await params;
  return <FormulaireRetrait jeton={jeton} />;
}

export default function Retrait({ params }: PageProps<"/anciens/retrait/[jeton]">) {
  return (
    <TransitionPage>
      <EntetePage
        ariane={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Anciens", href: "/anciens" },
          { libelle: "Retrait" },
        ]}
        surtitre="Anciens"
        titre="Se retirer de l'annuaire"
        intro="Votre fiche sera effacée immédiatement, avec toutes les informations transmises."
      />
      <section className="conteneur max-w-xl py-14">
        <Suspense>
          <Formulaire params={params} />
        </Suspense>
      </section>
    </TransitionPage>
  );
}
