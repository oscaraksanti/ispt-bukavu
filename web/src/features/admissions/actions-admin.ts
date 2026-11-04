"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { versDateBukavu } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import { envoyerEmail, urlSite } from "@/lib/email";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { notifier } from "@/features/notifications/emettre";
import {
  decisionPermise,
  fraisExiges,
  LIBELLES_STATUT,
  lirePieces,
  motifRequis,
  numeroRecuDossier,
  type Statut,
} from "./regles";

/* ---------- Campagnes ---------- */

const schemaCampagne = z.object({
  libelle: z.string().trim().min(3, "Indiquez un intitulé.").max(120),
  anneeId: z.string().min(1, "Choisissez l'année académique."),
  ouverture: z.string().min(1, "Indiquez la date d'ouverture."),
  cloture: z.string().min(1, "Indiquez la date de clôture."),
  frais: z.string().regex(/^\d+([.,]\d{1,2})?$/, "Montant des frais invalide."),
  devise: z.enum(["USD", "CDF"]),
  pieces: z.string().max(4000),
});

export async function enregistrerCampagne(
  id: string | null,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("admissions.campagnes");
  const r = schemaCampagne.safeParse({
    libelle: formData.get("libelle") ?? "",
    anneeId: formData.get("anneeId") ?? "",
    ouverture: formData.get("ouverture") ?? "",
    cloture: formData.get("cloture") ?? "",
    frais: formData.get("frais") ?? "",
    devise: formData.get("devise") ?? "USD",
    pieces: formData.get("pieces") ?? "",
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const ouverture = versDateBukavu(`${r.data.ouverture}T00:00`);
  const cloture = versDateBukavu(`${r.data.cloture}T23:59`);
  if (!ouverture || !cloture) return echec("Dates invalides.");
  if (cloture <= ouverture) return echec("La clôture doit suivre l'ouverture.");
  const filieres = formData.getAll("filieres").map(String);
  if (filieres.length === 0) return echec("Ouvrez au moins une filière.");
  const pieces = lirePieces(r.data.pieces);
  if (pieces.length === 0) return echec("Indiquez au moins une pièce à fournir.");

  const donnees = {
    libelle: r.data.libelle,
    anneeId: r.data.anneeId,
    ouverture,
    cloture,
    fraisInscription: r.data.frais.replace(",", "."),
    devise: r.data.devise,
  };

  if (!id) {
    const c = await db.campagneAdmission.create({
      data: {
        ...donnees,
        filieres: { connect: filieres.map((fid) => ({ id: fid })) },
        pieces: { create: pieces },
      },
    });
    await journaliser({
      auteurId: auteur.id,
      action: "campagne_creee",
      entite: "CampagneAdmission",
      entiteId: c.id,
      apres: { libelle: c.libelle },
    });
    redirect(`/admin/admissions/campagnes/${c.id}`);
  }

  const existante = await db.campagneAdmission.findUnique({
    where: { id },
    include: { pieces: { include: { _count: { select: { depots: true } } } } },
  });
  if (!existante) return echec("Cette campagne n'existe plus.");
  const conservees = new Set<string>();
  const operations = [];
  for (const p of pieces) {
    const deja = existante.pieces.find((x) => x.libelle === p.libelle);
    if (deja) {
      conservees.add(deja.id);
      operations.push(db.pieceExigee.update({ where: { id: deja.id }, data: p }));
    } else {
      operations.push(db.pieceExigee.create({ data: { ...p, campagneId: id } }));
    }
  }
  const aRetirer = existante.pieces.filter((x) => !conservees.has(x.id));
  const bloquees = aRetirer.filter((x) => x._count.depots > 0);
  if (bloquees.length > 0)
    return echec(
      `Des candidats ont déjà déposé : ${bloquees.map((b) => b.libelle).join(", ")}. Ces pièces ne peuvent pas être retirées.`,
    );
  await db.$transaction([
    db.campagneAdmission.update({
      where: { id },
      data: { ...donnees, filieres: { set: filieres.map((fid) => ({ id: fid })) } },
    }),
    ...aRetirer.map((x) => db.pieceExigee.delete({ where: { id: x.id } })),
    ...operations,
  ]);
  await journaliser({
    auteurId: auteur.id,
    action: "campagne_modifiee",
    entite: "CampagneAdmission",
    entiteId: id,
    apres: { libelle: donnees.libelle },
  });
  updateTag(ETIQUETTES.admissions);
  refresh();
  return succes("Campagne enregistrée.");
}

export async function changerStatutCampagne(
  id: string,
  statut: "OUVERTE" | "FERMEE" | "BROUILLON",
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("admissions.campagnes");
  await db.campagneAdmission.update({ where: { id }, data: { statut } });
  await journaliser({
    auteurId: auteur.id,
    action: statut === "OUVERTE" ? "campagne_ouverte" : "campagne_fermee",
    entite: "CampagneAdmission",
    entiteId: id,
  });
  updateTag(ETIQUETTES.admissions);
  refresh();
  return succes(statut === "OUVERTE" ? "Campagne publiée." : "Campagne fermée.");
}

/* ---------- Instruction des dossiers ---------- */

export async function statuerPiece(
  depotId: string,
  statut: "ACCEPTEE" | "REJETEE" | "DEPOSEE",
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("admissions.decider");
  const commentaire = String(formData.get("commentaire") ?? "")
    .trim()
    .slice(0, 500);
  if (statut === "REJETEE" && !commentaire)
    return echec("Expliquez au candidat ce qui ne convient pas.");
  const depot = await db.pieceDeposee.findUnique({ where: { id: depotId } });
  if (!depot) return echec("Pièce introuvable.");
  await db.pieceDeposee.update({
    where: { id: depotId },
    data: { statut, commentaire: statut === "REJETEE" ? commentaire : null },
  });
  await journaliser({
    auteurId: auteur.id,
    action: statut === "REJETEE" ? "piece_rejetee" : "piece_acceptee",
    entite: "PieceDeposee",
    entiteId: depotId,
  });
  if (statut === "REJETEE") {
    const c = await db.candidature.findUnique({
      where: { id: depot.candidatureId },
      select: {
        candidatId: true,
        numero: true,
        prenom: true,
        candidat: { select: { email: true } },
        pieces: { where: { id: depotId }, select: { pieceExigee: { select: { libelle: true } } } },
      },
    });
    if (c) {
      await notifier([c.candidatId], {
        type: "CANDIDATURE",
        titre: "Une pièce de votre dossier est à remplacer",
        message: commentaire,
        lien: "/candidat",
      });
      const piece = c.pieces[0]?.pieceExigee.libelle ?? "une pièce";
      if (c.candidat.email)
        await envoyerEmail({
          a: c.candidat.email,
          sujet: `Dossier n° ${c.numero} : une pièce est à remplacer — ISPT-Bukavu`,
          texte: `Bonjour ${c.prenom ?? ""},\n\nLe secrétariat ne peut pas accepter la pièce « ${piece} » de votre dossier.\n\nMotif : ${commentaire}\n\nVous pourrez en déposer une nouvelle version depuis votre espace (dès que le dossier est ouvert aux compléments) :\n${urlSite()}/candidat\n\nISPT-Bukavu`,
        }).catch(() => undefined);
    }
  }
  refresh();
  return succes(statut === "REJETEE" ? "Pièce refusée." : "Pièce vérifiée.");
}

const MESSAGES: Partial<Record<Statut, (numero: string) => string>> = {
  EN_EXAMEN: (n) => `Votre dossier n° ${n} est en cours d'examen par le secrétariat.`,
  COMPLEMENT: (n) =>
    `Votre dossier n° ${n} nécessite un complément. Connectez-vous pour voir ce qui est demandé, puis déposez à nouveau votre dossier.`,
  ADMISE: (n) =>
    `Félicitations : votre candidature n° ${n} est retenue. Le secrétariat vous indiquera les modalités d'inscription.`,
  REFUSEE: (n) => `Votre candidature n° ${n} n'a pas été retenue.`,
  INSCRITE: (n) => `Votre inscription est confirmée (dossier n° ${n}). Bienvenue à l'ISPT-Bukavu.`,
};

export async function deciderCandidature(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("admissions.decider");
  const vers = String(formData.get("decision") ?? "") as Statut;
  const motif = String(formData.get("motif") ?? "")
    .trim()
    .slice(0, 1000);
  const c = await db.candidature.findUnique({ where: { id }, include: { candidat: true } });
  if (!c) return echec("Ce dossier n'existe plus.");
  if (!decisionPermise(c.statut as Statut, vers))
    return echec("Cette décision n'est pas possible à ce stade du dossier.");
  if (motifRequis(vers) && !motif) return echec("Indiquez le motif communiqué au candidat.");

  const decisive = vers === "ADMISE" || vers === "REFUSEE";
  await db.candidature.update({
    where: { id },
    data: {
      statut: vers,
      ...(decisive
        ? { decideLe: new Date(), decideParId: auteur.id, motifDecision: motif || null }
        : {}),
      historique: { create: { statut: vers, commentaire: motif || null, auteurId: auteur.id } },
    },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "candidature_decision",
    entite: "Candidature",
    entiteId: id,
    avant: { statut: c.statut },
    apres: { statut: vers, motif },
  });
  const message = MESSAGES[vers]?.(c.numero);
  if (message)
    await notifier([c.candidatId], {
      type: "CANDIDATURE",
      titre: `${LIBELLES_STATUT[vers]} — dossier n° ${c.numero}`,
      message: motif ? `${message} Message du secrétariat : ${motif}` : message,
      lien: "/candidat",
    });
  if (message && c.candidat.email)
    await envoyerEmail({
      a: c.candidat.email,
      sujet: `${LIBELLES_STATUT[vers]} — dossier n° ${c.numero}, ISPT-Bukavu`,
      texte: `Bonjour ${c.prenom ?? ""},\n\n${message}${motif ? `\n\nMessage du secrétariat :\n${motif}` : ""}\n\nVotre espace : ${urlSite()}/candidat\n\nISPT-Bukavu`,
    }).catch(() => undefined);
  refresh();
  return succes(
    `Décision enregistrée : ${LIBELLES_STATUT[vers]}. Le candidat en est informé dans son espace${c.candidat.email ? " et par email" : ""}.`,
  );
}

/* ---------- Frais de dossier (caisse) ---------- */

async function dossierPourCaisse(id: string) {
  const c = await db.candidature.findUnique({
    where: { id },
    include: { campagne: true, candidat: { select: { email: true } } },
  });
  if (!c) return { erreur: echec("Ce dossier n'existe plus.") };
  if (c.paiementVerifieLe) return { erreur: echec("Ce paiement est déjà vérifié.") };
  if (!fraisExiges(c.campagne)) return { erreur: echec("Cette campagne ne fixe pas de frais.") };
  if (!c.referencePaiement) return { erreur: echec("Le candidat n'a indiqué aucune référence.") };
  return { c };
}

/**
 * La caisse confirme avoir reçu les frais de dossier : un reçu numéroté est
 * émis, avec le montant de la campagne figé à cette date.
 */
export async function verifierPaiementDossier(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("finances.encaisser");
  const { c, erreur } = await dossierPourCaisse(id);
  if (erreur) return erreur;
  const annee = new Date().getFullYear();
  let numero = "";
  for (let essai = 0; essai < 5 && !numero; essai++) {
    const rang =
      (await db.candidature.count({ where: { numeroRecu: { startsWith: `AD-${annee}-` } } })) +
      1 +
      essai;
    try {
      const r = await db.candidature.updateMany({
        where: { id, paiementVerifieLe: null },
        data: {
          numeroRecu: numeroRecuDossier(annee, rang),
          paiementVerifieLe: new Date(),
          paiementVerifieParId: auteur.id,
          paiementMotifRefus: null,
          montantFrais: c.campagne.fraisInscription,
          deviseFrais: c.campagne.devise,
        },
      });
      if (r.count !== 1) return echec("Ce paiement vient d'être vérifié par quelqu'un d'autre.");
      numero = numeroRecuDossier(annee, rang);
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!numero) return echec("Numérotation du reçu impossible, réessayez.");
  await journaliser({
    auteurId: auteur.id,
    action: "paiement_dossier_verifie",
    entite: "Candidature",
    entiteId: id,
    apres: { numeroRecu: numero, reference: c.referencePaiement },
  });
  await notifier([c.candidatId], {
    type: "CANDIDATURE",
    titre: "Frais de dossier reçus",
    message: `La caisse a vérifié votre paiement (dossier n° ${c.numero}). Reçu n° ${numero}.`,
    lien: "/candidat",
  });
  if (c.candidat.email)
    await envoyerEmail({
      a: c.candidat.email,
      sujet: `Frais de dossier reçus — reçu n° ${numero}, ISPT-Bukavu`,
      texte: `Bonjour ${c.prenom ?? ""},\n\nLa caisse de l'institut a vérifié le paiement des frais de votre dossier n° ${c.numero}. Votre reçu n° ${numero} est disponible dans votre espace :\n${urlSite()}/candidat\n\nISPT-Bukavu`,
    }).catch(() => undefined);
  refresh();
  return succes(`Paiement vérifié. Reçu n° ${numero} émis.`);
}

/** La référence indiquée ne correspond à aucun paiement reçu : le candidat est prévenu. */
export async function refuserPaiementDossier(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("finances.encaisser");
  const motif = String(formData.get("motif") ?? "")
    .trim()
    .slice(0, 300);
  if (!motif) return echec("Expliquez au candidat pourquoi le paiement n'est pas reconnu.");
  const { c, erreur } = await dossierPourCaisse(id);
  if (erreur) return erreur;
  await db.candidature.update({ where: { id }, data: { paiementMotifRefus: motif } });
  await journaliser({
    auteurId: auteur.id,
    action: "paiement_dossier_refuse",
    entite: "Candidature",
    entiteId: id,
    apres: { motif, reference: c.referencePaiement },
  });
  await notifier([c.candidatId], {
    type: "CANDIDATURE",
    titre: "Paiement des frais de dossier non reconnu",
    message: motif,
    lien: "/candidat",
  });
  if (c.candidat.email)
    await envoyerEmail({
      a: c.candidat.email,
      sujet: `Frais de dossier n° ${c.numero} : paiement non reconnu — ISPT-Bukavu`,
      texte: `Bonjour ${c.prenom ?? ""},\n\nLa caisse n'a pas pu rattacher la référence « ${c.referencePaiement} » à un paiement reçu.\n\nMessage de la caisse :\n${motif}\n\nCorrigez la référence depuis votre espace :\n${urlSite()}/candidat\n\nISPT-Bukavu`,
    }).catch(() => undefined);
  refresh();
  return succes("Le candidat est invité à corriger sa référence.");
}
