"use client";

import Link from "next/link";
import { useActionState } from "react";
import { seConnecter } from "@/features/auth/actions";
import { Champ, Saisie } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/elements";
import { BoutonEnvoi } from "@/components/ui/formulaire";

export function FormulaireConnexion({ suite }: { suite?: string }) {
  const [etat, action] = useActionState(seConnecter, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      {etat?.erreur && (
        <Encadre ton="erreur" titre="Connexion impossible">
          {etat.erreur}
        </Encadre>
      )}
      <input type="hidden" name="suite" value={suite ?? ""} />
      <Champ id="email" libelle="Adresse email">
        <Saisie id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Champ>
      <Champ id="motDePasse" libelle="Mot de passe">
        <Saisie
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
        />
      </Champ>
      <BoutonEnvoi className="w-full" enCours="Connexion…">
        Se connecter
      </BoutonEnvoi>
      <p className="text-center text-sm">
        <Link href="/mot-de-passe-oublie" className="text-ispt-600 underline underline-offset-4">
          Mot de passe oublié ?
        </Link>
      </p>
    </form>
  );
}
