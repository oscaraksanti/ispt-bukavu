import type { Metadata } from "next";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { exigerPermission } from "@/features/auth/acces";
import { enregistrerFiliere } from "@/features/contenu/actions-collections";
import { FORMULAIRE_FILIERE } from "@/features/contenu/collections";
import { mediasPourSelecteur } from "@/features/medias/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Nouvelle filière" };

export default async function NouvelleFiliere() {
  await exigerPermission("contenu.modifier");
  const medias = await mediasPourSelecteur();
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Filières", href: "/admin/site/filieres" },
          { libelle: "Nouvelle" },
        ]}
        titre="Nouvelle filière"
        description="La filière est créée masquée ; publiez-la depuis la liste une fois la fiche complète."
      />
      <Panneau className="mt-8" titre={FORMULAIRE_FILIERE.titre}>
        <EditeurBloc
          definition={FORMULAIRE_FILIERE}
          valeursInitiales={{
            nom: "",
            nomCourt: "",
            slug: "",
            photo: null,
            accroche: "",
            presentation: "",
            domaines: [{ libelle: "" }],
            metiers: [{ libelle: "" }],
            debouches: "",
            entreprendre: "",
          }}
          medias={medias}
          action={enregistrerFiliere.bind(null, null)}
          libelleEnvoi="Créer la filière"
        />
      </Panneau>
    </>
  );
}
