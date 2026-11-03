import type { Metadata } from "next";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { exigerPermission } from "@/features/auth/acces";
import { enregistrerAutorites } from "@/features/contenu/actions-collections";
import { FORMULAIRE_AUTORITES } from "@/features/contenu/collections";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Autorités" };

export default async function Autorites() {
  await exigerPermission("contenu.modifier");
  const autorites = await db.autorite.findMany({ orderBy: { ordre: "asc" } });
  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Autorités" }]}
        titre="Autorités académiques"
        description="Affichées sur l'accueil et la page Institut, dans l'ordre ci-dessous. À mettre à jour à chaque nomination."
      />
      <Panneau className="mt-8">
        <EditeurBloc
          definition={FORMULAIRE_AUTORITES}
          valeursInitiales={{
            autorites: autorites.map(({ fonction, nom }) => ({ fonction, nom })),
          }}
          medias={[]}
          action={enregistrerAutorites}
        />
      </Panneau>
    </>
  );
}
