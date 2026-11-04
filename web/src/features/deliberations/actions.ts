"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { versDateBukavu } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { ETIQUETTE_DOCUMENTS } from "@/features/documents/verification";
import { notifier } from "@/features/notifications/emettre";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { codeVerification } from "@/lib/securite";
import { donneesBulletin } from "./bulletin";
import {
  INCLURE_DELIBERATION,
  libellePeriode,
  notesDeLaPromotion,
  reglementDe,
  reglementDeLAnnee,
} from "./donnees";
import {
  calculerPromotion,
  controles,
  type Periode,
  REGLEMENT_PAR_DEFAUT,
  type Reglement,
  reglementComplet,
} from "./regles";

const PERMISSION = "academique.notes.valider";

/* ---------- Règlement ---------- */

const nombre = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => Number(v.replace(",", ".")))
    .pipe(z.number().min(min).max(max));

export async function enregistrerReglement(
  anneeId: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerPermission(PERMISSION);
  const t = (k: string) => String(fd.get(k) ?? "");
  const schema = z.object({
    seuilValidation: nombre(0, 20),
    seuilAdmissionDette: nombre(0, 20),
    zoneVigilance: nombre(0, 5),
    niveauValidation: z.enum(["COURS", "UE"]),
    calculMoyenne: z.enum(["PONDEREE", "SIMPLE"]),
    arrondi: z.enum(["JURY", "DEMI_POINT", "AUCUN"]),
    coursNonPresente: z.enum(["ZERO", "BLOQUANT"]),
  });
  const r = schema.safeParse(Object.fromEntries(Object.keys(schema.shape).map((k) => [k, t(k)])));
  if (!r.success) return echec("Valeurs invalides : vérifiez les seuils (0 à 20).");
  const plafondSaisi = t("plafondCreditsDette").trim();
  const plafond = plafondSaisi === "" ? null : Number(plafondSaisi);
  if (plafond !== null && (!Number.isInteger(plafond) || plafond < 0 || plafond > 240))
    return echec("Plafond de crédits invalide (nombre entier, ou vide).");
  const mentions = REGLEMENT_PAR_DEFAUT.mentions.map((_, i) => ({
    seuil: Number(t(`mention-seuil-${i}`).replace(",", ".")),
    lettre: t(`mention-lettre-${i}`).trim().slice(0, 3),
    libelle: t(`mention-libelle-${i}`).trim().slice(0, 40),
  }));
  if (mentions.some((m) => !m.lettre || !m.libelle || !(m.seuil >= 0 && m.seuil <= 20)))
    return echec("Échelle des mentions incomplète.");
  if (!mentions.some((m) => m.seuil === 0)) return echec("Une mention doit commencer à 0.");
  const regles: Reglement = reglementComplet({
    ...r.data,
    plafondCreditsDette: plafond,
    mentions,
    decisions: {
      ADM: t("decision-ADM").trim().slice(0, 60) || REGLEMENT_PAR_DEFAUT.decisions.ADM,
      COMP: t("decision-COMP").trim().slice(0, 60) || REGLEMENT_PAR_DEFAUT.decisions.COMP,
      RATTRAPAGE:
        t("decision-RATTRAPAGE").trim().slice(0, 60) || REGLEMENT_PAR_DEFAUT.decisions.RATTRAPAGE,
    },
    secretaireJury: t("secretaireJury").trim().slice(0, 120),
    presidentJury: t("presidentJury").trim().slice(0, 120),
  });
  await db.reglementAcademique.upsert({
    where: { anneeId },
    update: { regles: regles as unknown as Prisma.InputJsonValue, majParId: u.id },
    create: { anneeId, regles: regles as unknown as Prisma.InputJsonValue, majParId: u.id },
  });
  await journaliser({
    auteurId: u.id,
    action: "reglement_modifie",
    entite: "AnneeAcademique",
    entiteId: anneeId,
    apres: regles,
  });
  refresh();
  return succes(
    "Règlement enregistré. Il s'applique aux délibérations en préparation ; celles déjà clôturées gardent leur règlement.",
  );
}

/* ---------- Délibération ---------- */

