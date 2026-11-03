"use client";

import { startTransition, useActionState, useState } from "react";
import { MessageEtat } from "@/components/admin/message-etat";
import { Bouton } from "@/components/ui/bouton";
import { Case, Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { type Cible, LIBELLES_CIBLE } from "@/features/valve/regles";
import { ETAT_INITIAL, type EtatFormulaire } from "@/lib/etat-formulaire";

type Option = { id: string; libelle: string };

export type ValeursCommunique = {
  titre: string;
  contenu: string;
  cible: Cible;
  filiereId: string;
  promotionId: string;
  coursOffertId: string;
  expireLe: string;
  epingle: boolean;
};

/** Rédaction d'un communiqué : public visé, texte, épinglage et expiration. */
export function FormulaireCommunique({
  action,
  cibles,
  filieres,
  promotions,
  cours,
  valeurs,
  retour,
  publieDeja = false,
}: {
  action: (etat: EtatFormulaire, fd: FormData) => Promise<EtatFormulaire>;
  cibles: Cible[];
  filieres: Option[];
  promotions: Option[];
  cours: Option[];
  valeurs: ValeursCommunique;
  retour: "admin" | "enseignant";
  publieDeja?: boolean;
}) {
  const [etat, envoyer, enCours] = useActionState(action, ETAT_INITIAL);
  const [cible, setCible] = useState<Cible>(
    cibles.includes(valeurs.cible) ? valeurs.cible : cibles[0],
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => envoyer(fd));
      }}
    >
      <input type="hidden" name="retour" value={retour} />
      <Champ id="titre" libelle="Titre" obligatoire>
        <Saisie id="titre" name="titre" defaultValue={valeurs.titre} maxLength={160} required />
      </Champ>
      <div className="grid gap-5 md:grid-cols-2">
        <Champ id="cible" libelle="Destinataires">
          <Liste
            id="cible"
            name="cible"
            value={cible}
            onChange={(e) => setCible(e.target.value as Cible)}
          >
            {cibles.map((c) => (
              <option key={c} value={c}>
                {LIBELLES_CIBLE[c]}
              </option>
            ))}
          </Liste>
        </Champ>
        {cible === "FILIERE" && (
          <Champ id="filiereId" libelle="Filière">
            <Liste id="filiereId" name="filiereId" defaultValue={valeurs.filiereId}>
              <option value="">Choisir…</option>
              {filieres.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.libelle}
                </option>
              ))}
            </Liste>
          </Champ>
        )}
        {cible === "PROMOTION" && (
          <Champ id="promotionId" libelle="Promotion">
            <Liste id="promotionId" name="promotionId" defaultValue={valeurs.promotionId}>
              <option value="">Choisir…</option>
              {promotions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.libelle}
                </option>
              ))}
            </Liste>
          </Champ>
        )}
        {cible === "COURS" && (
          <Champ id="coursOffertId" libelle="Cours">
            <Liste id="coursOffertId" name="coursOffertId" defaultValue={valeurs.coursOffertId}>
              <option value="">Choisir…</option>
              {cours.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.libelle}
                </option>
              ))}
            </Liste>
          </Champ>
        )}
      </div>
      <Champ
        id="texte-communique"
        libelle="Texte du communiqué"
        obligatoire
        aide="Une ligne vide sépare les paragraphes ; « - » en début de ligne crée une liste."
      >
        <ZoneTexte
          id="texte-communique"
          name="contenu"
          rows={10}
          defaultValue={valeurs.contenu}
          maxLength={10000}
          required
          aria-describedby="texte-communique-aide"
        />
      </Champ>
      <div className="grid gap-5 md:grid-cols-2">
        <Champ id="expireLe" libelle="Retirer automatiquement après le (facultatif)">
          <Saisie id="expireLe" name="expireLe" type="date" defaultValue={valeurs.expireLe} />
        </Champ>
        <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-pierre-800">
          <Case name="epingle" defaultChecked={valeurs.epingle} />
          Épingler en tête de la valve
        </label>
      </div>
      <div className="flex flex-col gap-4 border-t border-pierre-200 pt-5 sm:flex-row-reverse sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {!publieDeja && (
            <Bouton
              type="submit"
              name="intention"
              value="brouillon"
              variante="contour"
              disabled={enCours}
            >
              Enregistrer le brouillon
            </Bouton>
          )}
          <Bouton
            type="submit"
            name="intention"
            value="publier"
            variante="institutionnel"
            disabled={enCours}
          >
            {enCours ? "Enregistrement…" : publieDeja ? "Enregistrer" : "Publier"}
          </Bouton>
        </div>
        <MessageEtat etat={etat} />
      </div>
    </form>
  );
}
