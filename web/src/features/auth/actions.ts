"use server";

import { hash, verify } from "@node-rs/argon2";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { espaceParDefaut } from "@/features/admissions/regles";
import { envoyerEmail, urlSite } from "@/lib/email";
import { ROLES_PERSONNEL } from "@/lib/permissions";
import { journaliser } from "@/lib/journal";
import { empreinte, jetonAleatoire } from "@/lib/securite";
import {
  normaliserIdentifiant,
  DUREE_JETON_REINITIALISATION_MS,
  FENETRE_DEMANDES_MS,
  FENETRE_TENTATIVES_MS,
  MAX_DEMANDES_PAR_EMAIL,
  MAX_DEMANDES_PAR_IP,
  destinationSure,
  estBloque,
  normaliserEmail,
  verifierMotDePasse,
} from "./regles";
import { profilsMessagerie, synchroniserGroupes } from "@/features/messagerie/acces";
import { aAccesMessagerie } from "@/features/messagerie/regles";
import { fermerSession, ipDuClient, ouvrirSession } from "./session";

export type EtatFormulaire = { erreur?: string; succes?: string } | undefined;

const MESSAGE_IDENTIFIANTS = "Adresse email ou mot de passe incorrect.";

// Empreinte factice : le temps de réponse reste le même que le compte existe ou non.
const EMPREINTE_FACTICE =
  "$argon2id$v=19$m=19456,t=2,p=1$NycLN15Mxh9Qer2AABYuuw$fTLXpc3wbGA2DsYRMZiiad8b2ab8WcxUKflpJ203HIk";

export async function seConnecter(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const schema = z.object({
    email: z.string().trim().min(2).max(160),
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
    // Identifiant : adresse email, ou matricule pour les étudiants.
    const email = normaliserIdentifiant(saisie.data.email);
    const ip = await ipDuClient();
    const depuis = new Date(Date.now() - FENETRE_TENTATIVES_MS);
    const [echecsEmailIp, echecsIp, echecsCompte] = await Promise.all([
      db.tentativeConnexion.count({
        where: { email, ip, reussie: false, creeLe: { gte: depuis } },
      }),
      ip
        ? db.tentativeConnexion.count({ where: { ip, reussie: false, creeLe: { gte: depuis } } })
        : 0,
      db.tentativeConnexion.count({ where: { email, reussie: false, creeLe: { gte: depuis } } }),
    ]);
    if (estBloque(echecsEmailIp, echecsIp, echecsCompte)) {
      return {
        erreur: "Trop de tentatives. Pour votre sécurité, réessayez dans quinze minutes.",
      };
    }

    const inclure = { roles: { include: { role: { select: { code: true } } } } };
    const utilisateur = email.includes("@")
      ? await db.utilisateur.findUnique({ where: { email }, include: inclure })
      : ((
          await db.profilEtudiant.findUnique({
            where: { matricule: email },
            include: { utilisateur: { include: inclure } },
          })
        )?.utilisateur ?? null);
    const valide = await verify(
      utilisateur?.motDePasseHash ?? EMPREINTE_FACTICE,
      saisie.data.motDePasse,
    ).catch(() => false);

    const accepte = !!utilisateur && valide && utilisateur.statut === "ACTIF";
    await db.tentativeConnexion.create({ data: { email, ip, reussie: accepte } });
    if (!accepte) return { erreur: MESSAGE_IDENTIFIANTS };

    await ouvrirSession(utilisateur.id);
    // Groupes de messagerie (promotion, cours) prêts dès la connexion : la pastille
    // des messages non lus en tient compte sans attendre la première visite.
    const id = utilisateur.id;
    after(async () => {
      try {
        const profil = (await profilsMessagerie([id])).get(id);
        if (profil && aAccesMessagerie(profil)) await synchroniserGroupes(profil);
      } catch (e) {
        console.error("[messagerie] synchronisation des groupes", e);
      }
    });
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
  const ip = await ipDuClient();

  // Le traitement a lieu après l'envoi de la réponse : son temps de réponse ne
  // révèle donc pas si l'adresse correspond à un compte.
  after(async () => {
    try {
      const depuis = new Date(Date.now() - FENETRE_DEMANDES_MS);
      const marque = `reinitialisation:${email}`;
      const [parEmail, parIp] = await Promise.all([
        db.tentativeConnexion.count({ where: { email: marque, creeLe: { gte: depuis } } }),
        ip
          ? db.tentativeConnexion.count({
              where: { ip, email: { startsWith: "reinitialisation:" }, creeLe: { gte: depuis } },
            })
          : 0,
      ]);
      // Limite : une boîte mail ne peut pas être inondée de liens.
      if (parEmail >= MAX_DEMANDES_PAR_EMAIL || parIp >= MAX_DEMANDES_PAR_IP) return;
      await db.tentativeConnexion.create({ data: { email: marque, ip, reussie: true } });

      const utilisateur = await db.utilisateur.findUnique({ where: { email } });
      if (!utilisateur || utilisateur.statut === "SUSPENDU") return;
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
    } catch (erreur) {
      console.error("[reinitialisation] échec du traitement", erreur);
    }
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

  // Les codes d'activation (« activation:… ») passent par /activer, avec le matricule.
  if (!/^[A-Za-z0-9_-]{20,}$/.test(jeton))
    return { erreur: "Ce lien n'est plus valable. Demandez-en un nouveau." };
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

  const motDePasseHash = await hash(motDePasse);
  const consomme = await db.$transaction(async (tx) => {
    // Usage unique garanti même si le lien est soumis deux fois en même temps.
    const r = await tx.jetonReinitialisation.updateMany({
      where: { id: enregistrement.id, utiliseLe: null },
      data: { utiliseLe: new Date() },
    });
    if (r.count !== 1) return false;
    await tx.utilisateur.update({
      where: { id: enregistrement.utilisateurId },
      data: {
        motDePasseHash,
        statut: "ACTIF",
        emailVerifieLe: new Date(),
        doitChangerMotDePasse: false,
        derniereConnexion: new Date(),
      },
    });
    // Toute session ouverte avant le changement est fermée.
    await tx.session.deleteMany({ where: { utilisateurId: enregistrement.utilisateurId } });
    return true;
  });
  if (!consomme) return { erreur: "Ce lien n'est plus valable. Demandez-en un nouveau." };
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