async function chargerDeliberation(id: string) {
  return db.deliberation.findUnique({ where: { id }, include: INCLURE_DELIBERATION });
}

/** (Re)calcule les résultats ; les décisions du jury déjà saisies sont conservées. */
async function calculer(id: string) {
  const d = await chargerDeliberation(id);
  if (!d) throw new Error("Délibération introuvable");
  const { reglement } = await reglementDeLAnnee(d.promotion.anneeId);
  const { etudiants } = await notesDeLaPromotion(d.promotionId, d.periode as Periode, d.semestre);
  const resultats = calculerPromotion(etudiants, reglement, d.periode as Periode);
  const existants = await db.resultatDeliberation.findMany({ where: { deliberationId: id } });
  await db.$transaction([
    db.resultatDeliberation.deleteMany({
      where: { deliberationId: id, etudiantId: { notIn: resultats.map((r) => r.etudiantId) } },
    }),
    ...resultats.map((r) => {
      const jury = existants.find((e) => e.etudiantId === r.etudiantId);
      const donnees = {
        moyenne: r.moyenne,
        moyenneBrute: r.moyenneBrute,
        total: r.total,
        creditsValides: r.creditsValides,
        creditsTotal: r.creditsTotal,
        coursNonPresentes: r.coursNonPresentes,
        mention: r.mention?.lettre ?? null,
        mentionLibelle: r.mention?.libelle ?? null,
        rang: r.rang,
        decisionProposee: r.decision,
        casLimite: r.casLimite,
        details: r.cours as unknown as Prisma.InputJsonValue,
        // Une décision du jury identique à la proposition n'a plus lieu d'être.
        ...(jury?.decisionJury && jury.decisionJury === r.decision
          ? { decisionJury: null, motifJury: null }
          : {}),
      };
      return db.resultatDeliberation.upsert({
        where: { deliberationId_etudiantId: { deliberationId: id, etudiantId: r.etudiantId } },
        update: donnees,
        create: { ...donnees, deliberationId: id, etudiantId: r.etudiantId },
      });
    }),
    db.deliberation.update({
      where: { id },
      data: {
        regles: reglement as unknown as Prisma.InputJsonValue,
        calculeLe: new Date(),
        secretaireJury: d.secretaireJury || reglement.secretaireJury || null,
        presidentJury: d.presidentJury || reglement.presidentJury || null,
      },
    }),
  ]);
  return resultats.length;
}

export async function ouvrirDeliberation(promotionId: string, periode: Periode, semestre: number) {
  const u = await exigerPermission(PERMISSION);
  const s = periode === "ANNUELLE" ? 0 : semestre;
  const d = await db.deliberation.upsert({
    where: { promotionId_periode_semestre: { promotionId, periode, semestre: s } },
    update: {},
    create: { promotionId, periode, semestre: s },
  });
  if (d.statut === "PREPARATION") await calculer(d.id);
  await journaliser({
    auteurId: u.id,
    action: "deliberation_ouverte",
    entite: "Deliberation",
    entiteId: d.id,
  });
  redirect(`/admin/deliberations/${d.id}`);
}

export async function recalculer(id: string): Promise<EtatFormulaire> {
  await exigerPermission(PERMISSION);
  const d = await db.deliberation.findUnique({ where: { id } });
  if (!d) return echec("Délibération introuvable.");
  if (d.statut !== "PREPARATION") return echec("Le jury est clôturé : rouvrez-le pour recalculer.");
  const n = await calculer(id);
  refresh();
  return succes(`Résultats recalculés pour ${n} étudiant(s) avec les notes publiées actuelles.`);
}

export async function enregistrerJury(
  id: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerPermission(PERMISSION);
  const d = await db.deliberation.findUnique({ where: { id } });
  if (!d) return echec("Délibération introuvable.");
  if (d.statut === "PROCLAMEE")
    return echec("Les résultats sont proclamés : le jury ne peut plus être modifié.");
  const date = String(fd.get("dateJury") ?? "");
  const dateJury = date ? versDateBukavu(`${date}T09:00`) : null;
  await db.deliberation.update({
    where: { id },
    data: {
      dateJury,
      secretaireJury:
        String(fd.get("secretaireJury") ?? "")
          .trim()
          .slice(0, 120) || null,
      presidentJury:
        String(fd.get("presidentJury") ?? "")
          .trim()
          .slice(0, 120) || null,
    },
  });
  await journaliser({
    auteurId: u.id,
    action: "jury_modifie",
    entite: "Deliberation",
    entiteId: id,
  });
  refresh();
  return succes("Composition du jury enregistrée.");
}

