"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { ipDuClient } from "@/features/auth/session";
import { lireInstitut } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import { envoyerEmail, urlSite } from "@/lib/email";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { SUJETS_CONTACT } from "./sujets";

const MAX_MESSAGES_PAR_HEURE = 3;

const schema = z.object({
  nom: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  email: z.string().trim().email("Adresse email invalide.").max(160),
  telephone: z.string().trim().max(30),
  sujet: z.enum(Object.keys(SUJETS_CONTACT) as [string, ...string[]], {
    message: "Choisissez un sujet.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Votre message est trop court.")
    .max(4000, "Votre message est trop long (4 000 caractères au plus)."),
});

export async function envoyerMessage(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  // Champ invisible pour les personnes : rempli, il trahit un robot.
  if (String(formData.get("site") ?? "") !== "")
    return succes("Merci, votre message a bien été envoyé.");

  const saisie = {
    nom: String(formData.get("nom") ?? ""),
    email: String(formData.get("email") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
    sujet: String(formData.get("sujet") ?? ""),
    message: String(formData.get("message") ?? ""),
  };
  const r = schema.safeParse(saisie);
  if (!r.success) {
    const erreurs = Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
    return { ...echec("Vérifiez les champs signalés.", erreurs), valeurs: saisie };
  }

  try {
    const ip = await ipDuClient();
    const depuis = new Date(Date.now() - 3600 * 1000);
    const recents = await db.messageContact.count({
      where: {
        creeLe: { gte: depuis },
        OR: [{ email: r.data.email.toLowerCase() }, ...(ip ? [{ ip }] : [])],
      },
    });
    if (recents >= MAX_MESSAGES_PAR_HEURE)
      return {
        ...echec("Vous avez déjà écrit plusieurs fois récemment. Réessayez dans une heure."),
        valeurs: saisie,
      };

    await db.messageContact.create({
      data: {
        ...r.data,
        email: r.data.email.toLowerCase(),
        telephone: r.data.telephone || null,
        sujet: SUJETS_CONTACT[r.data.sujet],
        ip,
      },
    });
  } catch (erreur) {
    console.error("[contact] enregistrement impossible", erreur);
    return {
      ...echec(
        "Le message n'a pas pu être enregistré. Réessayez plus tard ou contactez-nous par téléphone.",
      ),
      valeurs: saisie,
    };
  }

  const institut = await lireInstitut();
  if (institut.email) {
    await envoyerEmail({
      a: institut.email,
      sujet: `Nouveau message : ${SUJETS_CONTACT[r.data.sujet]}`,
      texte: `${r.data.nom} (${r.data.email}${r.data.telephone ? `, ${r.data.telephone}` : ""}) a écrit depuis le site :\n\n${r.data.message}\n\nÀ traiter dans l'administration : ${urlSite()}/admin/messages`,
    }).catch(() => undefined);
  }
  return succes("Merci, votre message a bien été envoyé. Le secrétariat vous répondra par email.");
}

export async function marquerMessage(id: string, traite: boolean): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  await db.messageContact.update({ where: { id }, data: { traite } });
  await journaliser({
    auteurId: auteur.id,
    action: traite ? "message_traite" : "message_rouvert",
    entite: "MessageContact",
    entiteId: id,
  });
  refresh();
  return succes(traite ? "Message classé." : "Message rouvert.");
}

export async function supprimerMessage(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  await db.messageContact.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "message_supprime",
    entite: "MessageContact",
    entiteId: id,
  });
  refresh();
  return succes("Message supprimé.");
}
