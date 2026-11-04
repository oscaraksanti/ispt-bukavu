"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { versDateBukavu } from "@/features/actualites/dates";
import { aujourdhuiBukavu } from "@/features/horaires/regles";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { compteEtudiant, notifier } from "@/features/notifications/emettre";
import { estEnRegle, formatMontant, lireMontant, numeroRecu } from "./regles";
import { situationEtudiant } from "./requetes";

const texte = (fd: FormData, cle: string) => String(fd.get(cle) ?? "").trim();
const devise = z.enum(["USD", "CDF"]);

/* ---------- Barèmes ---------- */

export async function enregistrerBareme(
  id: string | null,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("finances.encaisser");
  const libelle = texte(fd, "libelle").slice(0, 120);
  const montant = lireMontant(texte(fd, "montant"));
  const d = devise.safeParse(texte(fd, "devise"));
  const echeance = texte(fd, "echeance");
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) return echec("Définissez d'abord l'année courante.");
  if (!libelle) return echec("Indiquez le libellé (par exemple : Frais académiques, 1re tranche).");
  if (montant === null) return echec("Montant invalide.");
  if (!d.success) return echec("Devise invalide.");
  const data = {
    anneeId: annee.id,
    libelle,
    montant,
    devise: d.data,
    niveauId: texte(fd, "niveauId") || null,
    filiereId: texte(fd, "filiereId") || null,
    echeance: echeance ? versDateBukavu(`${echeance}T23:59`) : null,
  };
  const b = id
    ? await db.baremeFrais.update({ where: { id }, data })
    : await db.baremeFrais.create({ data });
  await journaliser({
    auteurId: auteur.id,
    action: id ? "bareme_modifie" : "bareme_cree",
    entite: "BaremeFrais",
    entiteId: b.id,
    apres: { libelle, montant, devise: d.data },
  });
  refresh();
  return succes("Barème enregistré.");
}

export async function supprimerBareme(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("finances.encaisser");
  await db.baremeFrais.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "bareme_supprime",
    entite: "BaremeFrais",
    entiteId: id,
  });
  refresh();
  return succes("Barème supprimé.");
}

/* ---------- Paiements ---------- */

async function prochainNumero(annee: number) {
  const dernier = await db.paiement.findFirst({
    where: { numeroRecu: { startsWith: `R${annee}-` } },
    orderBy: { numeroRecu: "desc" },
  });
  const rang = dernier ? Number(dernier.numeroRecu.split("-")[1]) + 1 : 1;
  return numeroRecu(annee, rang);
}

/** Met l'inscription « en règle » dès que plus rien n'est dû (sans toucher une suspension). */
async function actualiserInscription(etudiantId: string) {
  const s = await situationEtudiant(etudiantId);
  if (!s?.inscription) return;
  const enRegle = estEnRegle(s.lignes);
  if (enRegle && s.inscription.statut === "EN_ATTENTE")
    await db.inscription.update({ where: { id: s.inscription.id }, data: { statut: "EN_REGLE" } });
  if (!enRegle && s.inscription.statut === "EN_REGLE")
    await db.inscription.update({
      where: { id: s.inscription.id },
      data: { statut: "EN_ATTENTE" },
    });
}

