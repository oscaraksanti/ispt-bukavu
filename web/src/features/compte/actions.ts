"use server";

import { hash, verify } from "@node-rs/argon2";
import sharp from "sharp";
import { refresh } from "next/cache";
import { after } from "next/server";
import { exigerConnexion } from "@/features/auth/acces";
import { estBloque, FENETRE_TENTATIVES_MS, verifierMotDePasse } from "@/features/auth/regles";
import { ipDuClient, lireSession } from "@/features/auth/session";
import { db } from "@/lib/db";
import { envoyerEmail, urlSite } from "@/lib/email";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { PREFIXE_CHANGEMENT, verifierPhotoProfil } from "./regles";

/**
 * Changement de mot de passe par le titulaire connecté : l'ancien mot de passe
 * est exigé (une session laissée ouverte ne suffit pas), les essais sont
 * limités, et les autres appareils sont déconnectés.
 */
export async function changerMotDePasse(
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/connexion");
  const session = await lireSession();
  const actuel = String(fd.get("actuel") ?? "");
  const nouveau = String(fd.get("nouveau") ?? "");
  const confirmation = String(fd.get("confirmation") ?? "");

  const probleme = verifierMotDePasse(nouveau);
  if (probleme) return echec(probleme, { nouveau: probleme });
  if (nouveau !== confirmation)
    return echec("Les deux nouveaux mots de passe ne correspondent pas.", {
      confirmation: "Ne correspond pas au nouveau mot de passe.",
    });
  if (nouveau === actuel)
    return echec("Choisissez un mot de passe différent de l'actuel.", {
      nouveau: "Identique au mot de passe actuel.",
    });

  const cle = `${PREFIXE_CHANGEMENT}${u.id}`;
  const ip = await ipDuClient();
  const echecs = await db.tentativeConnexion.count({
    where: {
      email: cle,
      reussie: false,
      creeLe: { gte: new Date(Date.now() - FENETRE_TENTATIVES_MS) },
    },
  });
  if (estBloque(echecs, 0))
    return echec("Trop d'essais. Pour votre sécurité, réessayez dans quinze minutes.");

  const compte = await db.utilisateur.findUnique({
    where: { id: u.id },
    select: { motDePasseHash: true, email: true, prenom: true },
  });
  const valide =
    !!compte?.motDePasseHash && (await verify(compte.motDePasseHash, actuel).catch(() => false));
  await db.tentativeConnexion.create({ data: { email: cle, ip, reussie: valide } });
  if (!valide)
    return echec("Mot de passe actuel incorrect.", { actuel: "Mot de passe actuel incorrect." });

  const motDePasseHash = await hash(nouveau);
  await db.$transaction([
    db.utilisateur.update({
      where: { id: u.id },
      data: { motDePasseHash, doitChangerMotDePasse: false },
    }),
    // Les autres appareils et les liens de réinitialisation en attente ne valent plus rien.
    db.session.deleteMany({
      where: { utilisateurId: u.id, ...(session ? { id: { not: session.sessionId } } : {}) },
    }),
    db.jetonReinitialisation.deleteMany({ where: { utilisateurId: u.id, utiliseLe: null } }),
  ]);
  await journaliser({
    auteurId: u.id,
    action: "mot_de_passe_change",
    entite: "Utilisateur",
    entiteId: u.id,
  });
  // Le titulaire est prévenu : si ce n'est pas lui, il le saura aussitôt.
  if (compte?.email) {
    const a = compte.email;
    const prenom = compte.prenom;
    after(() =>
      envoyerEmail({
        a,
        sujet: "Votre mot de passe ISPT-Bukavu a été modifié",
        texte: [
          `Bonjour${prenom ? ` ${prenom}` : ""},`,
          "",
          "Le mot de passe de votre compte ISPT-Bukavu vient d'être modifié, et vos autres appareils ont été déconnectés.",
          "",
          `Si vous n'êtes pas à l'origine de ce changement, réinitialisez-le sans attendre : ${urlSite()}/mot-de-passe-oublie`,
          "puis prévenez le secrétariat de l'institut.",
        ].join("\n"),
      }).catch(() => undefined),
    );
  }
  refresh();
  return succes("Mot de passe modifié. Vos autres appareils ont été déconnectés.");
}

/** Ferme toutes les sessions du titulaire, sauf celle de l'appareil utilisé. */
export async function deconnecterAutresAppareils(): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/connexion");
  const session = await lireSession();
  if (!session) return echec("Session expirée : reconnectez-vous.");
  const { count } = await db.session.deleteMany({
    where: { utilisateurId: u.id, id: { not: session.sessionId } },
  });
  await journaliser({
    auteurId: u.id,
    action: "sessions_fermees",
    entite: "Utilisateur",
    entiteId: u.id,
    apres: { sessions: count },
  });
  refresh();
  return succes(
    count
      ? `${count} autre(s) appareil(s) déconnecté(s).`
      : "Aucun autre appareil n'était connecté.",
  );
}

/**
 * Photo de profil du titulaire : recadrée en carré de 320 px (WebP), stockée
 * en privé ; l'ancienne photo est supprimée.
 */
export async function changerPhotoProfil(
  _e: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/connexion");
  const fichier = fd.get("photo");
  const probleme = verifierPhotoProfil(fichier instanceof File ? fichier : null);
  if (probleme) return echec(probleme);
  let contenu: Buffer;
  try {
    contenu = await sharp(Buffer.from(await (fichier as File).arrayBuffer()), {
      limitInputPixels: 60e6,
    })
      .rotate()
      .resize(320, 320, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return echec("Cette image n'a pas pu être lue.");
  }
  const ancien = await db.utilisateur.findUnique({
    where: { id: u.id },
    select: { photoCle: true },
  });
  const cle = `prive/profils/${u.id}/${jetonAleatoire(8).toLowerCase()}.webp`;
  await stockage().enregistrer(cle, contenu, "image/webp");
  await db.utilisateur.update({
    where: { id: u.id },
    data: { photoCle: cle, photoMajLe: new Date() },
  });
  if (ancien?.photoCle)
    await stockage()
      .supprimer(ancien.photoCle)
      .catch(() => undefined);
  await journaliser({
    auteurId: u.id,
    action: "photo_profil_modifiee",
    entite: "Utilisateur",
    entiteId: u.id,
  });
  refresh();
  return succes("Photo de profil enregistrée.");
}

export async function retirerPhotoProfil(): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/connexion");
  const ancien = await db.utilisateur.findUnique({
    where: { id: u.id },
    select: { photoCle: true },
  });
  if (!ancien?.photoCle) return succes("Aucune photo à retirer.");
  await db.utilisateur.update({ where: { id: u.id }, data: { photoCle: null, photoMajLe: null } });
  await stockage()
    .supprimer(ancien.photoCle)
    .catch(() => undefined);
  await journaliser({
    auteurId: u.id,
    action: "photo_profil_retiree",
    entite: "Utilisateur",
    entiteId: u.id,
  });
  refresh();
  return succes("Photo retirée.");
}
