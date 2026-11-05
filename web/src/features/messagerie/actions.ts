"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import sharp from "sharp";
import { exigerPermission } from "@/features/auth/acces";
import { TAILLE_MAX_PIECE, TYPES_PIECES } from "@/features/admissions/fichiers";
import { notifier } from "@/features/notifications/emettre";
import { envoyerPush } from "@/features/push/envoi";
import { contexteEtudiant, filtreEnLigne } from "@/features/valve/donnees";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { accesConversation, exigerMessagerie, moderateurs, profilsMessagerie } from "./acces";
import { messageClient } from "./requetes";
import {
  clePrivee,
  ENVOIS_PAR_MINUTE,
  MOTIFS_SIGNALEMENT,
  normaliserContenu,
  peutEcrireA,
  peutPublier,
  verifierContenu,
} from "./regles";
import type { EtatEnvoi } from "./types";

/** Bases autorisées pour les redirections après l'ouverture d'une conversation. */
const BASES = ["/etudiant/messages", "/enseignant/messages", "/admin/messagerie"];

/** Pièce jointe : image réduite en WebP, ou PDF vérifié ; stockée en privé. */
async function enregistrerPiece(fichier: File, conversationId: string, auteurId: string) {
  if (!TYPES_PIECES.includes(fichier.type)) return { erreur: "Formats acceptés : photo ou PDF." };
  if (fichier.size > TAILLE_MAX_PIECE) return { erreur: "Fichier trop lourd (4 Mo au plus)." };
  let contenu = Buffer.from(await fichier.arrayBuffer());
  let typeMime = fichier.type;
  let extension = "pdf";
  if (fichier.type === "application/pdf") {
    if (contenu.subarray(0, 5).toString() !== "%PDF-")
      return { erreur: "Ce fichier n'est pas un PDF valide." };
  } else {
    try {
      contenu = await sharp(contenu, { limitInputPixels: 60e6 })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      return { erreur: "Cette image n'a pas pu être lue." };
    }
    typeMime = "image/webp";
    extension = "webp";
  }
  const nom = fichier.name.replace(/\.[^.]+$/, "").slice(0, 80) || "piece-jointe";
  const cle = `prive/messages/${conversationId}/${jetonAleatoire(8).toLowerCase()}.${extension}`;
  await stockage().enregistrer(cle, contenu, typeMime);
  const media = await db.media.create({
    data: {
      cle,
      nomFichier: `${nom}.${extension}`,
      typeMime,
      taille: contenu.length,
      dossier: "messages",
      creeParId: auteurId,
    },
  });
  return { media };
}

