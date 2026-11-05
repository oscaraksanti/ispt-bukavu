import type { Metadata } from "next";
import { CalendrierEpreuves } from "@/components/examens/calendrier-epreuves";
import { exigerEnseignant } from "@/features/espaces/acces";
import { epreuvesDeLEnseignant } from "@/features/examens/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Examens" };

export default async function ExamensEnseignant() {
  const { profil } = await exigerEnseignant();
  const epreuves = await epreuvesDeLEnseignant(profil.id);
  return (
    <div>
      <h1 className="text-titre-page leading-tight">Examens</h1>
      <p className="mt-2 max-w-2xl text-pierre-700">
        Les épreuves de vos cours et celles que vous surveillez.
      </p>
      <div className="mt-8">
        <CalendrierEpreuves
          epreuves={epreuves}
          lienAgenda="/enseignant/examens/agenda"
          avecPromotion
          role={(e) => {
            const donne = e.coursOffert.enseignants.some((c) => c.enseignantId === profil.id);
            const surveille = e.surveillants.some((s) => s.enseignantId === profil.id);
            return donne && surveille
              ? "Mon cours · surveillance"
              : donne
                ? "Mon cours"
                : "Surveillance";
          }}
        />
      </div>
    </div>
  );
}
