"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { DUREE_JETON_INVITATION_MS, normaliserEmail } from "@/features/auth/regles";
import { db } from "@/lib/db";
import { envoyerEmail, urlSite } from "@/lib/email";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { PERMISSIONS, ROLES_PERSONNEL } from "@/lib/permissions";
import { empreinte, jetonAleatoire } from "@/lib/securite";
import { rolesAttribuablesPar } from "./catalogue";
import { type LignePersonnel, lireListePersonnel } from "./import";
import { compteModifiable } from "./regles";

/** Crée un lien d'invitation à usage unique et l'envoie par email. */
async function emettreInvitation(utilisateur: {
  id: string;
  email: string | null;
  prenom: string | null;
}) {
  await db.jetonReinitialisation.deleteMany({
    where: { utilisateurId: utilisateur.id, utiliseLe: null },
  });
  const jeton = jetonAleatoire();
  await db.jetonReinitialisation.create({
    data: {
      jetonHash: empreinte(jeton),
      utilisateurId: utilisateur.id,
      expireLe: new Date(Date.now() + DUREE_JETON_INVITATION_MS),
    },
  });
  const lien = `${urlSite()}/reinitialiser/${jeton}`;
  if (!utilisateur.email) return { lien, envoye: false };
  const { envoye } = await envoyerEmail({
    a: utilisateur.email,
    sujet: "Votre accès à la plateforme de l'ISPT-Bukavu",
    texte: `Bonjour${utilisateur.prenom ? ` ${utilisateur.prenom}` : ""},\n\nUn compte a été ouvert pour vous sur la plateforme de l'ISPT-Bukavu. Pour choisir votre mot de passe, ouvrez ce lien (valable 72 heures) :\n${lien}\n\nISPT-Bukavu`,
  });
  return { lien, envoye };
}

function messageInvitation(envoye: boolean, lien: string) {
  return envoye
    ? "Invitation envoyée par email (lien valable 72 heures)."
    : `L'email n'a pas pu être envoyé. Transmettez ce lien personnel, valable 72 heures : ${lien}`;
}

const schemaInvitation = z.object({
  prenom: z.string().trim().min(1, "Indiquez le prénom.").max(80),
  nom: z.string().trim().min(1, "Indiquez le nom.").max(80),
  postnom: z.string().trim().max(80),
  email: z.string().trim().email("Adresse email invalide.").max(160),
  roles: z.array(z.string()).min(1, "Choisissez au moins un rôle."),
});

/** Crée un compte invité avec ses rôles (et son profil d'enseignant). */
async function creerCompteInvite(donnees: {
  prenom: string;
  nom: string;
  postnom: string;
  email: string;
  roles: string[];
  titre?: string;
  domaine?: string;
}) {
  const roles = await db.role.findMany({ where: { code: { in: donnees.roles } } });
  const utilisateur = await db.utilisateur.create({
    data: {
      email: donnees.email,
      prenom: donnees.prenom || null,
      nom: donnees.nom.toUpperCase(),
      postnom: donnees.postnom ? donnees.postnom.toUpperCase() : null,
      statut: "INVITE",
      roles: { create: roles.map((role) => ({ roleId: role.id })) },
    },
  });
  if (donnees.roles.includes("enseignant"))
    await db.profilEnseignant.create({
      data: {
        utilisateurId: utilisateur.id,
        titre: donnees.titre || null,
        domaine: donnees.domaine || null,
      },
    });
  return utilisateur;
}

