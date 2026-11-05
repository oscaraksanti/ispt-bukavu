"use client";

import { useActionState } from "react";
import { Encadre } from "@/components/ui/elements";
import { BoutonEnvoi, envoyerSansEffacer } from "@/components/ui/formulaire";
import { retirerParLien } from "@/features/anciens/actions";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";

/** Retrait de l'annuaire par un bouton, jamais à la simple ouverture du lien. */
export function FormulaireRetrait({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState(retirerParLien, ETAT_INITIAL);
  return (
    <form method="post" onSubmit={envoyerSansEffacer(action)} className="space-y-5">
      {etat.statut === "erreur" && <Encadre ton="erreur">{etat.message}</Encadre>}
      <input type="hidden" name="jeton" value={jeton} />
      <BoutonEnvoi variante="danger" enCoursForce={enCours} enCours="Retrait…">
        Me retirer de l&apos;annuaire
      </BoutonEnvoi>
    </form>
  );
}
