"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { slugValide, versSlug } from "@/features/contenu/collections";
import { schemaBloc } from "@/features/contenu/donnees";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { FORMULAIRE_ACTUALITE, FORMULAIRE_FAQ } from "./definitions";
import { versDateBukavu } from "./dates";

function lireJson(formData: FormData) {
  try {
    return JSON.parse(String(formData.get("donnees") ?? ""));
  } catch {
    return null;
  }
}

/* ---------- Actualités ---------- */

export async function enregistrerActualite(
  id: string | null,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("actualites.gerer");
  const r = schemaBloc(FORMULAIRE_ACTUALITE).safeParse(lireJson(formData));
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const d = r.data as Record<string, string | null>;
  const titre = d.titre ?? "";
  const resume = d.resume ?? "";
  const contenu = d.contenu ?? "";
  if (!titre || !resume || !contenu) return echec("Le titre, le résumé et le texte sont requis.");
  const slug = d.slug || versSlug(titre);
  if (!slugValide(slug))
    return echec("Adresse de la page invalide : minuscules, chiffres et tirets uniquement.");
  if (await db.actualite.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) } }))
    return echec("Un autre article utilise déjà cette adresse.");
  const couvertureId = d.couverture ?? null;
  if (couvertureId && !(await db.media.findUnique({ where: { id: couvertureId } })))
    return echec("La photo choisie n'existe plus dans la médiathèque.");

  const donnees = { titre, slug, resume, contenu, couvertureId };
  if (id) {
    const avant = await db.actualite.findUnique({ where: { id } });
    if (!avant) return echec("Cet article n'existe plus.");
    await db.actualite.update({ where: { id }, data: donnees });
    await journaliser({
      auteurId: auteur.id,
      action: "actualite_modifiee",
      entite: "Actualite",
      entiteId: id,
      avant: { titre: avant.titre, slug: avant.slug },
      apres: { titre, slug },
    });
    updateTag(ETIQUETTES.actualites);
    refresh();
    return succes(
      avant.statut === "PUBLIE" ? "Article enregistré et publié." : "Brouillon enregistré.",
    );
  }
  const cree = await db.actualite.create({
    data: { ...donnees, statut: "BROUILLON", auteurId: auteur.id },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "actualite_creee",
    entite: "Actualite",
    entiteId: cree.id,
    apres: { titre, slug },
  });
  redirect(`/admin/actualites/${cree.id}`);
}

export async function publierActualite(id: string, publier: boolean): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("actualites.gerer");
  const a = await db.actualite.findUnique({ where: { id } });
  if (!a) return echec("Cet article n'existe plus.");
  await db.actualite.update({
    where: { id },
    data: publier
      ? { statut: "PUBLIE", publieLe: a.publieLe ?? new Date() }
      : { statut: "BROUILLON" },
  });
  await journaliser({
    auteurId: auteur.id,
    action: publier ? "actualite_publiee" : "actualite_retiree",
    entite: "Actualite",
    entiteId: id,
  });
  updateTag(ETIQUETTES.actualites);
  refresh();
  return succes(publier ? "Article publié." : "Article retiré du site.");
}

export async function supprimerActualite(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("actualites.gerer");
  const a = await db.actualite.findUnique({ where: { id } });
  if (!a) return echec("Cet article n'existe plus.");
  await db.actualite.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "actualite_supprimee",
    entite: "Actualite",
    entiteId: id,
    avant: { titre: a.titre, slug: a.slug },
  });
  updateTag(ETIQUETTES.actualites);
  redirect("/admin/actualites");
}

/* ---------- Agenda ---------- */

const schemaEvenement = z
  .object({
    titre: z.string().trim().min(1, "Indiquez un titre.").max(160),
    description: z.string().trim().max(1000),
    lieu: z.string().trim().max(160),
    debut: z.string().min(1, "Indiquez la date de début."),
    fin: z.string(),
  })
  .transform((e, ctx) => {
    const debut = versDateBukavu(e.debut);
    const fin = e.fin ? versDateBukavu(e.fin) : null;
    if (!debut) ctx.addIssue({ code: "custom", message: "Date de début invalide." });
    if (e.fin && !fin) ctx.addIssue({ code: "custom", message: "Date de fin invalide." });
    if (debut && fin && fin < debut)
      ctx.addIssue({ code: "custom", message: "La fin précède le début." });
    return { ...e, debut: debut!, fin };
  });

export async function enregistrerEvenement(
  id: string | null,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("actualites.gerer");
  const r = schemaEvenement.safeParse({
    titre: formData.get("titre") ?? "",
    description: formData.get("description") ?? "",
    lieu: formData.get("lieu") ?? "",
    debut: formData.get("debut") ?? "",
    fin: formData.get("fin") ?? "",
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const data = {
    titre: r.data.titre,
    description: r.data.description || null,
    lieu: r.data.lieu || null,
    debut: r.data.debut,
    fin: r.data.fin,
    statut: formData.get("publie") === "on" ? ("PUBLIE" as const) : ("BROUILLON" as const),
  };
  const e = id
    ? await db.evenement.update({ where: { id }, data })
    : await db.evenement.create({ data });
  await journaliser({
    auteurId: auteur.id,
    action: id ? "evenement_modifie" : "evenement_cree",
    entite: "Evenement",
    entiteId: e.id,
    apres: { titre: data.titre, debut: data.debut },
  });
  updateTag(ETIQUETTES.agenda);
  refresh();
  return succes(id ? "Événement enregistré." : "Événement ajouté à l'agenda.");
}

export async function supprimerEvenement(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("actualites.gerer");
  const e = await db.evenement.findUnique({ where: { id } });
  if (!e) return echec("Cet événement n'existe plus.");
  await db.evenement.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "evenement_supprime",
    entite: "Evenement",
    entiteId: id,
    avant: { titre: e.titre },
  });
  updateTag(ETIQUETTES.agenda);
  refresh();
  return succes("Événement supprimé.");
}

/* ---------- Questions fréquentes ---------- */

export async function enregistrerFaq(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const r = schemaBloc(FORMULAIRE_FAQ).safeParse(lireJson(formData));
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const lignes = (r.data.questions as { question: string; reponse: string }[]).filter(
    (q) => q.question || q.reponse,
  );
  if (lignes.some((q) => !q.question || !q.reponse))
    return echec("Chaque question doit avoir une réponse.");
  await db.$transaction([
    db.questionFrequente.deleteMany({ where: { rubrique: "admissions" } }),
    db.questionFrequente.createMany({
      data: lignes.map((q, ordre) => ({ ...q, rubrique: "admissions", ordre })),
    }),
  ]);
  await journaliser({
    auteurId: auteur.id,
    action: "faq_modifiee",
    entite: "QuestionFrequente",
    apres: lignes,
  });
  updateTag(ETIQUETTES.faq);
  return succes("Questions fréquentes enregistrées et publiées.");
}
