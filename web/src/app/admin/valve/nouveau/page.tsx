import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireCommunique } from "@/components/valve/formulaire-communique";
import { exigerPersonnel } from "@/features/auth/acces";
import { enregistrerCommunique } from "@/features/valve/actions";
import { auteurValve } from "@/features/valve/donnees";
import { ciblesAutorisees } from "@/features/valve/regles";
import { optionsCibles } from "@/features/valve/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Nouveau communiqué" };

export default async function NouveauCommunique() {
  const u = await exigerPersonnel();
  const auteur = await auteurValve(u);
  const cibles = ciblesAutorisees(auteur);
  if (cibles.length === 0) redirect("/acces-refuse");
  const options = await optionsCibles(auteur);
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Valve", href: "/admin/valve" },
          { libelle: "Nouveau communiqué" },
        ]}
        titre="Nouveau communiqué"
        description="Après l'enregistrement, vous pourrez joindre des documents (PDF ou images)."
      />
      <Panneau className="mt-8">
        <FormulaireCommunique
          action={enregistrerCommunique.bind(null, null)}
          cibles={cibles}
          {...options}
          retour="admin"
          valeurs={{
            titre: "",
            contenu: "",
            cible: cibles.includes("INSTITUT") ? "INSTITUT" : cibles[0],
            filiereId: "",
            promotionId: "",
            coursOffertId: "",
            expireLe: "",
            epingle: false,
          }}
        />
      </Panneau>
    </>
  );
}