export async function enregistrerPaiement(
  etudiantId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("finances.encaisser");
  const montant = lireMontant(texte(fd, "montant"));
  const d = devise.safeParse(texte(fd, "devise"));
  const mode = z.enum(["BANQUE", "GUICHET", "MOBILE_MONEY", "AUTRE"]).safeParse(texte(fd, "mode"));
  const reference = texte(fd, "reference").slice(0, 80);
  const date = texte(fd, "payeLe");
  if (montant === null) return echec("Montant invalide.");
  if (!d.success || !mode.success) return echec("Devise ou mode de paiement invalide.");
  if (!reference) return echec("Indiquez la référence (bordereau, transaction, reçu de banque).");
  // Un paiement du jour est daté de maintenant (midi serait dans le futur le matin).
  const aujourdhui = aujourdhuiBukavu();
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > aujourdhui))
    return echec("Date de paiement invalide.");
  const payeLe = !date || date === aujourdhui ? new Date() : versDateBukavu(`${date}T12:00`);
  if (!payeLe) return echec("Date de paiement invalide.");
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) return echec("Définissez d'abord l'année courante.");
  if (await db.paiement.findFirst({ where: { reference, mode: mode.data, annuleLe: null } }))
    return echec("Cette référence de paiement est déjà enregistrée.");

  let paiement = null;
  for (let essai = 0; essai < 5 && !paiement; essai++) {
    try {
      paiement = await db.paiement.create({
        data: {
          etudiantId,
          anneeId: annee.id,
          montant,
          devise: d.data,
          mode: mode.data,
          reference,
          payeLe,
          numeroRecu: await prochainNumero(new Date().getFullYear()),
          enregistreParId: auteur.id,
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!paiement) return echec("Numérotation du reçu impossible, réessayez.");
  await actualiserInscription(etudiantId);
  await journaliser({
    auteurId: auteur.id,
    action: "paiement_enregistre",
    entite: "Paiement",
    entiteId: paiement.id,
    apres: { montant, devise: d.data, reference, numeroRecu: paiement.numeroRecu },
  });
  await notifier(await compteEtudiant(etudiantId), {
    type: "PAIEMENT",
    titre: "Paiement enregistré",
    message: `Votre paiement de ${formatMontant(montant, d.data)} est enregistré (reçu n° ${paiement.numeroRecu}).`,
    lien: "/etudiant/frais",
  });
  refresh();
  return succes(`Paiement enregistré. Reçu n° ${paiement.numeroRecu}.`);
}

export async function annulerPaiement(
  id: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("finances.encaisser");
  const motif = texte(fd, "motif").slice(0, 200);
  if (!motif) return echec("Indiquez le motif de l'annulation.");
  const p = await db.paiement.update({
    where: { id },
    data: { annuleLe: new Date(), motifAnnulation: motif },
  });
  await actualiserInscription(p.etudiantId);
  await journaliser({
    auteurId: auteur.id,
    action: "paiement_annule",
    entite: "Paiement",
    entiteId: id,
    apres: { motif },
  });
  await notifier(await compteEtudiant(p.etudiantId), {
    type: "PAIEMENT",
    titre: "Paiement annulé",
    message: `Le reçu n° ${p.numeroRecu} a été annulé par la caisse : ${motif}`,
    lien: "/etudiant/frais",
  });
  refresh();
  return succes("Paiement annulé : il reste visible dans l'historique.");
}

export async function ajouterExoneration(
  etudiantId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("finances.encaisser");
  const montant = lireMontant(texte(fd, "montant"));
  const d = devise.safeParse(texte(fd, "devise"));
  const motif = texte(fd, "motif").slice(0, 200);
  if (montant === null || !d.success) return echec("Montant ou devise invalide.");
  if (!motif) return echec("Indiquez le motif (bourse, réduction accordée…).");
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) return echec("Définissez d'abord l'année courante.");
  const e = await db.exoneration.create({
    data: { etudiantId, anneeId: annee.id, montant, devise: d.data, motif },
  });
  await actualiserInscription(etudiantId);
  await journaliser({
    auteurId: auteur.id,
    action: "exoneration_ajoutee",
    entite: "Exoneration",
    entiteId: e.id,
    apres: { montant, motif },
  });
  await notifier(await compteEtudiant(etudiantId), {
    type: "PAIEMENT",
    titre: "Exonération accordée",
    message: `Une exonération de ${formatMontant(montant, d.data)} est appliquée à vos frais : ${motif}`,
    lien: "/etudiant/frais",
  });
  refresh();
  return succes("Exonération enregistrée.");
}
