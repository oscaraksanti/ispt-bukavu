"use server";

import { hash } from "@node-rs/argon2";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import { normaliserEmail, verifierMotDePasse } from "@/features/auth/regles";
import { ouvrirSession } from "@/features/auth/session";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import { envoyerEmail, urlSite } from "@/lib/email";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { dossierDuCandidat, exigerCandidat } from "./acces";
import {
  campagneOuverte,
  dossierModifiable,
  elementsManquants,
  numeroCandidature,
  type Statut,
} from "./regles";
import { TAILLE_MAX_PIECE, TYPES_PIECES } from "./fichiers";

/* ---------- Création du compte ---------- */

const schemaCompte = z.object({
  prenom: z.string().trim().min(1, "Indiquez votre prénom.").max(80),
  nom: z.string().trim().min(1, "Indiquez votre nom.").max(80),
  postnom: z.string().trim().max(80),
  email: z.string().trim().email("Adresse email invalide.").max(160),
  telephone: z.string().trim().min(9, "Numéro de téléphone incomplet.").max(30),
});

/** Crée le dossier avec un numéro unique dans l'année (nouvel essai en cas de collision). */
async function creerDossier(
  campagneId: string,
  candidatId: string,
  annee: number,
  donnees: object,
) {
  for (let essai = 0; essai < 5; essai++) {
    const rang =
      (await db.candidature.count({ where: { numero: { startsWith: `${annee}-` } } })) + 1 + essai;
    try {
      return await db.candidature.create({
        data: {
          ...donnees,
          numero: numeroCandidature(annee, rang),
          campagneId,
          candidatId,
          historique: { create: { statut: "BROUILLON", auteurId: candidatId } },
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  throw new Error("Numérotation impossible.");
}

export async function creerCompteCandidat(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  if (String(formData.get("site") ?? "") !== "") return echec("Envoi refusé.");
  const saisie = {
    prenom: String(formData.get("prenom") ?? ""),
    nom: String(formData.get("nom") ?? ""),
    postnom: String(formData.get("postnom") ?? ""),
    email: String(formData.get("email") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
  };
  const r = schemaCompte.safeParse(saisie);
  const erreurs: Record<string, string> = r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const probleme = verifierMotDePasse(motDePasse);
  if (probleme) erreurs.motDePasse = probleme;
  else if (motDePasse !== String(formData.get("confirmation") ?? ""))
    erreurs.confirmation = "Les deux mots de passe ne correspondent pas.";
  if (formData.get("consentement") !== "on")
    erreurs.consentement = "Votre accord est nécessaire pour traiter votre candidature.";
  if (!r.success || Object.keys(erreurs).length > 0)
    return { ...echec("Vérifiez les champs signalés.", erreurs), valeurs: saisie };

  const maintenant = new Date();
  const campagne = await db.campagneAdmission.findFirst({
    where: { statut: "OUVERTE", ouverture: { lte: maintenant }, cloture: { gte: maintenant } },
    orderBy: { cloture: "asc" },
  });
  if (!campagne) return echec("Les candidatures en ligne ne sont pas ouvertes actuellement.");

  const email = normaliserEmail(r.data.email);
  if (await db.utilisateur.findUnique({ where: { email } }))
    return {
      ...echec(
        "Un compte existe déjà avec cette adresse : connectez-vous pour reprendre votre dossier.",
      ),
      valeurs: saisie,
    };

  const role = await db.role.findUniqueOrThrow({ where: { code: "candidat" } });
  const utilisateur = await db.utilisateur.create({
    data: {
      email,
      prenom: r.data.prenom,
      nom: r.data.nom.toUpperCase(),
      postnom: r.data.postnom ? r.data.postnom.toUpperCase() : null,
      telephone: r.data.telephone,
      motDePasseHash: await hash(motDePasse),
      statut: "ACTIF",
      derniereConnexion: maintenant,
      roles: { create: { roleId: role.id } },
    },
  });
  const dossier = await creerDossier(campagne.id, utilisateur.id, maintenant.getFullYear(), {
    nom: utilisateur.nom,
    postnom: utilisateur.postnom,
    prenom: utilisateur.prenom,
    telephone: r.data.telephone,
    consentementLe: maintenant,
  });
  await journaliser({
    auteurId: utilisateur.id,
    action: "candidature_creee",
    entite: "Candidature",
    entiteId: dossier.id,
  });
  await envoyerEmail({
    a: email,
    sujet: `Votre dossier de candidature n° ${dossier.numero} — ISPT-Bukavu`,
    texte: `Bonjour ${r.data.prenom},\n\nVotre compte candidat est ouvert. Complétez votre dossier n° ${dossier.numero} et déposez vos pièces depuis votre espace :\n${urlSite()}/candidat\n\nISPT-Bukavu`,
  }).catch(() => undefined);
  await ouvrirSession(utilisateur.id);
  redirect("/candidat");
}

/* ---------- Dossier ---------- */

const texte = (max: number) => z.string().trim().max(max);
const schemaDossier = z.object({
  nom: texte(80),
  postnom: texte(80),
  prenom: texte(80),
  sexe: z.enum(["", "F", "M"]),
  dateNaissance: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Date de naissance invalide."),
  lieuNaissance: texte(120),
  nationalite: texte(80),
  telephone: texte(30),
  adresse: texte(240),
  ecoleOrigine: texte(160),
  sectionHumanites: texte(120),
  anneeDiplome: z.string().regex(/^(\d{4})?$/, "Année du diplôme invalide."),
  pourcentage: z.string().regex(/^(\d{2,3}([.,]\d{1,2})?)?$/, "Pourcentage invalide."),
  filiereId: texte(40),
  referencePaiement: texte(80),
});

async function dossierModifiableDuCandidat() {
  const u = await exigerCandidat();
  const dossier = await dossierDuCandidat(u.id);
  if (!dossier) return { erreur: echec("Aucun dossier trouvé.") };
  if (!dossierModifiable(dossier.statut as Statut))
    return { erreur: echec("Votre dossier a été déposé : il ne peut plus être modifié.") };
  return { u, dossier };
}

export async function enregistrerDossier(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const { dossier, erreur } = await dossierModifiableDuCandidat();
  if (erreur) return erreur;
  const r = schemaDossier.safeParse(
    Object.fromEntries(
      Object.keys(schemaDossier.shape).map((k) => [k, String(formData.get(k) ?? "")]),
    ),
  );
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const d = r.data;

  const anneeDiplome = d.anneeDiplome ? Number(d.anneeDiplome) : null;
  const anneeCourante = new Date().getFullYear();
  if (anneeDiplome && (anneeDiplome < 1980 || anneeDiplome > anneeCourante))
    return echec("Année du diplôme invalide.");
  const pourcentage = d.pourcentage ? Number(d.pourcentage.replace(",", ".")) : null;
  if (pourcentage !== null && (pourcentage < 50 || pourcentage > 100))
    return echec("Le pourcentage doit être compris entre 50 et 100.");
  const dateNaissance = d.dateNaissance ? new Date(`${d.dateNaissance}T00:00:00Z`) : null;
  if (dateNaissance) {
    const age = anneeCourante - dateNaissance.getUTCFullYear();
    if (age < 14 || age > 80) return echec("Date de naissance invalide.");
  }
  if (d.filiereId && !dossier.campagne.filieres.some((f) => f.id === d.filiereId))
    return echec("Cette filière n'est pas ouverte pour cette campagne.");

  const vide = (v: string) => v || null;
  await db.candidature.update({
    where: { id: dossier.id },
    data: {
      nom: vide(d.nom.toUpperCase()),
      postnom: vide(d.postnom.toUpperCase()),
      prenom: vide(d.prenom),
      sexe: d.sexe || null,
      dateNaissance,
      lieuNaissance: vide(d.lieuNaissance),
      nationalite: vide(d.nationalite),
      telephone: vide(d.telephone),
      adresse: vide(d.adresse),
      ecoleOrigine: vide(d.ecoleOrigine),
      sectionHumanites: vide(d.sectionHumanites),
      anneeDiplome,
      pourcentage,
      filiereId: vide(d.filiereId),
      referencePaiement: vide(d.referencePaiement),
    },
  });
  refresh();
  return succes("Informations enregistrées.");
}

/* ---------- Pièces ---------- */

export type ResultatPiece = { ok: true } | { ok: false; message: string };

export async function deposerPiece(formData: FormData): Promise<ResultatPiece> {
  const { u, dossier, erreur } = await dossierModifiableDuCandidat();
  if (erreur) return { ok: false, message: erreur.message ?? "Dépôt impossible." };
  const pieceId = String(formData.get("pieceExigeeId") ?? "");
  const piece = dossier.campagne.pieces.find((p) => p.id === pieceId);
  if (!piece) return { ok: false, message: "Pièce inconnue." };
  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0)
    return { ok: false, message: "Aucun fichier reçu." };
  if (!TYPES_PIECES.includes(fichier.type))
    return { ok: false, message: "Format accepté : photo (JPEG, PNG, WebP) ou PDF." };
  if (fichier.size > TAILLE_MAX_PIECE)
    return { ok: false, message: "Fichier trop lourd (4 Mo au plus)." };

  let contenu = Buffer.from(await fichier.arrayBuffer());
  let typeMime = fichier.type;
  let extension = "pdf";
  if (fichier.type === "application/pdf") {
    if (contenu.subarray(0, 5).toString() !== "%PDF-")
      return { ok: false, message: "Ce fichier n'est pas un PDF valide." };
  } else {
    try {
      // Réencodage : orientation corrigée, métadonnées (dont GPS) retirées.
      contenu = await sharp(contenu, { limitInputPixels: 60e6 })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      typeMime = "image/webp";
      extension = "webp";
    } catch {
      return { ok: false, message: "Cette image est illisible." };
    }
  }

  const cle = `prive/candidatures/${dossier.id}/${piece.id}-${jetonAleatoire(6).toLowerCase()}.${extension}`;
  await stockage().enregistrer(cle, contenu, typeMime);
  const media = await db.media.create({
    data: {
      cle,
      nomFichier: fichier.name.slice(0, 120) || `${piece.libelle}.${extension}`,
      typeMime,
      taille: contenu.length,
      dossier: "candidatures",
      texteAlternatif: piece.libelle,
      creeParId: u.id,
    },
  });
  const ancien = dossier.pieces.find((p) => p.pieceExigeeId === piece.id);
  await db.pieceDeposee.upsert({
    where: { candidatureId_pieceExigeeId: { candidatureId: dossier.id, pieceExigeeId: piece.id } },
    update: { mediaId: media.id, statut: "DEPOSEE", commentaire: null },
    create: { candidatureId: dossier.id, pieceExigeeId: piece.id, mediaId: media.id },
  });
  if (ancien) {
    await db.media.delete({ where: { id: ancien.mediaId } }).catch(() => undefined);
    await stockage()
      .supprimer(ancien.media.cle)
      .catch(() => undefined);
  }
  refresh();
  return { ok: true };
}

export async function retirerPiece(pieceExigeeId: string): Promise<EtatFormulaire> {
  const { dossier, erreur } = await dossierModifiableDuCandidat();
  if (erreur) return erreur;
  const depot = dossier.pieces.find((p) => p.pieceExigeeId === pieceExigeeId);
  if (!depot) return echec("Pièce introuvable.");
  await db.pieceDeposee.delete({ where: { id: depot.id } });
  await db.media.delete({ where: { id: depot.mediaId } }).catch(() => undefined);
  await stockage()
    .supprimer(depot.media.cle)
    .catch(() => undefined);
  refresh();
  return succes("Pièce retirée.");
}

/* ---------- Dépôt du dossier ---------- */

export async function soumettreDossier(): Promise<EtatFormulaire> {
  const { u, dossier, erreur } = await dossierModifiableDuCandidat();
  if (erreur) return erreur;
  if (dossier.statut === "BROUILLON" && !campagneOuverte(dossier.campagne))
    return echec("La période de dépôt des candidatures est terminée.");
  const manquants = elementsManquants(dossier, dossier.campagne.pieces, dossier.pieces);
  if (manquants.length > 0) return echec(`Il manque encore : ${manquants.join(", ")}.`);

  const complement = dossier.statut === "COMPLEMENT";
  await db.candidature.update({
    where: { id: dossier.id },
    data: {
      statut: "SOUMISE",
      soumiseLe: new Date(),
      historique: {
        create: {
          statut: "SOUMISE",
          auteurId: u.id,
          commentaire: complement ? "Dossier complété par le candidat." : null,
        },
      },
    },
  });
  await journaliser({
    auteurId: u.id,
    action: "candidature_soumise",
    entite: "Candidature",
    entiteId: dossier.id,
  });
  await envoyerEmail({
    a: u.email,
    sujet: `Dossier n° ${dossier.numero} déposé — ISPT-Bukavu`,
    texte: `Bonjour ${dossier.prenom ?? ""},\n\nVotre dossier de candidature n° ${dossier.numero} a bien été déposé. Le secrétariat l'examinera ; vous serez informé(e) par email de chaque étape.\n\nSuivi : ${urlSite()}/candidat\n\nISPT-Bukavu`,
  }).catch(() => undefined);
  updateTag(ETIQUETTES.admissions);
  refresh();
  return succes("Votre dossier est déposé. Vous serez informé(e) par email de la suite.");
}
