"use server";

import { updateTag } from "next/cache";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { type DefinitionBloc, definitionBloc, definitionPage } from "./definitions";
import { imagesDuBloc, schemaBloc } from "./donnees";
import { ETIQUETTES } from "./lecture";
import { REGLAGES_DOCUMENTS, REGLAGES_INSTITUT } from "./reglages";

/** Lit et valide les données envoyées par l'éditeur de bloc. */
async function validerDonnees(definition: DefinitionBloc, formData: FormData) {
  let brut: unknown;
  try {
    brut = JSON.parse(String(formData.get("donnees") ?? ""));
  } catch {
    return { erreur: echec("Les données envoyées sont illisibles. Rechargez la page.") };
  }
  const resultat = schemaBloc(definition).safeParse(brut);
  if (!resultat.success) {
    const premiere = resultat.error.issues[0];
    return { erreur: echec(premiere?.message ?? "Certaines valeurs ne sont pas valides.") };
  }
  const donnees = resultat.data as Record<string, unknown>;
  const images = imagesDuBloc(definition, donnees);
  if (images.length > 0) {
    const trouvees = await db.media.count({ where: { id: { in: images } } });
    if (trouvees !== images.length)
      return { erreur: echec("Une image sélectionnée n'existe plus dans la médiathèque.") };
  }
  return { donnees };
}

export async function enregistrerBloc(
  slug: string,
  cle: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const page = definitionPage(slug);
  const definition = definitionBloc(slug, cle);
  if (!page || !definition) return echec("Section introuvable.");

  const { donnees, erreur } = await validerDonnees(definition, formData);
  if (erreur) return erreur;
  // La case n'est envoyée que cochée : sans le champ témoin, la visibilité reste inchangée.
  const visibleTransmis = formData.has("visibilite");
  const visible = formData.get("visible") === "on";

  const enregistrementPage = await db.page.upsert({
    where: { slug },
    update: {},
    create: { slug, titre: page.titre },
  });
  const ordre = page.blocs.findIndex((b) => b.cle === cle);
  const avant = await db.blocPage.findUnique({
    where: { pageId_cle: { pageId: enregistrementPage.id, cle } },
  });
  const bloc = await db.blocPage.upsert({
    where: { pageId_cle: { pageId: enregistrementPage.id, cle } },
    update: { donnees: donnees as object, ...(visibleTransmis ? { visible } : {}) },
    create: {
      pageId: enregistrementPage.id,
      cle,
      ordre,
      donnees: donnees as object,
      visible: visibleTransmis ? visible : true,
    },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "contenu_modifie",
    entite: "BlocPage",
    entiteId: bloc.id,
    avant: avant ? { donnees: avant.donnees, visible: avant.visible } : null,
    apres: { page: slug, bloc: cle, donnees, visible: bloc.visible },
  });
  updateTag(ETIQUETTES.page(slug));
  return succes(`« ${definition.titre} » est enregistré et publié.`);
}

export async function enregistrerReglages(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const { donnees, erreur } = await validerDonnees(REGLAGES_INSTITUT, formData);
  if (erreur) return erreur;
  const avant = await db.reglage.findUnique({ where: { cle: REGLAGES_INSTITUT.cle } });
  await db.reglage.upsert({
    where: { cle: REGLAGES_INSTITUT.cle },
    update: { valeur: donnees as object },
    create: { cle: REGLAGES_INSTITUT.cle, valeur: donnees as object },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "reglages_modifies",
    entite: "Reglage",
    entiteId: REGLAGES_INSTITUT.cle,
    avant: avant?.valeur ?? null,
    apres: donnees,
  });
  updateTag(ETIQUETTES.reglages);
  return succes("Les informations de l'institut sont enregistrées et publiées.");
}

/** Paramètres des documents officiels : réservés à qui émet les documents. */
export async function enregistrerReglagesDocuments(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("documents.emettre");
  const { donnees, erreur } = await validerDonnees(REGLAGES_DOCUMENTS, formData);
  if (erreur) return erreur;
  const avant = await db.reglage.findUnique({ where: { cle: REGLAGES_DOCUMENTS.cle } });
  await db.reglage.upsert({
    where: { cle: REGLAGES_DOCUMENTS.cle },
    update: { valeur: donnees as object },
    create: { cle: REGLAGES_DOCUMENTS.cle, valeur: donnees as object },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "reglages_modifies",
    entite: "Reglage",
    entiteId: REGLAGES_DOCUMENTS.cle,
    avant: avant?.valeur ?? null,
    apres: donnees,
  });
  return succes("Les paramètres des documents sont enregistrés.");
}
