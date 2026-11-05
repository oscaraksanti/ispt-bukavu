"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useId, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Case, Champ, Saisie, ZoneTexte } from "@/components/ui/champs";
import { BoutonEnvoi } from "@/components/ui/formulaire";
import type { ChampSimple, DefinitionBloc } from "@/features/contenu/definitions";
import type { MediaSelecteur } from "@/features/medias/requetes";
import { ETAT_INITIAL, type EtatFormulaire } from "@/lib/etat-formulaire";
import { MessageEtat } from "./message-etat";
import { SelecteurImage } from "./selecteur-image";

type Valeurs = Record<string, unknown>;
type Action = (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;

function elementVide(element: ChampSimple[]): Valeurs {
  return Object.fromEntries(element.map((c) => [c.cle, c.type === "image" ? null : ""]));
}

function ChampSaisi({
  champ,
  id,
  valeur,
  medias,
  onChange,
}: {
  champ: ChampSimple;
  id: string;
  valeur: unknown;
  medias: MediaSelecteur[];
  onChange: (v: unknown) => void;
}) {
  if (champ.type === "image") {
    return (
      <SelecteurImage
        id={id}
        libelle={champ.libelle}
        valeur={typeof valeur === "string" ? valeur : null}
        medias={medias}
        onChange={onChange}
      />
    );
  }
  const texte = typeof valeur === "string" ? valeur : "";
  const max = champ.max;
  const aide =
    champ.aide || max ? (
      <>
        {champ.aide}
        {champ.aide && max ? " · " : ""}
        {max ? `${texte.length} / ${max} caractères` : ""}
      </>
    ) : undefined;
  return (
    <Champ id={id} libelle={champ.libelle} aide={aide}>
      {champ.type === "texteLong" ? (
        <ZoneTexte
          id={id}
          value={texte}
          maxLength={max}
          rows={Math.min(10, Math.max(3, Math.ceil(texte.length / 90)))}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={aide ? `${id}-aide` : undefined}
        />
      ) : (
        <Saisie
          id={id}
          value={texte}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={aide ? `${id}-aide` : undefined}
        />
      )}
    </Champ>
  );
}

/**
 * Formulaire généré à partir de la définition d'un bloc : textes, images et
 * listes réordonnables. Les données sont envoyées en JSON et revalidées
 * côté serveur.
 */
export function EditeurBloc({
  definition,
  valeursInitiales,
  visibleInitial = true,
  avecVisibilite = false,
  medias,
  action,
  libelleEnvoi = "Enregistrer et publier",
}: {
  definition: DefinitionBloc;
  valeursInitiales: Valeurs;
  visibleInitial?: boolean;
  avecVisibilite?: boolean;
  medias: MediaSelecteur[];
  action: Action;
  libelleEnvoi?: string;
}) {
  const prefixe = useId();
  const [valeurs, setValeurs] = useState<Valeurs>(valeursInitiales);
  const [etat, envoyer, enCours] = useActionState(action, ETAT_INITIAL);

  const modifier = (cle: string, v: unknown) => setValeurs((p) => ({ ...p, [cle]: v }));

  return (
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => envoyer(donnees));
      }}
      className="space-y-6"
    >
      <input type="hidden" name="donnees" value={JSON.stringify(valeurs)} />

      <div className="grid gap-6 md:grid-cols-2">
        {definition.champs.map((champ) => {
          const id = `${prefixe}-${champ.cle}`;
          if (champ.type !== "liste") {
            return (
              <div key={champ.cle} className={champ.type === "texte" ? "" : "md:col-span-2"}>
                <ChampSaisi
                  champ={champ}
                  id={id}
                  valeur={valeurs[champ.cle]}
                  medias={medias}
                  onChange={(v) => modifier(champ.cle, v)}
                />
              </div>
            );
          }

          const liste = (Array.isArray(valeurs[champ.cle]) ? valeurs[champ.cle] : []) as Valeurs[];
          const majListe = (nouvelle: Valeurs[]) => modifier(champ.cle, nouvelle);
          const deplacer = (i: number, sens: -1 | 1) => {
            const copie = [...liste];
            [copie[i], copie[i + sens]] = [copie[i + sens], copie[i]];
            majListe(copie);
          };
          const peutAjouter = champ.max === undefined || liste.length < champ.max;
          const peutRetirer = liste.length > (champ.min ?? 0);
          const simple = champ.element.length === 1 && champ.element[0].type === "texte";

          return (
            <fieldset key={champ.cle} className="space-y-3 md:col-span-2">
              <legend className="text-sm font-medium text-pierre-800">{champ.libelle}</legend>
              {champ.aide && <p className="text-detail text-pierre-500">{champ.aide}</p>}
              <ol className="space-y-3">
                {liste.map((element, i) => {
                  const commandes = (
                    <div className="flex shrink-0 items-center gap-1">
                      <Bouton
                        type="button"
                        variante="fantome"
                        taille="sm"
                        className="size-8 px-0"
                        disabled={i === 0}
                        onClick={() => deplacer(i, -1)}
                      >
                        <ArrowUp aria-hidden />
                        <span className="sr-only">Monter l&apos;élément {i + 1}</span>
                      </Bouton>
                      <Bouton
                        type="button"
                        variante="fantome"
                        taille="sm"
                        className="size-8 px-0"
                        disabled={i === liste.length - 1}
                        onClick={() => deplacer(i, 1)}
                      >
                        <ArrowDown aria-hidden />
                        <span className="sr-only">Descendre l&apos;élément {i + 1}</span>
                      </Bouton>
                      <Bouton
                        type="button"
                        variante="fantome"
                        taille="sm"
                        className="size-8 px-0 text-erreur hover:bg-erreur-fond"
                        disabled={!peutRetirer}
                        onClick={() => majListe(liste.filter((_, j) => j !== i))}
                      >
                        <Trash2 aria-hidden />
                        <span className="sr-only">Retirer l&apos;élément {i + 1}</span>
                      </Bouton>
                    </div>
                  );

                  if (simple) {
                    const sous = champ.element[0];
                    return (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 font-mono text-xs text-pierre-500">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <label className="sr-only" htmlFor={`${id}-${i}`}>
                          {sous.libelle} {i + 1}
                        </label>
                        <Saisie
                          id={`${id}-${i}`}
                          value={
                            typeof element[sous.cle] === "string" ? String(element[sous.cle]) : ""
                          }
                          onChange={(e) =>
                            majListe(
                              liste.map((x, j) =>
                                j === i ? { ...x, [sous.cle]: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        {commandes}
                      </li>
                    );
                  }

                  return (
                    <li key={i} className="rounded-xs border border-pierre-200 bg-pierre-50">
                      <div className="flex items-center justify-between border-b border-pierre-200 px-4 py-1.5">
                        <span className="font-mono text-xs text-pierre-500">
                          {champ.libelle} · {String(i + 1).padStart(2, "0")}
                        </span>
                        {commandes}
                      </div>
                      <div className="grid gap-4 p-4">
                        {champ.element.map((sous) => (
                          <ChampSaisi
                            key={sous.cle}
                            champ={sous}
                            id={`${id}-${i}-${sous.cle}`}
                            valeur={element[sous.cle]}
                            medias={medias}
                            onChange={(v) =>
                              majListe(liste.map((x, j) => (j === i ? { ...x, [sous.cle]: v } : x)))
                            }
                          />
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {peutAjouter && (
                <Bouton
                  type="button"
                  variante="contour"
                  taille="sm"
                  onClick={() => majListe([...liste, elementVide(champ.element)])}
                >
                  <Plus aria-hidden /> Ajouter
                </Bouton>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 border-t border-pierre-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-5">
          {avecVisibilite && <input type="hidden" name="visibilite" value="1" />}
          {avecVisibilite && (
            <label className="flex items-center gap-2 text-sm text-pierre-800">
              <Case name="visible" defaultChecked={visibleInitial} />
              Section affichée sur le site
            </label>
          )}
          <MessageEtat etat={etat} />
        </div>
        <BoutonEnvoi variante="institutionnel" enCours="Enregistrement…" enCoursForce={enCours}>
          {libelleEnvoi}
        </BoutonEnvoi>
      </div>
    </form>
  );
}
