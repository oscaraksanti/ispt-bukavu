"use client";

import { useActionState } from "react";
import { definirMotDePasse } from "@/features/auth/actions";
import { Champ, Saisie } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/elements";
import { BoutonEnvoi, envoyerSansEffacer } from "@/components/ui/formulaire";

export function FormulaireMotDePasse({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState(definirMotDePasse, undefined);
  return (
    <form method="post" onSubmit={envoyerSansEffacer(action)} className="space-y-5">
      {etat?.erreur && <Encadre ton="erreur">{etat.erreur}</Encadre>}
      <input type="hidden" name="jeton" value={jeton} />
      <Champ
        id="motDePasse"
        libelle="Nouveau mot de passe"
        aide="Au moins 10 caractères, avec des lettres et des chiffres."
      >
        <Saisie
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="new-password"
          required
        />
      </Champ>
      <Champ id="confirmation" libelle="Confirmer le mot de passe">
        <Saisie
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
        />
      </Champ>
      <BoutonEnvoi className="w-full" enCoursForce={enCours} enCours="Enregistrement…">
        Enregistrer et se connecter
      </BoutonEnvoi>
    </form>
  );
}
