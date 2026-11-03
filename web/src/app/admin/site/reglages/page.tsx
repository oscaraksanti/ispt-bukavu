import type { Metadata } from "next";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { exigerPermission } from "@/features/auth/acces";
import { enregistrerReglages } from "@/features/contenu/actions";
import { fusionnerBloc } from "@/features/contenu/donnees";
import { REGLAGES_INSTITUT } from "@/features/contenu/reglages";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Identité et contacts" };

export default async function Reglages() {
  await exigerPermission("contenu.modifier");
  const reglage = await db.reglage.findUnique({ where: { cle: REGLAGES_INSTITUT.cle } });
  const valeurs = fusionnerBloc(REGLAGES_INSTITUT, reglage?.valeur ?? REGLAGES_INSTITUT.defaut);

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Identité et contacts" },
        ]}
        titre="Identité et contacts"
        description="Nom, mission, adresse, téléphones et email : ces informations apparaissent dans l'en-tête, le pied de page et les pages Institut, Admissions et Contact."
      />
      <Panneau className="mt-8" titre={REGLAGES_INSTITUT.titre}>
        <EditeurBloc
          definition={REGLAGES_INSTITUT}
          valeursInitiales={valeurs}
          medias={[]}
          action={enregistrerReglages}
        />
      </Panneau>
    </>
  );
}
