"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Case, Champ, Saisie } from "@/components/ui/champs";
import { BoutonEnvoi } from "@/components/ui/formulaire";
import { creerCompteCandidat } from "@/features/admissions/actions-candidat";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";

export function FormulaireInscriptionCandidat() {
  const [etat, envoyer] = useActionState(creerCompteCandidat, ETAT_INITIAL);
  const e = etat.erreurs ?? {};
  const v = etat.valeurs ?? {};
  const invalide = (cle: string) =>
    e[cle] ? { "aria-invalid": true as const, "aria-describedby": `${cle}-erreur` } : {};

  if (etat.statut === "succes")
    return (
      <div role="status" className="rounded-md border border-succes/40 bg-succes-fond p-6">
        <MailCheck aria-hidden className="size-7 text-succes" />
        <h3 className="mt-3 font-sans text-lg font-semibold text-encre">
          Consultez votre boîte mail
        </h3>
        <p className="mt-2 leading-relaxed text-pierre-800">{etat.message}</p>
        <p className="mt-4 text-sm text-pierre-700">
          Pas de message après quelques minutes ? Vous pouvez aussi{" "}
          <Link
            href="/connexion?suite=/candidat"
            className="font-medium text-ispt-700 underline hover:no-underline"
          >
            vous connecter
          </Link>{" "}
          avec l&apos;adresse et le mot de passe choisis pour demander un nouveau lien.
        </p>
      </div>
    );

  return (
    <form key={etat.horodatage} action={envoyer} noValidate className="space-y-5">
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site">Ne pas remplir</label>
        <input id="site" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ id="prenom" libelle="Prénom" obligatoire erreur={e.prenom}>
          <Saisie
            id="prenom"
            name="prenom"
            autoComplete="given-name"
            defaultValue={v.prenom}
            {...invalide("prenom")}
          />
        </Champ>
        <Champ id="nom" libelle="Nom" obligatoire erreur={e.nom}>
          <Saisie
            id="nom"
            name="nom"
            autoComplete="family-name"
            defaultValue={v.nom}
            {...invalide("nom")}
          />
        </Champ>
        <Champ id="postnom" libelle="Postnom">
          <Saisie id="postnom" name="postnom" defaultValue={v.postnom} />
        </Champ>
        <Champ id="telephone" libelle="Téléphone" obligatoire erreur={e.telephone}>
          <Saisie
            id="telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            placeholder="099 000 0000"
            defaultValue={v.telephone}
            {...invalide("telephone")}
          />
        </Champ>
      </div>
      <Champ
        id="email"
        libelle="Adresse email"
        obligatoire
        erreur={e.email}
        aide="Toutes les nouvelles de votre dossier y seront envoyées."
      >
        <Saisie
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={v.email}
          {...invalide("email")}
        />
      </Champ>
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ
          id="motDePasse"
          libelle="Mot de passe"
          obligatoire
          erreur={e.motDePasse}
          aide="10 caractères au moins, avec des lettres et des chiffres."
        >
          <Saisie
            id="motDePasse"
            name="motDePasse"
            type="password"
            autoComplete="new-password"
            {...invalide("motDePasse")}
          />
        </Champ>
        <Champ id="confirmation" libelle="Confirmation" obligatoire erreur={e.confirmation}>
          <Saisie
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            {...invalide("confirmation")}
          />
        </Champ>
      </div>
      <div className="space-y-1.5">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-pierre-800">
          <Case name="consentement" className="mt-1" {...invalide("consentement")} />
          J&apos;accepte que l&apos;ISPT-Bukavu traite les informations de mon dossier pour
          instruire ma candidature et me contacter à son sujet.
        </label>
        {e.consentement && (
          <p id="consentement-erreur" className="text-[0.8125rem] font-medium text-erreur">
            {e.consentement}
          </p>
        )}
      </div>
      {etat.statut === "erreur" && (
        <p role="alert" className="text-sm font-medium text-erreur">
          {etat.message}
        </p>
      )}
      <div className="flex flex-col gap-4 border-t border-pierre-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-pierre-600">
          Déjà un compte ?{" "}
          <Link
            href="/connexion?suite=/candidat"
            className="font-medium text-ispt-600 underline hover:no-underline"
          >
            Reprendre mon dossier
          </Link>
        </p>
        <BoutonEnvoi enCours="Création du compte…">Ouvrir mon dossier</BoutonEnvoi>
      </div>
    </form>
  );
}
