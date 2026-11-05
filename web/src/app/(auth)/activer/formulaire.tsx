"use client";

import { useActionState } from "react";
import { Champ, Saisie } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/elements";
import { BoutonEnvoi, envoyerSansEffacer } from "@/components/ui/formulaire";
import { activerCompte } from "@/features/academique/actions-etudiants";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";

export function FormulaireActivation() {
  const [etat, envoyer, enCours] = useActionState(activerCompte, ETAT_INITIAL);
  return (
    <form method="post" onSubmit={envoyerSansEffacer(envoyer)} className="space-y-5">
      {etat.statut === "erreur" && (
        <Encadre ton="erreur" titre="Activation impossible">
          {etat.message}
        </Encadre>
      )}
      <Champ id="matricule" libelle="Matricule">
        <Saisie
          id="matricule"
          name="matricule"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          required
        />
      </Champ>
      <Champ
        id="code"
        libelle="Code d'activation"
        aide="Remis par le secrétariat, par exemple ABCD-EFGH-JK."
      >
        <Saisie
          id="code"
          name="code"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          required
          aria-describedby="code-aide"
        />
      </Champ>
      <Champ
        id="motDePasse"
        libelle="Choisissez un mot de passe"
        aide="10 caractères au moins, avec des lettres et des chiffres."
      >
        <Saisie
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby="motDePasse-aide"
        />
      </Champ>
      <Champ id="confirmation" libelle="Confirmez le mot de passe">
        <Saisie
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
        />
      </Champ>
      <BoutonEnvoi className="w-full" enCoursForce={enCours} enCours="Activation…">
        Activer mon compte
      </BoutonEnvoi>
    </form>
  );
}