export async function envoyerMessage(conversationId: string, fd: FormData): Promise<EtatEnvoi> {
  const { u, profil } = await exigerMessagerie("/");
  const acces = await accesConversation(profil, conversationId);
  if (!acces) return { ok: false, erreur: "Conversation introuvable." };
  const { conversation, animateur } = acces;
  if (!peutPublier(conversation, animateur))
    return { ok: false, erreur: "Seuls les enseignants écrivent dans ce groupe d'annonces." };

  if (conversation.type === "PRIVEE") {
    const autre = await db.participantConversation.findFirst({
      where: { conversationId, utilisateurId: { not: profil.id } },
      select: { utilisateurId: true },
    });
    const bloque =
      autre &&
      (await db.blocage.findFirst({
        where: {
          OR: [
            { bloqueurId: autre.utilisateurId, bloqueId: profil.id },
            { bloqueurId: profil.id, bloqueId: autre.utilisateurId },
          ],
        },
      }));
    if (bloque)
      return { ok: false, erreur: "Les messages ne passent plus dans cette conversation." };
  }

  const recents = await db.message.count({
    where: { auteurId: profil.id, creeLe: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recents >= ENVOIS_PAR_MINUTE)
    return { ok: false, erreur: "Trop de messages d'affilée. Patientez une minute." };

  const fichier = fd.get("fichier");
  const avecPiece = fichier instanceof File && fichier.size > 0;
  const contenu = normaliserContenu(String(fd.get("contenu") ?? ""));
  const probleme = verifierContenu(contenu, avecPiece);
  if (probleme) return { ok: false, erreur: probleme };

  const reponseAId = String(fd.get("reponseA") ?? "") || null;
  if (reponseAId) {
    const cite = await db.message.findUnique({ where: { id: reponseAId } });
    if (cite?.conversationId !== conversationId)
      return { ok: false, erreur: "Message cité introuvable." };
  }

  let mediaId: string | null = null;
  if (avecPiece) {
    const r = await enregistrerPiece(fichier as File, conversationId, profil.id);
    if (!r.media) return { ok: false, erreur: r.erreur ?? "Pièce jointe refusée." };
    mediaId = r.media.id;
  }

  const maintenant = new Date();
  const m = await db.message.create({
    data: { conversationId, auteurId: profil.id, contenu, reponseAId, mediaId, creeLe: maintenant },
  });
  await db.$transaction([
    db.conversation.update({
      where: { id: conversationId },
      data: { dernierMessageLe: maintenant },
    }),
    db.participantConversation.upsert({
      where: { conversationId_utilisateurId: { conversationId, utilisateurId: profil.id } },
      update: { luJusquA: maintenant, quitteLe: null },
      create: { conversationId, utilisateurId: profil.id, luJusquA: maintenant, animateur },
    }),
  ]);
  // Notification sur le téléphone des autres participants (hors sourdine), après la réponse.
  const auteurNom = [u.prenom, u.nom].filter(Boolean).join(" ");
  after(async () => {
    const destinataires = await db.participantConversation.findMany({
      where: {
        conversationId,
        quitteLe: null,
        sourdine: false,
        utilisateurId: { not: profil.id },
      },
      select: { utilisateurId: true },
    });
    await envoyerPush(
      destinataires.map((d) => d.utilisateurId),
      {
        titre:
          conversation.type === "PRIVEE"
            ? auteurNom
            : `${auteurNom} · ${conversation.titre ?? "Groupe"}`,
        corps: contenu || (mediaId ? "Pièce jointe" : ""),
        lien: `/messages/aller/${conversationId}`,
        tag: `conversation-${conversationId}`,
      },
    );
  });
  return {
    ok: true,
    message: await messageClient(m.id, profil.id, conversation.type !== "PRIVEE"),
  };
}

/** Tout est lu jusqu'à maintenant dans cette conversation. */
export async function marquerLu(conversationId: string) {
  const { profil } = await exigerMessagerie("/");
  const acces = await accesConversation(profil, conversationId);
  if (!acces) return;
  await db.participantConversation.upsert({
    where: { conversationId_utilisateurId: { conversationId, utilisateurId: profil.id } },
    update: { luJusquA: new Date() },
    create: {
      conversationId,
      utilisateurId: profil.id,
      luJusquA: new Date(),
      animateur: acces.animateur,
    },
  });
}

/** Retire un de ses propres messages (et sa pièce jointe). */
export async function supprimerMessage(messageId: string): Promise<EtatFormulaire> {
  const { profil } = await exigerMessagerie("/");
  const m = await db.message.findUnique({ where: { id: messageId }, include: { media: true } });
  if (!m || m.auteurId !== profil.id || m.supprimeLe) return echec("Message introuvable.");
  await db.message.update({
    where: { id: messageId },
    data: { supprimeLe: new Date(), contenu: "", mediaId: null },
  });
  if (m.media) {
    await db.media.delete({ where: { id: m.media.id } }).catch(() => undefined);
    await stockage()
      .supprimer(m.media.cle)
      .catch(() => undefined);
  }
  return succes("Message supprimé.");
}

export async function signalerMessage(messageId: string, motif: string): Promise<EtatFormulaire> {
  const { profil } = await exigerMessagerie("/");
  if (!(motif in MOTIFS_SIGNALEMENT)) return echec("Choisissez un motif.");
  const m = await db.message.findUnique({ where: { id: messageId } });
  if (!m || !(await accesConversation(profil, m.conversationId)))
    return echec("Message introuvable.");
  if (m.auteurId === profil.id) return echec("Vous ne pouvez pas signaler votre propre message.");
  const existant = await db.signalementMessage.findUnique({
    where: { messageId_auteurId: { messageId, auteurId: profil.id } },
  });
  if (existant) return succes("Vous avez déjà signalé ce message. La modération l'examine.");
  const s = await db.signalementMessage.create({
    data: { messageId, auteurId: profil.id, motif },
  });
  await journaliser({
    auteurId: profil.id,
    action: "message_signale",
    entite: "Message",
    entiteId: messageId,
    apres: { motif },
  });
  await notifier(await moderateurs(), {
    type: "MODERATION",
    titre: "Message signalé",
    message: MOTIFS_SIGNALEMENT[motif as keyof typeof MOTIFS_SIGNALEMENT],
    lien: `/admin/messagerie/signalements#${s.id}`,
  });
  return succes("Merci : la modération va examiner ce message.");
}

export async function basculerSourdine(conversationId: string): Promise<EtatFormulaire> {
  const { profil } = await exigerMessagerie("/");
  const acces = await accesConversation(profil, conversationId);
  if (!acces?.participant) return echec("Conversation introuvable.");
  await db.participantConversation.update({
    where: { id: acces.participant.id },
    data: { sourdine: !acces.participant.sourdine },
  });
  refresh();
  return succes(
    acces.participant.sourdine ? "Notifications réactivées." : "Conversation en sourdine.",
  );
}

/** Groupe de cours : l'enseignant réserve (ou rouvre) l'écriture. */
export async function basculerAnnonces(conversationId: string): Promise<EtatFormulaire> {
  const { profil } = await exigerMessagerie("/");
  const acces = await accesConversation(profil, conversationId);
  if (!acces?.animateur) return echec("Réservé aux enseignants du cours.");
  const annonces = !acces.conversation.annoncesSeulement;
  await db.conversation.update({
    where: { id: conversationId },
    data: { annoncesSeulement: annonces },
  });
  await journaliser({
    auteurId: profil.id,
    action: "groupe_annonces",
    entite: "Conversation",
    entiteId: conversationId,
    apres: { annoncesSeulement: annonces },
  });
  refresh();
  return succes(annonces ? "Seuls les enseignants peuvent écrire." : "Tout le monde peut écrire.");
}

/** Bloque (ou débloque) l'autre personne d'une conversation privée. */
export async function basculerBlocage(conversationId: string): Promise<EtatFormulaire> {
  const { profil } = await exigerMessagerie("/");
  const acces = await accesConversation(profil, conversationId);
  if (acces?.conversation.type !== "PRIVEE") return echec("Conversation introuvable.");
  const autre = await db.participantConversation.findFirst({
    where: { conversationId, utilisateurId: { not: profil.id } },
  });
  if (!autre) return echec("Conversation introuvable.");
  const cle = { bloqueurId: profil.id, bloqueId: autre.utilisateurId };
  const existant = await db.blocage.findUnique({ where: { bloqueurId_bloqueId: cle } });
  if (existant) await db.blocage.delete({ where: { bloqueurId_bloqueId: cle } });
  else await db.blocage.create({ data: cle });
  refresh();
  return succes(
    existant ? "Personne débloquée." : "Personne bloquée : elle ne peut plus vous écrire.",
  );
}

/** Ouvre (ou crée) la conversation privée avec une personne, puis y conduit. */
export async function ouvrirConversation(cibleId: string, base: string) {
  const { profil } = await exigerMessagerie("/");
  const retour = BASES.includes(base) ? base : "/";
  const cible = (await profilsMessagerie([cibleId])).get(cibleId);
  if (!cible || !peutEcrireA(profil, cible)) redirect(`${retour}/nouveau?refus=1`);
  const cle = clePrivee(profil.id, cible.id);
  const conversation = await db.conversation.upsert({
    where: { cle },
    update: {},
    create: { cle, type: "PRIVEE" },
  });
  await db.participantConversation.createMany({
    data: [
      { conversationId: conversation.id, utilisateurId: profil.id },
      { conversationId: conversation.id, utilisateurId: cible.id },
    ],
    skipDuplicates: true,
  });
  redirect(`${retour}/${conversation.id}`);
}

/**
 * Valve : l'étudiant pose une question sur un communiqué à son auteur, en
 * conversation privée (la valve reste officielle, sans commentaires publics).
 */
export async function poserQuestion(communiqueId: string) {
  const { u, profil } = await exigerMessagerie("/etudiant/valve");
  const c = await db.communique.findFirst({
    where: { id: communiqueId, ...filtreEnLigne(await contexteEtudiant(u.id)) },
    select: { id: true, auteurId: true },
  });
  if (!c) redirect("/etudiant/valve");
  const auteur = (await profilsMessagerie([c.auteurId])).get(c.auteurId);
  if (!auteur || !peutEcrireA(profil, auteur))
    redirect(`/etudiant/valve/${c.id}?question=impossible`);
  const cle = clePrivee(profil.id, auteur.id);
  const conversation = await db.conversation.upsert({
    where: { cle },
    update: {},
    create: { cle, type: "PRIVEE" },
  });
  await db.participantConversation.createMany({
    data: [
      { conversationId: conversation.id, utilisateurId: profil.id },
      { conversationId: conversation.id, utilisateurId: auteur.id },
    ],
    skipDuplicates: true,
  });
  redirect(`/etudiant/messages/${conversation.id}?communique=${c.id}`);
}

/* ---------- Modération ---------- */

export async function traiterSignalement(
  messageId: string,
  decision: "MASQUE" | "CLASSE",
): Promise<EtatFormulaire> {
  const u = await exigerPermission("messagerie.moderer");
  // La modération n'agit que sur un message signalé, jamais sur une conversation au hasard.
  const m = await db.message.findFirst({
    where: { id: messageId, signalements: { some: {} } },
  });
  if (!m) return echec("Aucun signalement pour ce message.");
  const maintenant = new Date();
  await db.$transaction([
    ...(decision === "MASQUE"
      ? [db.message.update({ where: { id: messageId }, data: { masqueLe: maintenant } })]
      : []),
    db.signalementMessage.updateMany({
      where: { messageId, traiteLe: null },
      data: { traiteLe: maintenant, traiteParId: u.id, decision },
    }),
  ]);
  await journaliser({
    auteurId: u.id,
    action: decision === "MASQUE" ? "message_masque" : "signalement_classe",
    entite: "Message",
    entiteId: messageId,
  });
  refresh();
  return succes(decision === "MASQUE" ? "Message masqué." : "Signalement classé sans suite.");
}