export async function deciderJury(
  resultatId: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerPermission(PERMISSION);
  const r = await db.resultatDeliberation.findUnique({
    where: { id: resultatId },
    include: { deliberation: true },
  });
  if (!r) return echec("Résultat introuvable.");
  if (r.deliberation.statut !== "PREPARATION") return echec("Le jury est clôturé.");
  if (r.deliberation.periode !== "ANNUELLE")
    return echec("Les décisions portent sur le résultat annuel.");
  const decision = String(fd.get("decision") ?? "");
  const motif = String(fd.get("motif") ?? "")
    .trim()
    .slice(0, 500);
  if (decision && !["ADM", "COMP", "RATTRAPAGE"].includes(decision))
    return echec("Décision invalide.");
  const retour = !decision || decision === r.decisionProposee;
  if (!retour && motif.length < 5) return echec("Indiquez le motif de la décision du jury.");
  await db.resultatDeliberation.update({
    where: { id: resultatId },
    data: retour
      ? { decisionJury: null, motifJury: null }
      : { decisionJury: decision, motifJury: motif },
  });
  await journaliser({
    auteurId: u.id,
    action: "decision_jury",
    entite: "ResultatDeliberation",
    entiteId: resultatId,
    avant: { proposee: r.decisionProposee, jury: r.decisionJury },
    apres: { jury: retour ? null : decision, motif },
  });
  refresh();
  return succes(retour ? "Décision proposée rétablie." : "Décision du jury enregistrée.");
}

export async function cloturer(id: string): Promise<EtatFormulaire> {
  const u = await exigerPermission(PERMISSION);
  const d = await db.deliberation.findUnique({ where: { id } });
  if (!d) return echec("Délibération introuvable.");
  if (d.statut !== "PREPARATION") return echec("Ce jury est déjà clôturé.");
  // Calcul de dernière minute : on clôture sur les notes publiées à cet instant.
  await calculer(id);
  const [resultats, { coursSansNotes, nbCours }, jury] = await Promise.all([
    db.resultatDeliberation.findMany({ where: { deliberationId: id } }),
    notesDeLaPromotion(d.promotionId, d.periode as Periode, d.semestre),
    db.deliberation.findUniqueOrThrow({ where: { id } }),
  ]);
  const c = controles(
    resultats.map((r) => ({
      coursNonPresentes: r.coursNonPresentes,
      casLimite: r.casLimite,
      decisionJury: r.decisionJury,
      motifJury: r.motifJury,
      decision: r.decisionProposee,
    })),
    coursSansNotes,
    { nbCours, secretaire: jury.secretaireJury, president: jury.presidentJury },
  );
  if (c.bloquants.length) return echec(`Clôture impossible : ${c.bloquants.join(" ")}`);
  await db.deliberation.update({
    where: { id },
    data: { statut: "CLOTUREE", clotureLe: new Date(), clotureParId: u.id },
  });
  await journaliser({
    auteurId: u.id,
    action: "deliberation_cloturee",
    entite: "Deliberation",
    entiteId: id,
  });
  refresh();
  return succes(
    "Jury clôturé : les résultats sont figés. Vérifiez le procès-verbal, puis proclamez.",
  );
}

export async function rouvrir(id: string): Promise<EtatFormulaire> {
  const u = await exigerPermission(PERMISSION);
  const d = await db.deliberation.findUnique({ where: { id } });
  if (!d || d.statut !== "CLOTUREE")
    return echec("Seul un jury clôturé non proclamé peut être rouvert.");
  await db.deliberation.update({
    where: { id },
    data: { statut: "PREPARATION", clotureLe: null, clotureParId: null },
  });
  await journaliser({
    auteurId: u.id,
    action: "deliberation_rouverte",
    entite: "Deliberation",
    entiteId: id,
  });
  refresh();
  return succes("Jury rouvert : les résultats peuvent être recalculés et ajustés.");
}

