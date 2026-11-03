import type { Metadata } from "next";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { enregistrerActualite } from "@/features/actualites/actions";
import { FORMULAIRE_ACTUALITE } from "@/features/actualites/definitions";
import { exigerPermission } from "@/features/auth/acces";
import { mediasPourSelecteur } from "@/features/medias/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Nouvel article" };

export default async function NouvelArticle() {
  await exigerPermission("actualites.gerer");
  const medias = await mediasPourSelecteur();
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Actualités", href: "/admin/actualites" },
          { libelle: "Nouvel article" },
        ]}
        titre="Nouvel article"
        description="L'article est enregistré en brouillon ; vous le publierez après relecture."
      />
      <Panneau className="mt-8">
        <EditeurBloc
          definition={FORMULAIRE_ACTUALITE}
          valeursInitiales={{ titre: "", slug: "", couverture: null, resume: "", contenu: "" }}
          medias={medias}
          action={enregistrerActualite.bind(null, null)}
          libelleEnvoi="Enregistrer le brouillon"
        />
      </Panneau>
    </>
  );
}
