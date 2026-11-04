import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { type DonneesDocument, LIBELLES_DOCUMENT, resumeVerification } from "./regles";

export const ETIQUETTE_DOCUMENTS = "documents";

export type ResultatVerification =
  | { etat: "inconnu" }
  | {
      etat: "valide" | "revoque";
      type: string;
      emisLe: string;
      motif: string | null;
      revoqueLe: string | null;
      titulaire: ReturnType<typeof resumeVerification>;
    };

/** Résultat public de la vérification d'un code (mis en cache, invalidé à chaque révocation). */
export async function verifierCode(code: string): Promise<ResultatVerification> {
  "use cache";
  cacheTag(ETIQUETTE_DOCUMENTS);
  cacheLife("hours");
  const doc = await db.documentOfficiel.findUnique({ where: { code } });
  if (!doc) return { etat: "inconnu" };
  return {
    etat: doc.revoqueLe ? "revoque" : "valide",
    type: LIBELLES_DOCUMENT[doc.type],
    emisLe: doc.emisLe.toISOString(),
    revoqueLe: doc.revoqueLe?.toISOString() ?? null,
    motif: doc.motifRevocation,
    titulaire: resumeVerification(doc.donnees as DonneesDocument),
  };
}
