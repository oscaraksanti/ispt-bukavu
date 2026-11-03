import type { Metadata } from "next";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { ListeCommuniques } from "@/components/valve/liste-communiques";
import { lireValvePublique } from "@/features/valve/publique";

export const metadata: Metadata = {
  title: "Valve",
  description: "Communiqués officiels de l'ISPT-Bukavu adressés au public.",
};

export default async function ValvePublique() {
  const communiques = await lireValvePublique();
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Valve" }]}
        surtitre="Valve numérique"
        titre="Communiqués officiels"
        intro="Annonces de l'institut adressées au public. Les étudiants retrouvent dans leur espace les communiqués de leur filière, de leur promotion et de leurs cours."
      />
      <section className="conteneur max-w-4xl py-14 lg:py-20">
        <div className="revele">
          <ListeCommuniques
            communiques={communiques}
            base="/valve"
            vide="Aucun communiqué public pour le moment."
          />
        </div>
      </section>
    </TransitionPage>
  );
}