export async function inviterCompte(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("utilisateurs.gerer");
  const r = schemaInvitation.safeParse({
    prenom: formData.get("prenom") ?? "",
    nom: formData.get("nom") ?? "",
    postnom: formData.get("postnom") ?? "",
    email: formData.get("email") ?? "",
    roles: formData.getAll("roles").map(String),
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const email = normaliserEmail(r.data.email);
  const permis = await rolesAttribuablesPar(auteur);
  if (r.data.roles.some((code) => !permis.includes(code)))
    return echec("Vous ne pouvez pas attribuer l'un des rôles choisis.");
  if (await db.utilisateur.findUnique({ where: { email } }))
    return echec("Un compte existe déjà avec cette adresse.");

  const utilisateur = await creerCompteInvite({ ...r.data, email });
  await journaliser({
    auteurId: auteur.id,
    action: "utilisateur_cree",
    entite: "Utilisateur",
    entiteId: utilisateur.id,
    apres: { email, roles: r.data.roles },
  });
  const { lien, envoye } = await emettreInvitation(utilisateur);
  refresh();
  return succes(`Compte créé. ${messageInvitation(envoye, lien)}`);
}

/* ---------- Invitation en masse ---------- */

export type EtatImportPersonnel = EtatFormulaire & {
  lignes?: LignePersonnel[];
  /** Liens à transmettre à la main quand l'email n'a pas pu partir. */
  liens?: { email: string; lien: string }[];
};

/**
 * Invite en une fois une liste du personnel ou des enseignants : aperçu, puis
 * import confirmé. Les adresses déjà connues sont ignorées, jamais écrasées.
 */
export async function importerPersonnel(
  _etat: EtatImportPersonnel,
  fd: FormData,
): Promise<EtatImportPersonnel> {
  const auteur = await exigerPermission("utilisateurs.gerer");
  const contenu = String(fd.get("contenu") ?? "");
  if (contenu.length > 300_000) return echec("Fichier trop volumineux.");
  const permis = await rolesAttribuablesPar(auteur);
  const roles = await db.role.findMany({
    where: { code: { in: permis } },
    select: { code: true, libelle: true },
  });
  const lignes = lireListePersonnel(contenu, roles);
  if (lignes.length === 0)
    return echec(
      "Aucune ligne lisible. La première ligne doit contenir au moins les colonnes « Nom », « Email » et « Rôle ».",
    );
  const existants = new Set(
    (
      await db.utilisateur.findMany({
        where: { email: { in: lignes.map((l) => l.email).filter(Boolean) } },
        select: { email: true },
      })
    ).map((u) => u.email),
  );
  for (const l of lignes)
    if (!l.erreur && existants.has(l.email)) l.erreur = "Un compte existe déjà avec cette adresse";
  if (fd.get("mode") !== "importer") return { statut: null, lignes, horodatage: Date.now() };

  const valides = lignes.filter((l) => !l.erreur);
  if (valides.length === 0) return { ...echec("Aucune ligne valide à importer."), lignes };
  let envoyes = 0;
  const liens: { email: string; lien: string }[] = [];
  const erreurs: string[] = [];
  for (const l of valides) {
    try {
      const u = await creerCompteInvite(l);
      const r = await emettreInvitation(u);
      if (r.envoye) envoyes++;
      else liens.push({ email: l.email, lien: r.lien });
    } catch (e) {
      erreurs.push(`ligne ${l.ligne} : ${(e as Error).message.split("\n")[0]}`);
    }
  }
  const crees = valides.length - erreurs.length;
  await journaliser({
    auteurId: auteur.id,
    action: "personnel_importe",
    entite: "Utilisateur",
    apres: { crees, envoyes, erreurs: erreurs.length },
  });
  refresh();
  const resume = `${crees} compte(s) créé(s), ${envoyes} invitation(s) envoyée(s) par email.`;
  const suite = liens.length
    ? ` ${liens.length} lien(s) à transmettre à la main ci-dessous (valables 72 heures).`
    : "";
  return erreurs.length
    ? { ...echec(`${resume}${suite} À corriger : ${erreurs.join(" ; ")}`), liens }
    : { ...succes(`${resume}${suite}`), liens };
}

/** Renvoie une invitation à chaque compte du personnel encore en attente. */
export async function relancerInvitations(): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("utilisateurs.gerer");
  const comptes = await db.utilisateur.findMany({
    where: {
      statut: "INVITE",
      motDePasseHash: null,
      email: { not: null },
      profilEtudiant: null,
      roles: { some: { role: { code: { notIn: ["etudiant", "candidat"] } } } },
    },
    include: { roles: { include: { role: true } } },
    take: 200,
  });
  const cibles = comptes.filter((u) =>
    compteModifiable(auteur, { id: u.id, roles: u.roles.map((r) => r.role.code) }),
  );
  if (cibles.length === 0) return echec("Aucune invitation en attente.");
  let envoyes = 0;
  for (const u of cibles) if ((await emettreInvitation(u)).envoye) envoyes++;
  await journaliser({
    auteurId: auteur.id,
    action: "invitations_relancees",
    entite: "Utilisateur",
    apres: { comptes: cibles.length, envoyes },
  });
  refresh();
  return envoyes === cibles.length
    ? succes(`${envoyes} invitation(s) renvoyée(s) par email.`)
    : echec(
        `${envoyes} invitation(s) envoyée(s) sur ${cibles.length}. Pour les autres, utilisez « Renvoyer l'invitation » sur la fiche du compte afin d'obtenir le lien.`,
      );
}

export async function renvoyerInvitation(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("utilisateurs.gerer");
  const u = await db.utilisateur.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!u) return echec("Ce compte n'existe plus.");
  if (!compteModifiable(auteur, { id: u.id, roles: u.roles.map((r) => r.role.code) }))
    return echec("Vous ne pouvez pas modifier ce compte.");
  // Seul un compte qui n'a encore jamais choisi de mot de passe reçoit une invitation :
  // sinon le lien permettrait de prendre la place de son titulaire.
  if (u.statut !== "INVITE" || u.motDePasseHash)
    return echec(
      "Ce compte est déjà activé : son titulaire peut utiliser « Mot de passe oublié ».",
    );
  const { lien, envoye } = await emettreInvitation(u);
  await journaliser({
    auteurId: auteur.id,
    action: "invitation_renvoyee",
    entite: "Utilisateur",
    entiteId: id,
  });
  refresh();
  return succes(messageInvitation(envoye, lien));
}

