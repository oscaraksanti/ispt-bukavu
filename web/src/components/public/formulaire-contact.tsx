"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { BoutonEnvoi } from "@/components/ui/formulaire";
import { envoyerMessage } from "@/features/contact/actions";
import { SUJETS_CONTACT } from "@/features/contact/sujets";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";

export function FormulaireContact() {
  const [etat, envoyer] = useActionState(envoyerMessage, ETAT_INITIAL);
  const e = etat.erreurs ?? {};
  const v = etat.valeurs ?? {};

  if (etat.statut === "succes")
    return (
      <div role="status" className="rounded-md border border-succes/30 bg-succes-fond p-6">
        <p className="flex items-start gap-3 font-medium text-succes">
          <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
          {etat.message}
        </p>
      </div>
    );

  const aide = (cle: string) =>
    e[cle] ? { "aria-invalid": true, "aria-describedby": `${cle}-erreur` } : {};

  return (
    <form key={etat.horodatage} action={envoyer} noValidate className="space-y-5">
      {/* Piège à robots : invisible et ignoré par les personnes. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site">Ne pas remplir</label>
        <input id="site" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ id="nom" libelle="Nom complet" obligatoire erreur={e.nom}>
          <Saisie
            id="nom"
            name="nom"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={v.nom}
            {...aide("nom")}
          />
        </Champ>
        <Champ id="email" libelle="Adresse email" obligatoire erreur={e.email}>
          <Saisie
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={160}
            defaultValue={v.email}
            {...aide("email")}
          />
        </Champ>
        <Champ id="telephone" libelle="Téléphone (facultatif)" erreur={e.telephone}>
          <Saisie
            id="telephone"
            name="telephone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            defaultValue={v.telephone}
          />
        </Champ>
        <Champ id="sujet" libelle="Sujet" obligatoire erreur={e.sujet}>
          <Liste id="sujet" name="sujet" required defaultValue={v.sujet ?? ""} {...aide("sujet")}>
            <option value="" disabled>
              Choisir…
            </option>
            {Object.entries(SUJETS_CONTACT).map(([cle, libelle]) => (
              <option key={cle} value={cle}>
                {libelle}
              </option>
            ))}
          </Liste>
        </Champ>
      </div>
      <Champ id="message" libelle="Message" obligatoire erreur={e.message}>
        <ZoneTexte
          id="message"
          name="message"
          rows={6}
          required
          maxLength={4000}
          defaultValue={v.message}
          {...aide("message")}
        />
      </Champ>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-pierre-600">
          Vos coordonnées servent uniquement à vous répondre.
        </p>
        <BoutonEnvoi variante="institutionnel" enCours="Envoi…">
          Envoyer le message
        </BoutonEnvoi>
      </div>
      {etat.statut === "erreur" && (
        <p role="alert" className="text-sm font-medium text-erreur">
          {etat.message}
        </p>
      )}
    </form>
  );
}
