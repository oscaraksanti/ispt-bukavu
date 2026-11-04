"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { exigerConnexion, exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { codeVerification } from "@/lib/securite";
import { LIBELLES_DOCUMENT, type TypeDocument } from "./regles";
import { figerDonnees } from "./requetes";
import { ETIQUETTE_DOCUMENTS } from "./verification";

const typeDocument = z.enum(["ATTESTATION_FREQUENTATION", "RELEVE_NOTES", "ATTESTATION_REUSSITE"]);

export async function demanderDocument(
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/etudiant");
  const profil = await db.profilEtudiant.findUnique({ where: { utilisateurId: u.id } });
  if (!profil) return echec("Réservé aux étudiants.");
  const t = typeDocument.safeParse(fd.get("type"));
  if (!t.success) return echec("Choisissez un document.");
  const motif =
    String(fd.get("motif") ?? "")
      .trim()
      .slice(0, 200) || null;
  if (
    await db.demandeDocument.findFirst({
      where: { etudiantId: profil.id, type: t.data, statut: "EN_ATTENTE" },
    })
  )
    return echec("Une demande de ce document est déjà en cours.");
  await db.demandeDocument.create({ data: { etudiantId: profil.id, type: t.data, motif } });
  await journaliser({
    auteurId: u.id,
    action: "document_demande",
    entite: "DemandeDocument",
    apres: { type: t.data },
  });
  refresh();
  return succes("Demande transmise au secrétariat académique.");
}

/** Émet un document (à partir d'une demande, ou directement pour un étudiant). */
async function emettre(
  etudiantId: string,
  type: TypeDocument,
  demandeId: string | null,
  auteurId: string,
) {
  const donnees = await figerDonnees(etudiantId, type);
  if (!donnees)
    return { erreur: "L'étudiant n'est inscrit dans aucune promotion de l'année courante." };
  for (let essai = 0; essai < 5; essai++) {
    try {
      const doc = await db.documentOfficiel.create({
        data: {
          code: codeVerification(12),
          type,
          etudiantId,
          demandeId,
          donnees,
          emisParId: auteurId,
        },
      });
      if (demandeId)
        await db.demandeDocument.update({
          where: { id: demandeId },
          data: { statut: "EMISE", traiteLe: new Date() },
        });
      await journaliser({
        auteurId,
        action: "document_emis",
        entite: "DocumentOfficiel",
        entiteId: doc.id,
        apres: { type, code: doc.code },
      });
      return { doc };
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  return { erreur: "Émission impossible, réessayez." };
}

export async function emettreDemande(demandeId: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("documents.emettre");
  const d = await db.demandeDocument.findUnique({ where: { id: demandeId } });
  if (!d || d.statut !== "EN_ATTENTE") return echec("Demande déjà traitée.");
  const r = await emettre(d.etudiantId, d.type, d.id, auteur.id);
  if (r.erreur) return echec(r.erreur);
  refresh();
  return succes(`${LIBELLES_DOCUMENT[d.type]} émis (code ${r.doc!.code}).`);
}

export async function refuserDemande(demandeId: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("documents.emettre");
  await db.demandeDocument.update({
    where: { id: demandeId },
    data: { statut: "REFUSEE", traiteLe: new Date() },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "document_refuse",
    entite: "DemandeDocument",
    entiteId: demandeId,
  });
  refresh();
  return succes("Demande refusée.");
}

export async function emettreDirectement(
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("documents.emettre");
  const matricule = String(fd.get("matricule") ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
  const t = typeDocument.safeParse(fd.get("type"));
  if (!t.success) return echec("Choisissez un document.");
  const profil = await db.profilEtudiant.findUnique({ where: { matricule } });
  if (!profil) return echec("Aucun étudiant avec ce matricule.");
  const r = await emettre(profil.id, t.data, null, auteur.id);
  if (r.erreur) return echec(r.erreur);
  refresh();
  return succes(`${LIBELLES_DOCUMENT[t.data]} émis pour ${matricule} (code ${r.doc!.code}).`);
}

export async function revoquerDocument(
  id: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("documents.emettre");
  const motif = String(fd.get("motif") ?? "")
    .trim()
    .slice(0, 200);
  if (!motif) return echec("Indiquez le motif de la révocation.");
  await db.documentOfficiel.update({
    where: { id },
    data: { revoqueLe: new Date(), motifRevocation: motif },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "document_revoque",
    entite: "DocumentOfficiel",
    entiteId: id,
    apres: { motif },
  });
  updateTag(ETIQUETTE_DOCUMENTS);
  refresh();
  return succes("Document révoqué : la vérification en ligne l'indiquera désormais.");
}
