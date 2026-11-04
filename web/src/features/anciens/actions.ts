"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { normaliserEmail } from "@/features/auth/regles";
import { ipDuClient } from "@/features/auth/session";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { notifier, personnelAvecPermission } from "@/features/notifications/emettre";
import { db } from "@/lib/db";
import { envoyerEmail, urlSite } from "@/lib/email";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { empreinte, jetonAleatoire } from "@/lib/securite";
import { anneeSortieValide, lienProfessionnelValide } from "./regles";

const texte = (max: number) => z.string().trim().max(max);
const schema = z.object({
  prenom: z.string().trim().min(1, "Indiquez votre prénom.").max(80),
  nom: z.string().trim().min(1, "Indiquez votre nom.").max(80),
  postnom: texte(80),
  email: z.string().trim().email("Adresse email invalide.").max(160),
  filiereId: texte(40),
  anneeSortie: z.string().regex(/^\d{4}$/, "Indiquez l'année de sortie."),
  poste: texte(120),
  employeur: texte(120),
  ville: texte(80),
  parcours: texte(800),
  lienProfessionnel: texte(200),
});

const champs = Object.keys(schema.shape);

/** Demande publique d'inscription à l'annuaire, vérifiée par l'institut avant publication. */
export async function inscrireAncien(_etat: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  if (String(fd.get("site") ?? "") !== "") return echec("Envoi refusé.");
  const saisie = Object.fromEntries(champs.map((k) => [k, String(fd.get(k) ?? "")]));
  const r = schema.safeParse(saisie);
  const erreurs: Record<string, string> = r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
  if (r.success && !anneeSortieValide(Number(r.data.anneeSortie)))
    erreurs.anneeSortie = "Année de sortie invalide.";
  if (r.success && !lienProfessionnelValide(r.data.lienProfessionnel))
    erreurs.lienProfessionnel = "Adresse invalide : elle doit commencer par https://";
  if (fd.get("consentement") !== "on")
    erreurs.consentement = "Votre accord est nécessaire pour paraître dans l'annuaire.";
  if (!r.success || Object.keys(erreurs).length > 0)
    return { ...echec("Vérifiez les champs signalés.", erreurs), valeurs: saisie };
  const d = r.data;
  if (d.filiereId && !(await db.filiere.findUnique({ where: { id: d.filiereId } })))
    return echec("Filière inconnue.");

  const ip = await ipDuClient();
  if (ip) {
    const recentes = await db.tentativeConnexion.count({
      where: {
        ip,
        email: { startsWith: "ancien:" },
        creeLe: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentes >= 5)
      return {
        ...echec("Trop de demandes depuis cette connexion. Réessayez plus tard."),
        valeurs: saisie,
      };
  }
  const email = normaliserEmail(d.email);
  await db.tentativeConnexion.create({ data: { email: `ancien:${email}`, ip, reussie: true } });
  const vide = (v: string) => v || null;
  const ancien = await db.ancien.create({
    data: {
      prenom: d.prenom,
      nom: d.nom.toUpperCase(),
      postnom: d.postnom ? d.postnom.toUpperCase() : null,
      email,
      filiereId: vide(d.filiereId),
      anneeSortie: Number(d.anneeSortie),
      poste: vide(d.poste),
      employeur: vide(d.employeur),
      ville: vide(d.ville),
      parcours: vide(d.parcours),
      lienProfessionnel: vide(d.lienProfessionnel),
      consentementLe: new Date(),
    },
  });
  await journaliser({ action: "ancien_inscrit", entite: "Ancien", entiteId: ancien.id });
  await notifier(await personnelAvecPermission("contenu.modifier"), {
    type: "ANCIEN",
    titre: "Annuaire des anciens : demande à vérifier",
    message: `${d.prenom} ${ancien.nom}, sortie ${d.anneeSortie}.`,
    lien: "/admin/anciens",
  });
  after(() =>
    envoyerEmail({
      a: email,
      sujet: "Votre demande d'inscription à l'annuaire des anciens — ISPT-Bukavu",
      texte: `Bonjour ${d.prenom},\n\nNous avons bien reçu votre demande d'inscription à l'annuaire des anciens de l'ISPT-Bukavu. Elle sera publiée après vérification par l'institut ; vous recevrez alors un lien personnel pour vous retirer de l'annuaire à tout moment.\n\nISPT-Bukavu`,
    }).then(() => undefined),
  );
  return succes(
    "Merci. Votre demande sera publiée après vérification par l'institut ; un email vous le confirmera.",
  );
}

/* ---------- Modération ---------- */

export async function publierAncien(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const a = await db.ancien.findUnique({ where: { id } });
  if (!a) return echec("Cette inscription n'existe plus.");
  if (a.statut === "PUBLIE") return echec("Déjà publiée.");
  const jeton = jetonAleatoire();
  await db.ancien.update({
    where: { id },
    data: {
      statut: "PUBLIE",
      motifRefus: null,
      verifieParId: auteur.id,
      verifieLe: new Date(),
      jetonRetraitHash: empreinte(`retrait:${jeton}`),
    },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "ancien_publie",
    entite: "Ancien",
    entiteId: id,
  });
  await envoyerEmail({
    a: a.email,
    sujet: "Vous figurez dans l'annuaire des anciens de l'ISPT-Bukavu",
    texte: `Bonjour ${a.prenom},\n\nVotre fiche est publiée dans l'annuaire des anciens :\n${urlSite()}/anciens\n\nPour vous en retirer à tout moment, utilisez ce lien personnel (conservez ce message) :\n${urlSite()}/anciens/retrait/${jeton}\n\nISPT-Bukavu`,
  }).catch(() => undefined);
  updateTag(ETIQUETTES.anciens);
  refresh();
  return succes("Fiche publiée ; l'ancien a reçu son lien de retrait.");
}

export async function refuserAncien(
  id: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const motif = String(fd.get("motif") ?? "")
    .trim()
    .slice(0, 300);
  if (!motif) return echec("Indiquez le motif communiqué à la personne.");
  const a = await db.ancien.findUnique({ where: { id } });
  if (!a) return echec("Cette inscription n'existe plus.");
  await db.ancien.update({
    where: { id },
    data: { statut: "REFUSE", motifRefus: motif, jetonRetraitHash: null },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "ancien_refuse",
    entite: "Ancien",
    entiteId: id,
    apres: { motif },
  });
  await envoyerEmail({
    a: a.email,
    sujet: "Annuaire des anciens de l'ISPT-Bukavu",
    texte: `Bonjour ${a.prenom},\n\nVotre demande d'inscription à l'annuaire des anciens n'a pas pu être publiée.\n\nMotif : ${motif}\n\nISPT-Bukavu`,
  }).catch(() => undefined);
  updateTag(ETIQUETTES.anciens);
  refresh();
  return succes("Demande refusée ; la personne est prévenue.");
}

/** Retrait par l'administration : la fiche est effacée, pas seulement masquée. */
export async function supprimerAncien(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("contenu.modifier");
  const a = await db.ancien.findUnique({ where: { id } });
  if (!a) return echec("Cette inscription n'existe plus.");
  await db.ancien.delete({ where: { id } });
  await journaliser({
    auteurId: auteur.id,
    action: "ancien_retire",
    entite: "Ancien",
    entiteId: id,
  });
  updateTag(ETIQUETTES.anciens);
  refresh();
  return succes("Fiche effacée.");
}

/** Retrait par la personne elle-même, avec son lien personnel : effacement complet. */
export async function retirerParLien(_etat: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  const jeton = String(fd.get("jeton") ?? "");
  const invalide = echec(
    "Ce lien n'est plus valable. Écrivez à l'institut pour demander votre retrait.",
  );
  if (!/^[A-Za-z0-9_-]{20,}$/.test(jeton)) return invalide;
  const a = await db.ancien.findUnique({
    where: { jetonRetraitHash: empreinte(`retrait:${jeton}`) },
  });
  if (!a) return invalide;
  await db.ancien.delete({ where: { id: a.id } });
  await journaliser({ action: "ancien_retire", entite: "Ancien", entiteId: a.id });
  updateTag(ETIQUETTES.anciens);
  redirect("/anciens?retrait=1");
}
