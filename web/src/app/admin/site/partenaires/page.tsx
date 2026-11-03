import type { Metadata } from "next";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { exigerPermission } from "@/features/auth/acces";
import { enregistrerPartenaires } from "@/features/contenu/actions-collections";
import { CATEGORIES_PARTENAIRES, FORMULAIRE_PARTENAIRES } from "@/features/contenu/collections";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Partenaires" };

export default async function Partenaires() {
  await exigerPermission("contenu.modifier");
  const partenaires = await db.partenaire.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
  });
  const valeurs = Object.fromEntries(
    Object.keys(CATEGORIES_PARTENAIRES).map((categorie) => [
      categorie,
      partenaires.filter((p) => p.categorie === categorie).map((p) => ({ nom: p.nom })),
    ]),
  );
  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Partenaires" }]}
        titre="Partenaires"
        description="Lieux de stage et débouchés des diplômés, affichés sur l'accueil et la page Institut."
      />
      <Panneau className="mt-8">
        <EditeurBloc
          definition={FORMULAIRE_PARTENAIRES}
          valeursInitiales={valeurs}
          medias={[]}
          action={enregistrerPartenaires}
        />
      </Panneau>
    </>
  );
}
