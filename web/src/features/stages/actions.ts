"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { versDateBukavu } from "@/features/actualites/dates";
import { exigerConnexion, exigerPermission } from "@/features/auth/acces";
import { lireNote } from "@/features/notes/regles";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { compteEtudiant, notifier } from "@/features/notifications/emettre";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { statutSelonDates, typeDepuisCategorie } from "./regles";

const t = (fd: FormData, c: string) => String(fd.get(c) ?? "").trim();
const typeStage = z.enum(["PEDAGOGIQUE", "PROFESSIONNEL"]);

export async function enregistrerLieu(
  id: string | null,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("stages.gerer");
  const nom = t(fd, "nom").slice(0, 160);
  const type = typeStage.safeParse(t(fd, "type"));
  if (!nom || !type.success) return echec("Indiquez le nom et le type de stage.");
  const data = {
    nom,
    type: type.data,
    adresse: t(fd, "adresse").slice(0, 200) || null,
    contact: t(fd, "contact").slice(0, 120) || null,
    telephone: t(fd, "telephone").slice(0, 30) || null,
    email: t(fd, "email").slice(0, 160) || null,
    convention: fd.get("convention") === "on",
  };
  const l = id
    ? await db.lieuStage.update({ where: { id }, data })
    : await db.lieuStage.create({ data });
  await journaliser({
    auteurId: auteur.id,
    action: id ? "lieu_stage_modifie" : "lieu_stage_cree",
    entite: "LieuStage",
    entiteId: l.id,
    apres: { nom },
  });
  refresh();
  return succes("Lieu de stage enregistré.");
}

/** Crée un lieu de stage pour chaque partenaire de stage qui n'en a pas encore. */
export async function importerLieuxPartenaires(): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("stages.gerer");
  const [partenaires, lieux] = await Promise.all([
    db.partenaire.findMany({
      where: { categorie: { in: ["STAGE_PEDAGOGIQUE", "STAGE_PROFESSIONNEL"] } },
    }),
    db.lieuStage.findMany({ select: { nom: true } }),
  ]);
  const existants = new Set(lieux.map((l) => l.nom.toLowerCase()));
  const nouveaux = partenaires
    .filter((p) => !existants.has(p.nom.toLowerCase()))
    .map((p) => ({ nom: p.nom, type: typeDepuisCategorie(p.categorie)!, convention: true }));
  if (nouveaux.length) await db.lieuStage.createMany({ data: nouveaux });
  await journaliser({
    auteurId: auteur.id,
    action: "lieux_stage_importes",
    entite: "LieuStage",
    apres: { nombre: nouveaux.length },
  });
  refresh();
  return succes(
    nouveaux.length
      ? `${nouveaux.length} lieu(x) repris des partenaires.`
      : "Tous les partenaires de stage sont déjà repris.",
  );
}

export async function affecterStage(_e: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("stages.gerer");
  const matricule = t(fd, "matricule").replace(/\s+/g, "").toUpperCase();
  const type = typeStage.safeParse(t(fd, "type"));
  const lieuId = t(fd, "lieuId");
  if (!type.success || !lieuId) return echec("Choisissez le lieu et le type de stage.");
  const [profil, annee] = await Promise.all([
    db.profilEtudiant.findUnique({ where: { matricule } }),
    db.anneeAcademique.findFirst({ where: { courante: true } }),
  ]);
  if (!profil) return echec("Aucun étudiant avec ce matricule.");
  if (!annee) return echec("Aucune année courante.");
  const debut = t(fd, "debut") ? versDateBukavu(`${t(fd, "debut")}T08:00`) : null;
  const fin = t(fd, "fin") ? versDateBukavu(`${t(fd, "fin")}T17:00`) : null;
  if (debut && fin && fin < debut) return echec("La fin précède le début.");
  const encadreurId = t(fd, "encadreurId") || null;
  const s = await db.stage.create({
    data: {
      etudiantId: profil.id,
      lieuId,
      anneeId: annee.id,
      type: type.data,
      debut,
      fin,
      encadreurId,
      statut: statutSelonDates(debut, fin),
    },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "stage_affecte",
    entite: "Stage",
    entiteId: s.id,
    apres: { matricule, lieuId },
  });
  const lieu = await db.lieuStage.findUnique({ where: { id: lieuId }, select: { nom: true } });
  await notifier([profil.utilisateurId], {
    type: "STAGE",
    titre: "Stage attribué",
    message: `Vous êtes affecté(e) en stage${lieu ? ` à ${lieu.nom}` : ""}.`,
    lien: "/etudiant/stages",
  });
  if (encadreurId)
    await notifier([encadreurId], {
      type: "STAGE",
      titre: "Nouveau stagiaire à encadrer",
      message: `L'étudiant ${matricule} vous est confié${lieu ? ` (${lieu.nom})` : ""}.`,
      lien: "/enseignant/stages",
    });
  refresh();
  return succes(`Stage enregistré pour ${matricule}.`);
}

