"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import {
  CATEGORIES_PARTENAIRES,
  type CategoriePartenaire,
  FORMULAIRE_AUTORITES,
  FORMULAIRE_FILIERE,
  FORMULAIRE_PARTENAIRES,
  slugValide,
} from "./collections";
import type { DefinitionBloc } from "./definitions";
import { schemaBloc } from "./donnees";
import { ETIQUETTES } from "./lecture";

type Libelle = { libelle: string };

function lire(definition: DefinitionBloc, formData: FormData) {
  let brut: unknown;
  try {
    brut = JSON.parse(String(formData.get("donnees") ?? ""));
  } catch {
    return { erreur: echec("Les données envoyées sont illisibles. Rechargez la page.") };
  }
  const r = schemaBloc(definition).safeParse(brut);
  if (!r.success)
    return {
      erreur: echec(r.error.issues[0]?.message ?? "Certaines valeurs ne sont pas valides."),
    };
  return { donnees: r.data as Record<string, unknown> };
}

const libelles = (liste: unknown) =>
  (liste as Libelle[]).map((e) => e.libelle.trim()).filter(Boolean);

/* ---------- Filières ---------- */

export async function enregistrerFiliere(
  id: string | null,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const { donnees, erreur } = lire(FORMULAIRE_FILIERE, formData);
  if (erreur) return erreur;

  const d = {
    nom: String(donnees.nom),
    nomCourt: String(donnees.nomCourt),
    slug: String(donnees.slug),
    accroche: String(donnees.accroche),
    presentation: String(donnees.presentation),
    debouches: String(donnees.debouches),
    entreprendre: String(donnees.entreprendre),
    domaines: libelles(donnees.domaines),
    metiers: libelles(donnees.metiers),
    photoId: (donnees.photo as string | null) ?? null,
  };
  const manquants = (
    [
      ["nom", "Nom complet"],
      ["nomCourt", "Nom court"],
      ["accroche", "Accroche"],
      ["presentation", "Présentation"],
    ] as const
  ).filter(([cle]) => !d[cle]);
  if (manquants.length) return echec(`À compléter : ${manquants.map(([, l]) => l).join(", ")}.`);
  if (!slugValide(d.slug))
    return echec("Adresse de la page invalide : minuscules, chiffres et tirets uniquement.");
  if (d.domaines.length === 0 || d.metiers.length === 0)
    return echec("Indiquez au moins un domaine et un métier.");

  const doublon = await db.filiere.findFirst({
    where: { slug: d.slug, ...(id ? { NOT: { id } } : {}) },
  });
  if (doublon) return echec("Une autre filière utilise déjà cette adresse.");
  if (d.photoId && !(await db.media.findUnique({ where: { id: d.photoId } })))
    return echec("La photo choisie n'existe plus dans la médiathèque.");

  if (id) {
    const avant = await db.filiere.findUnique({ where: { id } });
    if (!avant) return echec("Cette filière n'existe plus.");
    await db.filiere.update({ where: { id }, data: d });
    await journaliser({
      auteurId: auteur.id,
      action: "filiere_modifiee",
      entite: "Filiere",
      entiteId: id,
      avant,
      apres: d,
    });
    updateTag(ETIQUETTES.filieres);
    return succes("Filière enregistrée et publiée.");
  }

  const ordre = (await db.filiere.aggregate({ _max: { ordre: true } }))._max.ordre ?? -1;
  const creee = await db.filiere.create({ data: { ...d, ordre: ordre + 1, ouverte: false } });
  await journaliser({
    auteurId: auteur.id,
    action: "filiere_creee",
    entite: "Filiere",
    entiteId: creee.id,
    apres: d,
  });
  updateTag(ETIQUETTES.filieres);
  redirect(`/admin/site/filieres/${creee.id}?creee=1`);
}

export async function deplacerFiliere(id: string, sens: -1 | 1) {
  await exigerPermission("contenu.modifier");
  const filieres = await db.filiere.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }] });
  const i = filieres.findIndex((f) => f.id === id);
  const j = i + sens;
  if (i < 0 || j < 0 || j >= filieres.length) return;
  [filieres[i], filieres[j]] = [filieres[j], filieres[i]];
  await db.$transaction(
    filieres.map((f, ordre) => db.filiere.update({ where: { id: f.id }, data: { ordre } })),
  );
  updateTag(ETIQUETTES.filieres);
  refresh();
}

export async function publierFiliere(id: string, ouverte: boolean) {
  const auteur = await exigerPermission("contenu.modifier");
  await db.filiere.update({ where: { id }, data: { ouverte } });
  await journaliser({
    auteurId: auteur.id,
    action: ouverte ? "filiere_publiee" : "filiere_masquee",
    entite: "Filiere",
    entiteId: id,
  });
  updateTag(ETIQUETTES.filieres);
  refresh();
}

export async function supprimerFiliere(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const f = await db.filiere.findUnique({
    where: { id },
    include: {
      _count: {
        select: { promotions: true, unites: true, candidatures: true, campagnes: true },
      },
    },
  });
  if (!f) return echec("Cette filière n'existe plus.");
  const liens = Object.values(f._count).reduce((a, b) => a + b, 0);
  if (liens > 0)
    return echec(
      "Cette filière a déjà des promotions, des cours ou des candidatures : masquez-la plutôt que de la supprimer.",
    );
  await db.filiere.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "filiere_supprimee",
    entite: "Filiere",
    entiteId: id,
    avant: { nom: f.nom, slug: f.slug },
  });
  updateTag(ETIQUETTES.filieres);
  redirect("/admin/site/filieres");
}

/* ---------- Autorités ---------- */

export async function enregistrerAutorites(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const { donnees, erreur } = lire(FORMULAIRE_AUTORITES, formData);
  if (erreur) return erreur;
  const lignes = (donnees.autorites as { fonction: string; nom: string }[])
    .map((a) => ({ fonction: a.fonction.trim(), nom: a.nom.trim() }))
    .filter((a) => a.fonction || a.nom);
  if (lignes.some((a) => !a.fonction || !a.nom))
    return echec("Chaque autorité doit avoir une fonction et un nom.");

  const avant = await db.autorite.findMany({ orderBy: { ordre: "asc" } });
  await db.$transaction([
    db.autorite.deleteMany(),
    db.autorite.createMany({ data: lignes.map((a, ordre) => ({ ...a, ordre })) }),
  ]);
  await journaliser({
    auteurId: auteur.id,
    action: "autorites_modifiees",
    entite: "Autorite",
    avant: avant.map(({ fonction, nom }) => ({ fonction, nom })),
    apres: lignes,
  });
  updateTag(ETIQUETTES.autorites);
  return succes("Autorités enregistrées et publiées.");
}

/* ---------- Partenaires ---------- */

export async function enregistrerPartenaires(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const { donnees, erreur } = lire(FORMULAIRE_PARTENAIRES, formData);
  if (erreur) return erreur;

  const lignes = (Object.keys(CATEGORIES_PARTENAIRES) as CategoriePartenaire[]).flatMap(
    (categorie) =>
      (donnees[categorie] as { nom: string }[])
        .map((p) => p.nom.trim())
        .filter(Boolean)
        .map((nom, ordre) => ({ nom, categorie, ordre })),
  );

  await db.$transaction([db.partenaire.deleteMany(), db.partenaire.createMany({ data: lignes })]);
  await journaliser({
    auteurId: auteur.id,
    action: "partenaires_modifies",
    entite: "Partenaire",
    apres: lignes,
  });
  updateTag(ETIQUETTES.partenaires);
  return succes("Partenaires enregistrés et publiés.");
}
