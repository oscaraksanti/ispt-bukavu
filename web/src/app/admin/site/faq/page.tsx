import type { Metadata } from "next";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { enregistrerFaq } from "@/features/actualites/actions";
import { FORMULAIRE_FAQ } from "@/features/actualites/definitions";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Questions fréquentes" };

export default async function Faq() {
  await exigerPermission("contenu.modifier");
  const questions = await db.questionFrequente.findMany({
    where: { rubrique: "admissions" },
    orderBy: { ordre: "asc" },
  });
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Questions fréquentes" },
        ]}
        titre="Questions fréquentes"
        description="Affichées en bas de la page Admissions dès qu'au moins une question est enregistrée. Reprenez les questions réellement posées au secrétariat."
      />
      <Panneau className="mt-8">
        <EditeurBloc
          definition={FORMULAIRE_FAQ}
          valeursInitiales={{
            questions: questions.map(({ question, reponse }) => ({ question, reponse })),
          }}
          medias={[]}
          action={enregistrerFaq}
        />
      </Panneau>
    </>
  );
}