export async function proclamer(id: string): Promise<EtatFormulaire> {
  const u = await exigerPermission(PERMISSION);
  const d = await db.deliberation.findUnique({
    where: { id },
    include: {
      ...INCLURE_DELIBERATION,
      resultats: { include: { etudiant: { include: { utilisateur: true } } } },
    },
  });
  if (!d) return echec("Délibération introuvable.");
  if (d.statut !== "CLOTUREE") return echec("Clôturez d'abord le jury.");
  const reglement = await reglementDe(d);
  const proclameLe = new Date();
  for (const r of d.resultats) {
    const donnees = donneesBulletin(d, r, reglement, d.resultats, proclameLe);
    let doc = null;
    for (let essai = 0; essai < 5 && !doc; essai++) {
      try {
        doc = await db.documentOfficiel.create({
          data: {
            code: codeVerification(12),
            type: "BULLETIN",
            etudiantId: r.etudiantId,
            donnees: donnees as unknown as Prisma.InputJsonValue,
            emisParId: u.id,
          },
        });
      } catch (e) {
        if ((e as { code?: string }).code !== "P2002") throw e;
      }
    }
    if (doc)
      await db.resultatDeliberation.update({ where: { id: r.id }, data: { documentId: doc.id } });
  }
  await db.deliberation.update({
    where: { id },
    data: { statut: "PROCLAMEE", proclameLe, proclameParId: u.id },
  });
  await notifier(
    d.resultats.map((r) => r.etudiant.utilisateurId),
    {
      type: "RESULTATS",
      titre: `Résultats proclamés : ${libellePeriode({ periode: d.periode as Periode, semestre: d.semestre })}`,
      message: "Votre bulletin est disponible ; il peut être vérifié en ligne grâce à son QR code.",
      lien: "/etudiant/resultats",
    },
  );
  await journaliser({
    auteurId: u.id,
    action: "deliberation_proclamee",
    entite: "Deliberation",
    entiteId: id,
  });
  updateTag(ETIQUETTE_DOCUMENTS);
  refresh();
  return succes(
    `Résultats proclamés : ${d.resultats.length} bulletin(s) émis et étudiants prévenus.`,
  );
}

export async function annulerProclamation(
  id: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerPermission(PERMISSION);
  const motif = String(fd.get("motif") ?? "")
    .trim()
    .slice(0, 300);
  if (motif.length < 5) return echec("Indiquez le motif de l'annulation.");
  const d = await db.deliberation.findUnique({
    where: { id },
    include: { resultats: { include: { etudiant: true } } },
  });
  if (!d || d.statut !== "PROCLAMEE") return echec("Ces résultats ne sont pas proclamés.");
  const docs = d.resultats.map((r) => r.documentId).filter((x): x is string => !!x);
  await db.$transaction([
    db.documentOfficiel.updateMany({
      where: { id: { in: docs }, revoqueLe: null },
      data: { revoqueLe: new Date(), motifRevocation: `Proclamation annulée : ${motif}` },
    }),
    db.resultatDeliberation.updateMany({
      where: { deliberationId: id },
      data: { documentId: null },
    }),
    db.deliberation.update({
      where: { id },
      data: { statut: "CLOTUREE", proclameLe: null, proclameParId: null },
    }),
  ]);
  await notifier(
    d.resultats.map((r) => r.etudiant.utilisateurId),
    {
      type: "RESULTATS",
      titre: "Résultats retirés pour rectification",
      message: `Les résultats proclamés ont été retirés par le secrétariat académique : ${motif}`,
      lien: "/etudiant/resultats",
    },
  );
  await journaliser({
    auteurId: u.id,
    action: "proclamation_annulee",
    entite: "Deliberation",
    entiteId: id,
    apres: { motif },
  });
  updateTag(ETIQUETTE_DOCUMENTS);
  refresh();
  return succes("Proclamation annulée : les bulletins sont révoqués et les étudiants prévenus.");
}
