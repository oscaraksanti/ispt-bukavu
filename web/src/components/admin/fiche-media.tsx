"use client";

import { Pencil, TriangleAlert, X } from "lucide-react";
import Image from "next/image";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { BoutonEnvoi } from "@/components/ui/formulaire";
import { modifierMedia, supprimerMedia } from "@/features/medias/actions";
import { DOSSIERS_MEDIAS, tailleLisible } from "@/features/medias/regles";
import { ETAT_INITIAL, type EtatFormulaire } from "@/lib/etat-formulaire";
import { MessageEtat } from "./message-etat";

export type MediaListe = {
  id: string;
  url: string;
  nomFichier: string;
  texteAlternatif: string;
  legende: string | null;
  dossier: string;
  taille: number;
  largeur: number | null;
  hauteur: number | null;
  officielle: boolean;
};

/** Vignette de la médiathèque, avec sa fiche de description en fenêtre. */
export function FicheMedia({ media }: { media: MediaListe }) {
  const id = useId();
  const dialogue = useRef<HTMLDialogElement>(null);
  const [etat, envoyer] = useActionState(modifierMedia.bind(null, media.id), ETAT_INITIAL);
  const [etatSuppression, setEtatSuppression] = useState<EtatFormulaire>(ETAT_INITIAL);
  const [suppressionEnCours, demarrer] = useTransition();
  const [confirmer, setConfirmer] = useState(false);
  const sansDescription = !media.texteAlternatif.trim();

  return (
    <li className="group overflow-hidden rounded-xs border border-pierre-200 bg-white">
      <button
        type="button"
        onClick={() => dialogue.current?.showModal()}
        className="block w-full text-left"
      >
        <span className="relative block aspect-[4/3] bg-pierre-100">
          <Image
            src={media.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 240px, 50vw"
            className="object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-encre/0 opacity-0 transition group-hover:bg-encre/40 group-hover:opacity-100">
            <Pencil aria-hidden className="size-5 text-white" />
          </span>
        </span>
        <span className="block px-3 py-2">
          <span className="block truncate text-sm text-pierre-900">{media.nomFichier}</span>
          {sansDescription ? (
            <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-attention">
              <TriangleAlert aria-hidden className="size-3.5" /> Description à rédiger
            </span>
          ) : (
            <span className="mt-0.5 block truncate text-xs text-pierre-500">
              {media.texteAlternatif}
            </span>
          )}
        </span>
        <span className="sr-only">Modifier la description</span>
      </button>

      <dialog
        ref={dialogue}
        aria-labelledby={`${id}-titre`}
        className="m-auto max-h-[90svh] w-[min(48rem,calc(100vw-2rem))] rounded-md border border-pierre-200 bg-white p-0 shadow-2xl backdrop:bg-encre/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogue.current?.close();
        }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-pierre-200 px-5 py-4">
          <h2 id={`${id}-titre`} className="truncate font-sans text-base font-semibold text-encre">
            {media.nomFichier}
          </h2>
          <button
            type="button"
            onClick={() => dialogue.current?.close()}
            className="flex size-9 shrink-0 items-center justify-center rounded-xs text-pierre-600 hover:bg-pierre-100"
          >
            <X aria-hidden className="size-4" />
            <span className="sr-only">Fermer</span>
          </button>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[16rem_1fr]">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xs bg-pierre-100">
              <Image src={media.url} alt="" fill sizes="256px" className="object-contain" />
            </div>
            <dl className="mt-3 space-y-1 font-mono text-xs text-pierre-600">
              {media.largeur && media.hauteur && (
                <div className="flex justify-between">
                  <dt>Dimensions</dt>
                  <dd>
                    {media.largeur} × {media.hauteur}
                  </dd>
                </div>
              )}
              {media.taille > 0 && (
                <div className="flex justify-between">
                  <dt>Poids</dt>
                  <dd>{tailleLisible(media.taille)}</dd>
                </div>
              )}
            </dl>
          </div>
          <form action={envoyer} className="space-y-5">
            <Champ
              id={`${id}-alt`}
              libelle="Description de l'image"
              aide="Ce que montre la photo, en une phrase. Lue par les lecteurs d'écran et les moteurs de recherche."
            >
              <ZoneTexte
                id={`${id}-alt`}
                name="texteAlternatif"
                defaultValue={media.texteAlternatif}
                maxLength={300}
                rows={3}
                aria-describedby={`${id}-alt-aide`}
              />
            </Champ>
            <Champ id={`${id}-legende`} libelle="Légende (facultative)">
              <Saisie
                id={`${id}-legende`}
                name="legende"
                defaultValue={media.legende ?? ""}
                maxLength={200}
              />
            </Champ>
            <Champ id={`${id}-dossier`} libelle="Dossier">
              <Liste id={`${id}-dossier`} name="dossier" defaultValue={media.dossier}>
                {Object.entries(DOSSIERS_MEDIAS).map(([cle, libelle]) => (
                  <option key={cle} value={cle}>
                    {libelle}
                  </option>
                ))}
              </Liste>
            </Champ>
            <div className="flex flex-col-reverse gap-4 border-t border-pierre-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              {!media.officielle ? (
                confirmer ? (
                  <div className="flex items-center gap-2">
                    <Bouton
                      type="button"
                      variante="danger"
                      taille="sm"
                      disabled={suppressionEnCours}
                      onClick={() =>
                        demarrer(async () => {
                          const r = await supprimerMedia(media.id);
                          setEtatSuppression(r);
                          setConfirmer(false);
                          if (r.statut === "succes") dialogue.current?.close();
                        })
                      }
                    >
                      Confirmer la suppression
                    </Bouton>
                    <Bouton
                      type="button"
                      variante="fantome"
                      taille="sm"
                      onClick={() => setConfirmer(false)}
                    >
                      Annuler
                    </Bouton>
                  </div>
                ) : (
                  <Bouton
                    type="button"
                    variante="fantome"
                    taille="sm"
                    className="text-erreur hover:bg-erreur-fond"
                    onClick={() => setConfirmer(true)}
                  >
                    Supprimer l&apos;image
                  </Bouton>
                )
              ) : (
                <p className="text-xs text-pierre-500">Photo officielle : non supprimable.</p>
              )}
              <BoutonEnvoi variante="institutionnel" taille="sm" enCours="Enregistrement…">
                Enregistrer
              </BoutonEnvoi>
            </div>
            <MessageEtat etat={etat} />
            <MessageEtat etat={etatSuppression} />
          </form>
        </div>
      </dialog>
    </li>
  );
}
