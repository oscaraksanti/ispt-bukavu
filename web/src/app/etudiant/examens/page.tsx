import type { Metadata } from "next";
import { CalendrierEpreuves } from "@/components/examens/calendrier-epreuves";
import { exigerEtudiant } from "@/features/espaces/acces";
import { epreuvesDeLEtudiant } from "@/features/examens/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Examens" };

export default async function ExamensEtudiant() {
  const { profil } = await exigerEtudiant();
  const epreuves = await epreuvesDeLEtudiant(profil.inscriptions.map((i) => i.promotionId));
  return (
    <div>
      <h1 className="text-[2.25rem] leading-tight">Examens</h1>
      <p className="mt-2 max-w-2xl text-pierre-700">
        Vos épreuves, heures et salles. Toute modification vous est signalée par une notification.
      </p>
      <div className="mt-8">
        <CalendrierEpreuves epreuves={epreuves} lienAgenda="/etudiant/examens/agenda" />
      </div>
    </div>
  );
}