export async function changerStatutStage(
  id: string,
  statut: "PREVU" | "EN_COURS" | "TERMINE",
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("stages.gerer");
  await db.stage.update({ where: { id }, data: { statut } });
  await journaliser({
    auteurId: auteur.id,
    action: "stage_statut",
    entite: "Stage",
    entiteId: id,
    apres: { statut },
  });
  refresh();
  return succes("Stage mis à jour.");
}

/** Évaluation par l'encadreur ou le responsable des stages. */
export async function evaluerStage(
  id: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/enseignant");
  const s = await db.stage.findUnique({ where: { id } });
  if (!s) return echec("Stage introuvable.");
  if (s.encadreurId !== u.id && !u.permissions.has("stages.gerer"))
    return echec("Vous n'encadrez pas ce stage.");
  const note = lireNote(t(fd, "note"));
  if (note === "invalide") return echec("Note invalide (0 à 20).");
  const appreciation = t(fd, "appreciation").slice(0, 1000) || null;
  await db.stage.update({ where: { id }, data: { note, appreciation, statut: "TERMINE" } });
  await journaliser({
    auteurId: u.id,
    action: "stage_evalue",
    entite: "Stage",
    entiteId: id,
    apres: { note },
  });
  await notifier(await compteEtudiant(s.etudiantId), {
    type: "STAGE",
    titre: "Stage évalué",
    message: "L'évaluation de votre stage est disponible.",
    lien: "/etudiant/stages",
  });
  refresh();
  return succes("Évaluation enregistrée.");
}

/** Dépôt du rapport de stage par l'étudiant (PDF, 4 Mo au plus). */
export async function deposerRapport(
  id: string,
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/etudiant");
  const s = await db.stage.findUnique({
    where: { id },
    include: { etudiant: true, rapport: true },
  });
  if (!s || s.etudiant.utilisateurId !== u.id) return echec("Stage introuvable.");
  if (s.note !== null) return echec("Le stage est déjà évalué.");
  const f = fd.get("rapport");
  if (!(f instanceof File) || f.size === 0) return echec("Choisissez votre rapport (PDF).");
  if (f.type !== "application/pdf" || f.size > 4 * 1024 * 1024)
    return echec("Rapport attendu en PDF, 4 Mo au plus.");
  const contenu = Buffer.from(await f.arrayBuffer());
  if (contenu.subarray(0, 5).toString() !== "%PDF-")
    return echec("Ce fichier n'est pas un PDF valide.");
  const cle = `prive/stages/${id}/${jetonAleatoire(6).toLowerCase()}.pdf`;
  await stockage().enregistrer(cle, contenu, "application/pdf");
  const media = await db.media.create({
    data: {
      cle,
      nomFichier: f.name.slice(0, 120),
      typeMime: "application/pdf",
      taille: contenu.length,
      dossier: "stages",
      creeParId: u.id,
    },
  });
  await db.stage.update({ where: { id }, data: { rapportMediaId: media.id } });
  if (s.rapport) {
    await db.media.delete({ where: { id: s.rapport.id } }).catch(() => undefined);
    await stockage()
      .supprimer(s.rapport.cle)
      .catch(() => undefined);
  }
  await journaliser({ auteurId: u.id, action: "rapport_depose", entite: "Stage", entiteId: id });
  if (s.encadreurId)
    await notifier([s.encadreurId], {
      type: "STAGE",
      titre: "Rapport de stage déposé",
      message: `${s.etudiant.matricule} a déposé son rapport de stage.`,
      lien: "/enseignant/stages",
    });
  refresh();
  return succes("Rapport déposé.");
}
