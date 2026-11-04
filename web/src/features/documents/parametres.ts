import "server-only";
import { fusionnerBloc } from "@/features/contenu/donnees";
import { REGLAGES_DOCUMENTS, type ReglagesDocuments } from "@/features/contenu/reglages";
import { db } from "@/lib/db";

/** Paramètres des documents, complétés par les valeurs usuelles. */
export async function lireParametresDocuments(): Promise<ReglagesDocuments> {
  const r = await db.reglage.findUnique({ where: { cle: REGLAGES_DOCUMENTS.cle } });
  return fusionnerBloc(
    REGLAGES_DOCUMENTS,
    r?.valeur ?? REGLAGES_DOCUMENTS.defaut,
  ) as ReglagesDocuments;
}

/**
 * Signataire des attestations et relevés : celui saisi dans les paramètres,
 * sinon l'autorité « académique » de la page Autorités, sinon personne.
 */
export async function signataireDocuments(parametres: ReglagesDocuments) {
  if (parametres.signataireNom.trim())
    return {
      fonction: parametres.signataireFonction.trim() || "Pour l'institut",
      nom: parametres.signataireNom.trim(),
    };
  const autorites = await db.autorite.findMany({
    where: { visible: true },
    orderBy: { ordre: "asc" },
  });
  const sga = autorites.find((a) => /acad[ée]mique/i.test(a.fonction));
  return sga ? { fonction: sga.fonction, nom: sga.nom } : null;
}
