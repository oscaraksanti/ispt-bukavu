import type { Metadata } from "next";
import { VueSemaine } from "@/components/horaires/vue-semaine";
import { exigerEnseignant } from "@/features/espaces/acces";
import { aujourdhuiBukavu, lundiDe } from "@/features/horaires/regles";
import { seancesDeLaSemaine } from "@/features/horaires/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Horaire" };

export default async function HoraireEnseignant({
  searchParams,
}: PageProps<"/enseignant/horaire">) {
  const { profil } = await exigerEnseignant();
  const { semaine } = await searchParams;
  const aujourdhui = aujourdhuiBukavu();
  const lundi = lundiDe(typeof semaine === "string" ? semaine : aujourdhui) ?? lundiDe(aujourdhui)!;
  const seances = await seancesDeLaSemaine(lundi, {
    enseignants: { some: { enseignantId: profil.id } },
  });
  return (
    <div>
      <h1 className="text-[2.25rem] leading-tight">Mon horaire</h1>
      <div className="mt-6">
        <VueSemaine
          lundi={lundi}
          aujourdhui={aujourdhui}
          seances={seances}
          base="/enseignant/horaire"
          avecPromotion
        />
      </div>
    </div>
  );
}
