"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Case, Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { BoutonEnvoi } from "@/components/ui/formulaire";
import { inscrireAncien } from "@/features/anciens/actions";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";

/** Inscription volontaire à l'annuaire des anciens. */
export function FormulaireAncien({ filieres }: { filieres: { id: string; nom: string }[] }) {
  const [etat, envoyer] = useActionState(inscrireAncien, ETAT_INITIAL);
  const e = etat.erreurs ?? {};
  const v = etat.valeurs ?? {};
  const invalide = (cle: string) =>
    e[cle] ? { "aria-invalid": true as const, "aria-describedby": `${cle}-erreur` } : {};

  if (etat.statut === "succes")
    return (
      <div role="status" className="rounded-md border border-succes/40 bg-succes-fond p-6">
        <CircleCheck aria-hidden className="size-7 text-succes" />
        <p className="mt-3 text-lg text-pierre-900">{etat.message}</p>
      </div>
    );

  return (
    <form key={etat.horodatage} action={envoyer} noValidate className="space-y-6">
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site">Ne pas remplir</label>
        <input id="site" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="mb-3 font-sans text-sm font-semibold text-encre">Vous</legend>
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
        <Champ
          id="email"
          libelle="Adresse email"
          obligatoire
          erreur={e.email}
          aide="Jamais affichée : elle sert à vous envoyer votre lien de retrait."
          className="sm:col-span-2"
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
      </fieldset>
      <fieldset className="grid gap-5 border-t border-pierre-200 pt-6 sm:grid-cols-3">
        <legend className="mb-3 font-sans text-sm font-semibold text-encre">
          Votre parcours à l&apos;institut
        </legend>
        <Champ id="filiereId" libelle="Filière" className="sm:col-span-2">
          <Liste id="filiereId" name="filiereId" defaultValue={v.filiereId ?? ""}>
            <option value="">—</option>
            {filieres.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </Liste>
        </Champ>
        <Champ id="anneeSortie" libelle="Année de sortie" obligatoire erreur={e.anneeSortie}>
          <Saisie
            id="anneeSortie"
            name="anneeSortie"
            inputMode="numeric"
            maxLength={4}
            placeholder="AAAA"
            defaultValue={v.anneeSortie}
            {...invalide("anneeSortie")}
          />
        </Champ>
      </fieldset>
      <fieldset className="grid gap-5 border-t border-pierre-200 pt-6 sm:grid-cols-3">
        <legend className="mb-3 font-sans text-sm font-semibold text-encre">
          Aujourd&apos;hui (facultatif)
        </legend>
        <Champ id="poste" libelle="Poste">
          <Saisie id="poste" name="poste" maxLength={120} defaultValue={v.poste} />
        </Champ>
        <Champ id="employeur" libelle="Employeur ou entreprise">
          <Saisie id="employeur" name="employeur" maxLength={120} defaultValue={v.employeur} />
        </Champ>
        <Champ id="ville" libelle="Ville">
          <Saisie id="ville" name="ville" maxLength={80} defaultValue={v.ville} />
        </Champ>
        <Champ id="parcours" libelle="Quelques mots sur votre parcours" className="sm:col-span-3">
          <ZoneTexte
            id="parcours"
            name="parcours"
            rows={3}
            maxLength={800}
            defaultValue={v.parcours}
          />
        </Champ>
        <Champ
          id="lienProfessionnel"
          libelle="Profil professionnel en ligne"
          erreur={e.lienProfessionnel}
          aide="Par exemple votre page LinkedIn, commençant par https://"
          className="sm:col-span-3"
        >
          <Saisie
            id="lienProfessionnel"
            name="lienProfessionnel"
            type="url"
            inputMode="url"
            defaultValue={v.lienProfessionnel}
            {...invalide("lienProfessionnel")}
          />
        </Champ>
      </fieldset>
      <div className="space-y-1.5 border-t border-pierre-200 pt-6">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-pierre-800">
          <Case name="consentement" className="mt-1" {...invalide("consentement")} />
          J&apos;accepte que ces informations (sauf mon adresse email) soient publiées dans
          l&apos;annuaire des anciens de l&apos;ISPT-Bukavu. Je peux m&apos;en retirer à tout moment
          avec le lien personnel qui me sera envoyé.
        </label>
        {e.consentement && (
          <p id="consentement-erreur" className="text-detail font-medium text-erreur">
            {e.consentement}
          </p>
        )}
      </div>
      {etat.statut === "erreur" && (
        <p role="alert" className="text-sm font-medium text-erreur">
          {etat.message}
        </p>
      )}
      <BoutonEnvoi enCours="Envoi…">Envoyer ma demande</BoutonEnvoi>
    </form>
  );
}
