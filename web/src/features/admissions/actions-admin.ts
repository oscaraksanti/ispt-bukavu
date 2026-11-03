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
import { decisionPermise, LIBELLES_STATUT, lirePieces, motifRequis, type Statut } from "./regles";

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
    await envoyerEmail({
      a: c.candidat.email,
      sujet: `${LIBELLES_STATUT[vers]} — dossier n° ${c.numero}, ISPT-Bukavu`,
      texte: `Bonjour ${c.prenom ?? ""},\n\n${message}${motif ? `\n\nMessage du secrétariat :\n${motif}` : ""}\n\nVotre espace : ${urlSite()}/candidat\n\nISPT-Bukavu`,
    }).catch(() => undefined);
  refresh();
  return succes(
    `Décision enregistrée : ${LIBELLES_STATUT[vers]}. Le candidat est prévenu par email.`,
  );
}
