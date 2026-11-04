"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { notifier } from "@/features/notifications/emettre";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { moyenDeCandidatureValide, TYPES_OFFRE } from "./regles";

const PERMISSION = "stages.gerer" as const;

const schema = z.object({
  titre: z.string().trim().min(3, "Indiquez l'intitulé de l'offre.").max(140),
  type: z.enum(["STAGE", "EMPLOI", "BOURSE", "FORMATION"]),
  organisation: z.string().trim().min(2, "Indiquez l'organisation.").max(140),
  lieu: z.string().trim().max(100),
  description: z.string().trim().min(20, "Décrivez l'offre (20 caractères au moins).").max(5000),
  lienCandidature: z.string().trim().max(300),
  emailCandidature: z.string().trim().max(160),
  dateLimite: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Date limite invalide."),
});

async function lireOffre(fd: FormData) {
  const r = schema.safeParse(
    Object.fromEntries(Object.keys(schema.shape).map((k) => [k, String(fd.get(k) ?? "")])),
  );
  if (!r.success) return { erreur: echec(r.error.issues[0]?.message ?? "Valeurs invalides.") };
  const d = r.data;
  const probleme = moyenDeCandidatureValide(d.lienCandidature, d.emailCandidature);
  if (probleme) return { erreur: echec(probleme) };
  const filieres = [...new Set(fd.getAll("filieres").map(String))];
  const connues = filieres.length ? await db.filiere.count({ where: { id: { in: filieres } } }) : 0;
  if (connues !== filieres.length) return { erreur: echec("Filière inconnue.") };
  return {
    donnees: {
      titre: d.titre,
      type: d.type,
      organisation: d.organisation,
      lieu: d.lieu || null,
      description: d.description,
      lienCandidature: d.lienCandidature || null,
      emailCandidature: d.emailCandidature || null,
      dateLimite: d.dateLimite ? new Date(`${d.dateLimite}T00:00:00+02:00`) : null,
    },
    filieres,
  };
}

export async function creerOffre(_etat: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const { donnees, filieres, erreur } = await lireOffre(fd);
  if (erreur) return erreur;
  const o = await db.offreInsertion.create({
    data: {
      ...donnees,
      auteurId: auteur.id,
      filieres: { connect: filieres.map((id) => ({ id })) },
    },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "offre_creee",
    entite: "OffreInsertion",
    entiteId: o.id,
    apres: { titre: o.titre },
  });
  redirect(`/admin/offres/${o.id}`);
}

export async function modifierOffre(
  id: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  if (!(await db.offreInsertion.findUnique({ where: { id } })))
    return echec("Cette offre n'existe plus.");
  const { donnees, filieres, erreur } = await lireOffre(fd);
  if (erreur) return erreur;
  await db.offreInsertion.update({
    where: { id },
    data: { ...donnees, filieres: { set: filieres.map((f) => ({ id: f })) } },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "offre_modifiee",
    entite: "OffreInsertion",
    entiteId: id,
  });
  updateTag(ETIQUETTES.offres);
  refresh();
  return succes("Offre enregistrée.");
}

/**
 * Publication : l'offre paraît sur le site et les étudiants des filières visées
 * (ou de toutes les filières si aucune n'est précisée) sont prévenus.
 */
export async function publierOffre(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const o = await db.offreInsertion.findUnique({ where: { id }, include: { filieres: true } });
  if (!o) return echec("Cette offre n'existe plus.");
  if (o.statut === "PUBLIEE") return echec("L'offre est déjà publiée.");
  await db.offreInsertion.update({
    where: { id },
    data: { statut: "PUBLIEE", publieeLe: new Date() },
  });
  const inscriptions = await db.inscription.findMany({
    where: {
      statut: { in: ["EN_REGLE", "EN_ATTENTE"] },
      promotion: {
        annee: { courante: true },
        ...(o.filieres.length ? { filiereId: { in: o.filieres.map((f) => f.id) } } : {}),
      },
    },
    select: { etudiant: { select: { utilisateurId: true } } },
  });
  const n = await notifier(
    inscriptions.map((i) => i.etudiant.utilisateurId),
    {
      type: "OFFRE",
      titre: `${TYPES_OFFRE[o.type]} : ${o.titre}`,
      message: `${o.organisation}${o.lieu ? `, ${o.lieu}` : ""}.`,
      lien: `/offres/${o.id}`,
    },
  );
  await journaliser({
    auteurId: auteur.id,
    action: "offre_publiee",
    entite: "OffreInsertion",
    entiteId: id,
    apres: { notifies: n },
  });
  updateTag(ETIQUETTES.offres);
  refresh();
  return succes(`Offre publiée ; ${n} étudiant(s) prévenu(s).`);
}

export async function archiverOffre(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  if (!(await db.offreInsertion.findUnique({ where: { id } })))
    return echec("Cette offre n'existe plus.");
  await db.offreInsertion.update({ where: { id }, data: { statut: "ARCHIVEE" } });
  await journaliser({
    auteurId: auteur.id,
    action: "offre_archivee",
    entite: "OffreInsertion",
    entiteId: id,
  });
  updateTag(ETIQUETTES.offres);
  refresh();
  return succes("Offre retirée du site.");
}

export async function supprimerOffre(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission(PERMISSION);
  const o = await db.offreInsertion.findUnique({ where: { id } });
  if (!o) return echec("Cette offre n'existe plus.");
  if (o.statut === "PUBLIEE") return echec("Retirez d'abord l'offre du site.");
  await db.offreInsertion.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "offre_supprimee",
    entite: "OffreInsertion",
    entiteId: id,
    avant: { titre: o.titre },
  });
  updateTag(ETIQUETTES.offres);
  redirect("/admin/offres");
}
