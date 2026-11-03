"use server";

import { refresh } from "next/cache";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { ajouterJours, bornesPlage, type CleePlage, lundiDe, PLAGES } from "./regles";

function plageValide(p: string): p is CleePlage {
  return PLAGES.some((x) => x.cle === p);
}

/** Place un cours (ou rien) dans une case de l'horaire d'une promotion. */
export async function definirCreneau(
  promotionId: string,
  jour: string,
  plage: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.horaires");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour) || !plageValide(plage)) return echec("Case invalide.");
  const coursOffertId = String(fd.get("coursOffertId") ?? "");
  const salle =
    String(fd.get("salle") ?? "")
      .trim()
      .slice(0, 60) || null;
  const { debut, fin } = bornesPlage(jour, plage);
  const existante = await db.seance.findFirst({
    where: { debut, coursOffert: { promotionId } },
  });
  if (!coursOffertId) {
    if (existante) await db.seance.delete({ where: { id: existante.id } });
  } else {
    const co = await db.coursOffert.findUnique({ where: { id: coursOffertId } });
    if (!co || co.promotionId !== promotionId)
      return echec("Ce cours n'appartient pas à la promotion.");
    if (existante)
      await db.seance.update({
        where: { id: existante.id },
        data: { coursOffertId, salle, statut: "PREVUE", remarque: null },
      });
    else await db.seance.create({ data: { coursOffertId, debut, fin, salle } });
  }
  await journaliser({
    auteurId: auteur.id,
    action: "horaire_modifie",
    entite: "Promotion",
    entiteId: promotionId,
    apres: { jour, plage, coursOffertId: coursOffertId || null, salle },
  });
  refresh();
  return succes("Enregistré.");
}

/** Reprend, pour la semaine indiquée, l'horaire de la semaine précédente (cases vides seulement). */
export async function copierSemainePrecedente(
  niveauId: string,
  lundi: string,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.horaires");
  const debutSemaine = lundiDe(lundi);
  if (!debutSemaine) return echec("Semaine invalide.");
  const source = ajouterJours(debutSemaine, -7);
  const seances = await db.seance.findMany({
    where: {
      debut: {
        gte: new Date(`${source}T00:00:00+02:00`),
        lt: new Date(`${debutSemaine}T00:00:00+02:00`),
      },
      statut: { not: "ANNULEE" },
      coursOffert: { promotion: { niveauId, annee: { courante: true } } },
    },
    include: { coursOffert: true },
  });
  if (seances.length === 0) return echec("La semaine précédente est vide.");
  const semaine = 7 * 24 * 3600 * 1000;
  let copiees = 0;
  for (const s of seances) {
    const debut = new Date(s.debut.getTime() + semaine);
    const deja = await db.seance.findFirst({
      where: { debut, coursOffert: { promotionId: s.coursOffert.promotionId } },
    });
    if (deja) continue;
    await db.seance.create({
      data: {
        coursOffertId: s.coursOffertId,
        debut,
        fin: new Date(s.fin.getTime() + semaine),
        salle: s.salle,
      },
    });
    copiees++;
  }
  await journaliser({
    auteurId: auteur.id,
    action: "horaire_copie",
    entite: "Niveau",
    entiteId: niveauId,
    apres: { semaine: debutSemaine, copiees },
  });
  refresh();
  return succes(`${copiees} séance(s) reprise(s) de la semaine précédente.`);
}

/** Reporte ou annule une séance, avec un motif visible des étudiants. */
export async function changerStatutSeance(
  seanceId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("academique.horaires");
  const statut = String(fd.get("statut") ?? "PREVUE");
  if (!["PREVUE", "REPORTEE", "ANNULEE"].includes(statut)) return echec("État invalide.");
  const remarque =
    String(fd.get("remarque") ?? "")
      .trim()
      .slice(0, 200) || null;
  await db.seance.update({
    where: { id: seanceId },
    data: { statut: statut as "PREVUE" | "REPORTEE" | "ANNULEE", remarque },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "seance_modifiee",
    entite: "Seance",
    entiteId: seanceId,
    apres: { statut, remarque },
  });
  refresh();
  return succes("Séance mise à jour.");
}
