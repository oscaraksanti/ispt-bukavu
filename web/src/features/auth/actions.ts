"use server";

import { hash, verify } from "@node-rs/argon2";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { espaceParDefaut } from "@/features/admissions/regles";
import { envoyerEmail, urlSite } from "@/lib/email";
import { ROLES_PERSONNEL } from "@/lib/permissions";
import { journaliser } from "@/lib/journal";
import { empreinte, jetonAleatoire } from "@/lib/securite";
import {
  DUREE_JETON_REINITIALISATION_MS,
  FENETRE_TENTATIVES_MS,
  destinationSure,
  estBloque,
  normaliserEmail,
  verifierMotDePasse,
} from "./regles";
import { fermerSession, ipDuClient, ouvrirSession } from "./session";

export type EtatFormulaire = { erreur?: string; succes?: string } | undefined;

const MESSAGE_IDENTIFIANTS = "Adresse email ou mot de passe incorrect.";

// Empreinte factice : le temps de réponse reste le même que le compte existe ou non.
const EMPREINTE_FACTICE =
  "$argon2id$v=19$m=19456,t=2,p=1$NycLN15Mxh9Qer2AABYuuw$fTLXpc3wbGA2DsYRMZiiad8b2ab8WcxUKflpJ203HIk";

export async function seConnecter(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const schema = z.object({
    email: z.string().email(),
    motDePasse: z.string().min(1).max(128),
    suite: z.string().optional(),
  });
  const saisie = schema.safeParse({
    email: donnees.get("email"),
    motDePasse: donnees.get("motDePasse"),
    suite: donnees.get("suite") ?? undefined,
  });
  if (!saisie.success) return { erreur: MESSAGE_IDENTIFIANTS };

  let destination = "/";
  try {
    const email = normaliserEmail(saisie.data.email);
    const ip = await ipDuClient();
    const depuis = new Date(Date.now() - FENETRE_TENTATIVES_MS);
    const [echecsEmail, echecsIp] = await Promise.all([
      db.tentativeConnexion.count({ where: { email, reussie: false, creeLe: { gte: depuis } } }),
      ip
        ? db.tentativeConnexion.count({ where: { ip, reussie: false, creeLe: { gte: depuis } } })
        : 0,
    ]);
    if (estBloque(echecsEmail, echecsIp)) {
      return {
        erreur: "Trop de tentatives. Pour votre sécurité, réessayez dans quinze minutes.",
      };
    }

    const utilisateur = await db.utilisateur.findUnique({
      where: { email },
      include: { roles: { include: { role: { select: { code: true } } } } },
    });
    const valide = await verify(
      utilisateur?.motDePasseHash ?? EMPREINTE_FACTICE,
      saisie.data.motDePasse,
    ).catch(() => false);

    const accepte = !!utilisateur && valide && utilisateur.statut === "ACTIF";
    await db.tentativeConnexion.create({ data: { email, ip, reussie: accepte } });
    if (!accepte) return { erreur: MESSAGE_IDENTIFIANTS };

    await ouvrirSession(utilisateur.id);
    await db.utilisateur.update({
      where: { id: utilisateur.id },
      data: { derniereConnexion: new Date() },
    });
    await journaliser({
      auteurId: utilisateur.id,
      action: "connexion",
      entite: "Utilisateur",
      entiteId: utilisateur.id,
    });
    destination = destinationSure(
      saisie.data.suite,
      espaceParDefaut(
        utilisateur.roles.map((r) => r.role.code),
        ROLES_PERSONNEL,
      ),
    );
  } catch (erreur) {
    console.error("[connexion] service indisponible", erreur);
    return {
      erreur:
        "Le service de connexion est momentanément indisponible. Réessayez dans quelques minutes.",
    };
  }
  redirect(destination);
}

export async function seDeconnecter() {
  await fermerSession();
  redirect("/connexion");
}

export async function demanderReinitialisation(
  _: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const email = normaliserEmail(String(donnees.get("email") ?? ""));
  const reponse = {
    succes:
      "Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé. Il est valable une heure.",
  };
  if (!z.string().email().safeParse(email).success) return reponse;

  const utilisateur = await db.utilisateur.findUnique({ where: { email } });
  if (!utilisateur || utilisateur.statut === "SUSPENDU") return reponse;

  const jeton = jetonAleatoire();
  await db.jetonReinitialisation.create({
    data: {
      jetonHash: empreinte(jeton),
      utilisateurId: utilisateur.id,
      expireLe: new Date(Date.now() + DUREE_JETON_REINITIALISATION_MS),
    },
  });
  const lien = `${urlSite()}/reinitialiser/${jeton}`;
  await envoyerEmail({
    a: email,
    sujet: "Réinitialisation de votre mot de passe — ISPT-Bukavu",
    texte: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable une heure) :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\nISPT-Bukavu`,
  });
  return reponse;
}

/** Définit un mot de passe à partir d'un lien de réinitialisation ou d'invitation. */
export async function definirMotDePasse(
  _: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const jeton = String(donnees.get("jeton") ?? "");
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  const confirmation = String(donnees.get("confirmation") ?? "");

  const probleme = verifierMotDePasse(motDePasse);
  if (probleme) return { erreur: probleme };
  if (motDePasse !== confirmation)
    return { erreur: "Les deux mots de passe ne correspondent pas." };

  const enregistrement = await db.jetonReinitialisation.findUnique({
    where: { jetonHash: empreinte(jeton) },
  });
  if (!enregistrement || enregistrement.utiliseLe || enregistrement.expireLe < new Date()) {
    return { erreur: "Ce lien n'est plus valable. Demandez-en un nouveau." };
  }
  // Un compte suspendu ne peut pas être réactivé par un lien émis avant la suspension.
  const titulaire = await db.utilisateur.findUnique({
    where: { id: enregistrement.utilisateurId },
    select: { statut: true },
  });
  if (!titulaire || titulaire.statut === "SUSPENDU") {
    return { erreur: "Ce lien n'est plus valable. Demandez-en un nouveau." };
  }

  await db.$transaction([
    db.utilisateur.update({
      where: { id: enregistrement.utilisateurId },
      data: {
        motDePasseHash: await hash(motDePasse),
        statut: "ACTIF",
        emailVerifieLe: new Date(),
        doitChangerMotDePasse: false,
        derniereConnexion: new Date(),
      },
    }),
    db.jetonReinitialisation.update({
      where: { id: enregistrement.id },
      data: { utiliseLe: new Date() },
    }),
    // Toute session ouverte avant le changement est fermée.
    db.session.deleteMany({ where: { utilisateurId: enregistrement.utilisateurId } }),
  ]);
  await journaliser({
    auteurId: enregistrement.utilisateurId,
    action: "mot_de_passe_defini",
    entite: "Utilisateur",
    entiteId: enregistrement.utilisateurId,
  });
  await ouvrirSession(enregistrement.utilisateurId);
  const roles = await db.utilisateurRole.findMany({
    where: { utilisateurId: enregistrement.utilisateurId },
    include: { role: { select: { code: true } } },
  });
  redirect(
    espaceParDefaut(
      roles.map((r) => r.role.code),
      ROLES_PERSONNEL,
    ),
  );
}
