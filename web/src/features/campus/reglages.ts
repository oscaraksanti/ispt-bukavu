import "server-only";
import { db } from "@/lib/db";
import { REGLES_PAR_DEFAUT } from "./regles";

export type ReglagesCampus = {
  /** Les publications des étudiants attendent la validation de la modération. */
  validationPrealable: boolean;
  /** Règles affichées avant la première publication. */
  regles: string;
  /** Les règles n'ont pas encore été revues par l'institut. */
  reglesParDefaut: boolean;
};

export const CLE_REGLAGES_CAMPUS = "campus";

export async function lireReglagesCampus(): Promise<ReglagesCampus> {
  const r = await db.reglage.findUnique({ where: { cle: CLE_REGLAGES_CAMPUS } });
  const v = (r?.valeur ?? {}) as Partial<ReglagesCampus>;
  const regles = typeof v.regles === "string" && v.regles.trim() ? v.regles : REGLES_PAR_DEFAUT;
  return {
    validationPrealable: v.validationPrealable === true,
    regles,
    reglesParDefaut: regles === REGLES_PAR_DEFAUT,
  };
}
