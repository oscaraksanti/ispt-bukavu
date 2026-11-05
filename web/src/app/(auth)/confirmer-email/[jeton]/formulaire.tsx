"use client";

import { useActionState } from "react";
import { Encadre } from "@/components/ui/elements";
import { BoutonEnvoi, envoyerSansEffacer } from "@/components/ui/formulaire";
import { confirmerEmail } from "@/features/admissions/actions-candidat";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";

/**
 * La confirmation se fait par un bouton, jamais à l'ouverture du lien : les
 * antivirus de messagerie qui visitent les liens ne la déclenchent donc pas.
 */
export function FormulaireConfirmation({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState(confirmerEmail, ETAT_INITIAL);
  return (
    <form action={action} onSubmit={envoyerSansEffacer(action)} className="space-y-5">
      {etat.statut === "erreur" && <Encadre ton="erreur">{etat.message}</Encadre>}
      <input type="hidden" name="jeton" value={jeton} />
      <BoutonEnvoi className="w-full" enCoursForce={enCours} enCours="Confirmation…">
        Confirmer mon adresse et ouvrir mon dossier
      </BoutonEnvoi>
    </form>
  );
}
