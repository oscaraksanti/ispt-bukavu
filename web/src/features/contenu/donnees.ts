/**
 * Manipulation pure des données de blocs (sans base de données) :
 * fusion avec les valeurs par défaut, validation des saisies de
 * l'administration et repérage des images utilisées.
 */
import { z } from "zod";
import type { Champ, ChampSimple, DefinitionBloc } from "./definitions";

export type DonneesBloc = Record<string, unknown>;

const LONGUEUR_TEXTE = 300;
const LONGUEUR_TEXTE_LONG = 4000;

function valeurVide(champ: Champ): unknown {
  if (champ.type === "liste") return [];
  if (champ.type === "image") return null;
  return "";
}

function normaliserSimple(champ: ChampSimple, valeur: unknown, defaut: unknown): unknown {
  if (champ.type === "image") {
    if (typeof valeur === "string" && valeur) return valeur;
    if (valeur === null) return null;
    return typeof defaut === "string" ? defaut : null;
  }
  if (typeof valeur === "string") return valeur;
  return typeof defaut === "string" ? defaut : "";
}

/**
 * Complète les données enregistrées avec les valeurs par défaut : un champ
 * ajouté au registre après l'initialisation apparaît ainsi sans migration.
 */
export function fusionnerBloc(definition: DefinitionBloc, donnees: unknown): DonneesBloc {
  const source = donnees && typeof donnees === "object" ? (donnees as DonneesBloc) : {};
  const resultat: DonneesBloc = {};
  for (const champ of definition.champs) {
    const defaut = definition.defaut[champ.cle] ?? valeurVide(champ);
    const valeur = source[champ.cle];
    if (champ.type === "liste") {
      const liste = Array.isArray(valeur) ? valeur : Array.isArray(defaut) ? defaut : [];
      resultat[champ.cle] = liste.map((element) => {
        const e = element && typeof element === "object" ? (element as DonneesBloc) : {};
        return Object.fromEntries(
          champ.element.map((sous) => [sous.cle, normaliserSimple(sous, e[sous.cle], undefined)]),
        );
      });
    } else {
      resultat[champ.cle] = normaliserSimple(champ, valeur, defaut);
    }
  }
  return resultat;
}

function schemaSimple(champ: ChampSimple) {
  switch (champ.type) {
    case "texte":
      return z
        .string()
        .trim()
        .max(champ.max ?? LONGUEUR_TEXTE, `« ${champ.libelle} » est trop long.`);
    case "texteLong":
      return z
        .string()
        .trim()
        .max(champ.max ?? LONGUEUR_TEXTE_LONG, `« ${champ.libelle} » est trop long.`);
    case "image":
      return z.string().min(1).max(64).nullable();
  }
}

/** Schéma de validation d'un bloc, déduit de sa définition. */
export function schemaBloc(definition: DefinitionBloc) {
  const forme: Record<string, z.ZodType> = {};
  for (const champ of definition.champs) {
    if (champ.type === "liste") {
      const element = z.object(
        Object.fromEntries(champ.element.map((sous) => [sous.cle, schemaSimple(sous)])),
      );
      let liste = z.array(element);
      if (champ.min !== undefined)
        liste = liste.min(champ.min, `« ${champ.libelle} » : au moins ${champ.min} élément(s).`);
      if (champ.max !== undefined)
        liste = liste.max(champ.max, `« ${champ.libelle} » : au plus ${champ.max} élément(s).`);
      forme[champ.cle] = liste;
    } else {
      forme[champ.cle] = schemaSimple(champ);
    }
  }
  return z.object(forme);
}

/** Identifiants d'images (ou jetons « photo: ») référencés par un bloc. */
export function imagesDuBloc(definition: DefinitionBloc, donnees: DonneesBloc): string[] {
  const ids = new Set<string>();
  for (const champ of definition.champs) {
    const valeur = donnees[champ.cle];
    if (champ.type === "image" && typeof valeur === "string") ids.add(valeur);
    if (champ.type === "liste" && Array.isArray(valeur)) {
      for (const sous of champ.element) {
        if (sous.type !== "image") continue;
        for (const e of valeur as DonneesBloc[]) {
          const v = e[sous.cle];
          if (typeof v === "string") ids.add(v);
        }
      }
    }
  }
  return [...ids];
}

/** Remplace chaque référence d'image par sa valeur résolue (ou null). */
export function remplacerImages<T>(
  definition: DefinitionBloc,
  donnees: DonneesBloc,
  resoudre: (reference: string) => T | null,
): DonneesBloc {
  const resultat: DonneesBloc = { ...donnees };
  for (const champ of definition.champs) {
    const valeur = donnees[champ.cle];
    if (champ.type === "image") {
      resultat[champ.cle] = typeof valeur === "string" ? resoudre(valeur) : null;
    }
    if (champ.type === "liste" && Array.isArray(valeur)) {
      resultat[champ.cle] = (valeur as DonneesBloc[]).map((e) => {
        const copie = { ...e };
        for (const sous of champ.element) {
          if (sous.type === "image")
            copie[sous.cle] =
              typeof e[sous.cle] === "string" ? resoudre(e[sous.cle] as string) : null;
        }
        return copie;
      });
    }
  }
  return resultat;
}
