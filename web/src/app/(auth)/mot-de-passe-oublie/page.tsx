"use client";

import Link from "next/link";
import { useActionState } from "react";
import { demanderReinitialisation } from "@/features/auth/actions";
import { Champ, Saisie } from "@/components/ui/champs";
import { Encadre } from "@/components/ui/elements";
import { BoutonEnvoi } from "@/components/ui/formulaire";

export default function PageMotDePasseOublie() {
  const [etat, action] = useActionState(demanderReinitialisation, undefined);
  return (
    <>
      <p className="surtitre">Espace sécurisé</p>
      <h1 className="mt-3 text-4xl">Mot de passe oublié</h1>
      <p className="mt-3 text-pierre-600">
        Indiquez l&apos;adresse email de votre compte : vous recevrez un lien pour choisir un
        nouveau mot de passe.
      </p>
      <form action={action} className="mt-8 space-y-5">
        {etat?.succes && <Encadre ton="succes">{etat.succes}</Encadre>}
        <Champ id="email" libelle="Adresse email">
          <Saisie id="email" name="email" type="email" autoComplete="email" required />
        </Champ>
        <BoutonEnvoi className="w-full" enCours="Envoi…">
          Recevoir le lien
        </BoutonEnvoi>
        <p className="text-center text-sm">
          <Link href="/connexion" className="text-ispt-600 underline underline-offset-4">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </>
  );
}
