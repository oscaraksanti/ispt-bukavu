import type { Metadata } from "next";
import { EtatVide } from "@/components/ui/elements";
import { FormulaireCommunique } from "@/components/valve/formulaire-communique";
import { exigerEnseignant } from "@/features/espaces/acces";
import { enregistrerCommunique } from "@/features/valve/actions";
import { auteurValve } from "@/features/valve/donnees";
import { ciblesAutorisees } from "@/features/valve/regles";
import { optionsCibles } from "@/features/valve/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Nouveau communiqué" };

export default async function NouveauCommuniqueEnseignant() {
  const { u } = await exigerEnseignant();
  const auteur = await auteurValve(u);
  const cibles = ciblesAutorisees(auteur);
  const options = await optionsCibles(auteur);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-titre-page leading-tight">Nouveau communiqué</h1>
      <div className="mt-8 rounded-md border border-pierre-200 bg-white p-6">
        {cibles.length === 0 ? (
          <EtatVide
            titre="Aucun cours confié"
            description="Vous pourrez écrire à vos étudiants dès qu'un cours vous sera affecté."
          />
        ) : (
          <FormulaireCommunique
            action={enregistrerCommunique.bind(null, null)}
            cibles={cibles}
            {...options}
            retour="enseignant"
            valeurs={{
              titre: "",
              contenu: "",
              cible: "COURS",
              filiereId: "",
              promotionId: "",
              coursOffertId: options.cours[0]?.id ?? "",
              expireLe: "",
              epingle: false,
            }}
          />
        )}
      </div>
    </div>
  );
}