export async function modifierRolesCompte(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("utilisateurs.gerer");
  const demandes = formData.getAll("roles").map(String);
  const cible = await db.utilisateur.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!cible) return echec("Ce compte n'existe plus.");
  const actuels = cible.roles.map((r) => r.role.code);
  if (!compteModifiable(auteur, { id, roles: actuels }))
    return echec(
      id === auteur.id
        ? "Vos propres rôles ne peuvent être changés que par un autre gestionnaire."
        : "Seul un administrateur technique peut modifier ce compte.",
    );
  const permis = await rolesAttribuablesPar(auteur);
  // Seuls les rôles que l'auteur peut attribuer peuvent changer ; les autres sont conservés.
  const conserves = actuels.filter((c) => !permis.includes(c));
  const nouveaux = [...new Set([...conserves, ...demandes.filter((c) => permis.includes(c))])];
  if (id === auteur.id && actuels.includes("super_admin") && !nouveaux.includes("super_admin"))
    return echec("Vous ne pouvez pas retirer votre propre rôle d'administrateur technique.");
  if (nouveaux.length === 0) return echec("Un compte doit garder au moins un rôle.");

  const roles = await db.role.findMany({ where: { code: { in: nouveaux } } });
  await db.$transaction([
    db.utilisateurRole.deleteMany({ where: { utilisateurId: id } }),
    db.utilisateurRole.createMany({
      data: roles.map((role) => ({ utilisateurId: id, roleId: role.id })),
    }),
  ]);
  if (nouveaux.includes("enseignant"))
    await db.profilEnseignant.upsert({
      where: { utilisateurId: id },
      update: {},
      create: { utilisateurId: id },
    });
  await journaliser({
    auteurId: auteur.id,
    action: "utilisateur_modifie",
    entite: "Utilisateur",
    entiteId: id,
    avant: { roles: actuels },
    apres: { roles: nouveaux },
  });
  refresh();
  return succes("Rôles enregistrés. Ils s'appliquent dès la prochaine page consultée.");
}

export async function changerStatutCompte(
  id: string,
  statut: "ACTIF" | "SUSPENDU",
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("utilisateurs.gerer");
  if (id === auteur.id) return echec("Vous ne pouvez pas suspendre votre propre compte.");
  const cible = await db.utilisateur.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!cible) return echec("Ce compte n'existe plus.");
  if (
    cible.roles.some((r) => r.role.code === "super_admin") &&
    !auteur.roles.includes("super_admin")
  )
    return echec("Seul un administrateur technique peut modifier ce compte.");

  // Réactivation : un compte qui n'a jamais défini de mot de passe redevient « invité ».
  const nouveau = statut === "ACTIF" && !cible.motDePasseHash ? "INVITE" : statut;
  await db.$transaction([
    db.utilisateur.update({ where: { id }, data: { statut: nouveau } }),
    ...(statut === "SUSPENDU"
      ? [
          db.session.deleteMany({ where: { utilisateurId: id } }),
          db.jetonReinitialisation.deleteMany({ where: { utilisateurId: id, utiliseLe: null } }),
        ]
      : []),
  ]);
  await journaliser({
    auteurId: auteur.id,
    action: statut === "SUSPENDU" ? "utilisateur_suspendu" : "utilisateur_reactive",
    entite: "Utilisateur",
    entiteId: id,
  });
  refresh();
  return succes(statut === "SUSPENDU" ? "Compte suspendu." : "Compte réactivé.");
}

/* ---------- Rôles ---------- */

export async function modifierPermissionsRole(
  roleId: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("roles.gerer");
  const role = await db.role.findUnique({ where: { id: roleId }, include: { permissions: true } });
  if (!role) return echec("Ce rôle n'existe plus.");
  if (role.code === "super_admin")
    return echec("Le rôle d'administrateur technique conserve toujours toutes les permissions.");
  const codes = formData
    .getAll("permissions")
    .map(String)
    .filter((c) => c in PERMISSIONS);
  if (!auteur.roles.includes("super_admin")) {
    // On ne modifie pas son propre rôle et on ne distribue que des permissions qu'on détient.
    if (auteur.roles.includes(role.code))
      return echec("Vous ne pouvez pas modifier un rôle que vous détenez vous-même.");
    if (codes.some((c) => !auteur.permissions.has(c)))
      return echec("Vous ne pouvez pas accorder une permission que vous ne détenez pas.");
  }
  // Un rôle sans accès à l'administration ne reçoit pas de permission d'administration.
  if (!ROLES_PERSONNEL.includes(role.code) && role.code !== "enseignant" && codes.length > 0)
    return echec("Ce rôle ne donne pas accès à l'administration.");

  await db.$transaction([
    db.rolePermission.deleteMany({ where: { roleId } }),
    db.rolePermission.createMany({
      data: codes.map((permissionCode) => ({ roleId, permissionCode })),
    }),
  ]);
  await journaliser({
    auteurId: auteur.id,
    action: "role_modifie",
    entite: "Role",
    entiteId: roleId,
    avant: role.permissions.map((p) => p.permissionCode),
    apres: codes,
  });
  refresh();
  return succes(`Permissions du rôle « ${role.libelle} » enregistrées.`);
}
