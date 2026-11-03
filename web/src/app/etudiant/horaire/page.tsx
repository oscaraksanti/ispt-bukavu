import type { Metadata } from "next";
import { VueSemaine } from "@/components/horaires/vue-semaine";
import { exigerEtudiant } from "@/features/espaces/acces";
import { aujourdhuiBukavu, lundiDe } from "@/features/horaires/regles";
import { seancesDeLaSemaine } from "@/features/horaires/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Horaire" };

export default async function HoraireEtudiant({ searchParams }: PageProps<"/etudiant/horaire">) {
  const { profil } = await exigerEtudiant();
  const { semaine } = await searchParams;
  const aujourdhui = aujourdhuiBukavu();
  const lundi = lundiDe(typeof semaine === "string" ? semaine : aujourdhui) ?? lundiDe(aujourdhui)!;
  const promotions = profil.inscriptions.map((i) => i.promotionId);
  const seances = await seancesDeLaSemaine(lundi, { promotionId: { in: promotions } });
  return (
    <div>
      <h1 className="text-[2.25rem] leading-tight">Horaire</h1>
      <div className="mt-6">
        <VueSemaine
          lundi={lundi}
          aujourdhui={aujourdhui}
          seances={seances}
          base="/etudiant/horaire"
        />
      </div>
    </div>
  );
}
