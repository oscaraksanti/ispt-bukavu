"use server";

import { hash } from "@node-rs/argon2";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { exigerPermission } from "@/features/auth/acces";
import { normaliserMatricule, verifierMotDePasse } from "@/features/auth/regles";
import { ipDuClient, ouvrirSession } from "@/features/auth/session";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { codeLisible, empreinte } from "@/lib/securite";
import { type LigneRegistre, lireRegistre, separerNomComplet } from "./registre";
import { formaterCode, normaliserCode } from "./regles";

/** Durée de validité d'un code d'activation remis en classe. */
const DUREE_CODE_MS = 30 * 24 * 3600 * 1000;

async function roleEtudiant() {
  return db.role.findUniqueOrThrow({ where: { code: "etudiant" } });
}

/** Crée (ou retrouve par matricule) un étudiant et l'inscrit dans la promotion. */
async function inscrire(
  l: Pick<LigneRegistre, "nom" | "postnom" | "prenom" | "sexe" | "matricule" | "email">,
  promotionId: string,
  roleId: string,
) {
  const existant = await db.profilEtudiant.findUnique({ where: { matricule: l.matricule } });
  if (existant) {
    await db.inscription.upsert({
      where: { etudiantId_promotionId: { etudiantId: existant.id, promotionId } },
      update: {},
      create: { etudiantId: existant.id, promotionId },
    });
    return "reinscrit" as const;
  }
  if (l.email && (await db.utilisateur.findUnique({ where: { email: l.email } })))
    throw new Error(`Adresse déjà utilisée par un autre compte : ${l.email}`);
  await db.utilisateur.create({
    data: {
      email: l.email,
      nom: l.nom,
      postnom: l.postnom,
      prenom: l.prenom,
      statut: "INVITE",
      roles: { create: { roleId } },
      profilEtudiant: {
        create: {
          matricule: l.matricule,
          sexe: l.sexe,
          inscriptions: { create: { promotionId } },
        },
      },
    },
  });
  return "cree" as const;
}

/* ---------- Import d'un registre ---------- */

export type EtatImport = EtatFormulaire & { lignes?: LigneRegistre[] };

export async function importerRegistre(
  promotionId: string,
  _etat: EtatImport,
  fd: FormData,
): Promise<EtatImport> {
  const auteur = await exigerPermission("etudiants.gerer");
  const contenu = String(fd.get("contenu") ?? "");
  if (contenu.length > 500_000) return echec("Fichier trop volumineux.");
  const lignes = lireRegistre(contenu);
  if (lignes.length === 0)
    return echec(
      "Aucune ligne lisible. La première ligne doit contenir les colonnes « Nom » et « Matricule ».",
    );
  if (fd.get("mode") !== "importer") return { statut: null, lignes, horodatage: Date.now() };

  const valides = lignes.filter((l) => !l.erreur);
  if (valides.length === 0) return { ...echec("Aucune ligne valide à importer."), lignes };
  const role = await roleEtudiant();
  let crees = 0;
  let reinscrits = 0;
  const erreurs: string[] = [];
  for (const l of valides) {
    try {
      const r = await inscrire(l, promotionId, role.id);
      if (r === "cree") crees++;
      else reinscrits++;
    } catch (e) {
      erreurs.push(`ligne ${l.ligne} : ${(e as Error).message}`);
    }
  }
  await journaliser({
    auteurId: auteur.id,
    action: "etudiants_importes",
    entite: "Promotion",
    entiteId: promotionId,
    apres: { crees, reinscrits, erreurs: erreurs.length },
  });
  refresh();
  const resume = `${crees} étudiant(s) créé(s), ${reinscrits} déjà connu(s) inscrit(s) dans la promotion.`;
  return erreurs.length
    ? echec(`${resume} À corriger : ${erreurs.join(" ; ")}`)
    : succes(`${resume} Générez maintenant leurs codes d'activation.`);
}

export async function ajouterEtudiant(
  promotionId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("etudiants.gerer");
  const { nom, postnom, prenom } = separerNomComplet(String(fd.get("nomComplet") ?? ""));
  const matricule = normaliserMatricule(String(fd.get("matricule") ?? ""));
  const email =
    String(fd.get("email") ?? "")
      .trim()
      .toLowerCase() || null;
  const sexe = fd.get("sexe") === "F" ? "F" : fd.get("sexe") === "M" ? "M" : null;
  if (!nom) return echec("Indiquez le nom complet.");
  if (!/^[A-Z0-9/._-]{3,30}$/.test(matricule)) return echec("Matricule invalide.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return echec("Adresse email invalide.");
  try {
    const r = await inscrire(
      { nom, postnom, prenom, sexe, matricule, email },
      promotionId,
      (await roleEtudiant()).id,
    );
    await journaliser({
      auteurId: auteur.id,
      action: "etudiant_inscrit",
      entite: "Promotion",
      entiteId: promotionId,
      apres: { matricule },
    });
    refresh();
    return succes(
      r === "cree" ? "Étudiant ajouté." : "Étudiant déjà connu : inscrit dans la promotion.",
    );
  } catch (e) {
    return echec((e as Error).message);
  }
}

export async function changerStatutInscription(
  inscriptionId: string,
  statut: "EN_ATTENTE" | "EN_REGLE" | "SUSPENDUE" | "ABANDON",
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("etudiants.gerer");
  await db.inscription.update({ where: { id: inscriptionId }, data: { statut } });
  await journaliser({
    auteurId: auteur.id,
    action: "inscription_modifiee",
    entite: "Inscription",
    entiteId: inscriptionId,
    apres: { statut },
  });
  refresh();
  return succes("Inscription mise à jour.");
}

/* ---------- Codes d'activation ---------- */

export type EtatCodes = EtatFormulaire & {
  codes?: { matricule: string; nom: string; code: string }[];
};

/**
 * Génère un code d'activation pour chaque étudiant de la promotion qui n'a
 * pas encore choisi son mot de passe. Les codes ne sont affichés qu'une fois
 * (seule leur empreinte est conservée) ; en générer de nouveaux annule les
 * précédents.
 */
export async function genererCodes(promotionId: string): Promise<EtatCodes> {
  const auteur = await exigerPermission("etudiants.gerer");
  const inscriptions = await db.inscription.findMany({
    where: { promotionId, etudiant: { utilisateur: { statut: "INVITE" } } },
    include: { etudiant: { include: { utilisateur: true } } },
    orderBy: { etudiant: { utilisateur: { nom: "asc" } } },
  });
  if (inscriptions.length === 0)
    return echec("Tous les étudiants de la promotion ont déjà activé leur compte.");
  const codes: NonNullable<EtatCodes["codes"]> = [];
  for (const i of inscriptions) {
    const u = i.etudiant.utilisateur;
    const code = codeLisible(10);
    await db.$transaction([
      db.jetonReinitialisation.deleteMany({ where: { utilisateurId: u.id, utiliseLe: null } }),
      db.jetonReinitialisation.create({
        data: {
          jetonHash: empreinte(`activation:${code}`),
          utilisateurId: u.id,
          expireLe: new Date(Date.now() + DUREE_CODE_MS),
        },
      }),
    ]);
    codes.push({
      matricule: i.etudiant.matricule,
      nom: [u.nom, u.postnom, u.prenom].filter(Boolean).join(" "),
      code: formaterCode(code),
    });
  }
  await journaliser({
    auteurId: auteur.id,
    action: "codes_generes",
    entite: "Promotion",
    entiteId: promotionId,
    apres: { nombre: codes.length },
  });
  return { ...succes(`${codes.length} code(s) générés, valables 30 jours.`), codes };
}

/* ---------- Activation par l'étudiant ---------- */

export async function activerCompte(_etat: EtatFormulaire, fd: FormData): Promise<EtatFormulaire> {
  const matricule = normaliserMatricule(String(fd.get("matricule") ?? ""));
  const code = normaliserCode(String(fd.get("code") ?? ""));
  const motDePasse = String(fd.get("motDePasse") ?? "");
  const generique = echec("Matricule ou code d'activation incorrect.");
  if (!matricule || code.length < 8) return generique;
  const probleme = verifierMotDePasse(motDePasse);
  if (probleme) return echec(probleme);
  if (motDePasse !== String(fd.get("confirmation") ?? ""))
    return echec("Les deux mots de passe ne correspondent pas.");

  const ip = await ipDuClient();
  const cle = `activation:${matricule}`;
  const depuis = new Date(Date.now() - 15 * 60 * 1000);
  const echecs = await db.tentativeConnexion.count({
    where: { email: cle, reussie: false, creeLe: { gte: depuis } },
  });
  if (echecs >= 5) return echec("Trop de tentatives. Réessayez dans quinze minutes.");

  const profil = await db.profilEtudiant.findUnique({
    where: { matricule },
    include: { utilisateur: true },
  });
  const jeton = await db.jetonReinitialisation.findUnique({
    where: { jetonHash: empreinte(`activation:${code}`) },
  });
  const valide =
    !!profil &&
    !!jeton &&
    jeton.utilisateurId === profil.utilisateurId &&
    !jeton.utiliseLe &&
    jeton.expireLe > new Date() &&
    profil.utilisateur.statut !== "SUSPENDU";
  await db.tentativeConnexion.create({ data: { email: cle, ip, reussie: valide } });
  if (!valide) return generique;

  await db.$transaction([
    db.utilisateur.update({
      where: { id: profil.utilisateurId },
      data: {
        motDePasseHash: await hash(motDePasse),
        statut: "ACTIF",
        derniereConnexion: new Date(),
      },
    }),
    db.jetonReinitialisation.update({ where: { id: jeton.id }, data: { utiliseLe: new Date() } }),
  ]);
  await journaliser({
    auteurId: profil.utilisateurId,
    action: "compte_active",
    entite: "Utilisateur",
    entiteId: profil.utilisateurId,
  });
  await ouvrirSession(profil.utilisateurId);
  redirect("/etudiant");
}

/* ---------- Inscription d'un candidat admis ---------- */

export async function inscrireAdmis(
  candidatureId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("etudiants.gerer");
  const matricule = normaliserMatricule(String(fd.get("matricule") ?? ""));
  if (!/^[A-Z0-9/._-]{3,30}$/.test(matricule)) return echec("Matricule invalide.");
  const c = await db.candidature.findUnique({
    where: { id: candidatureId },
    include: { campagne: true },
  });
  if (!c || c.statut !== "ADMISE") return echec("Seul un candidat admis peut être inscrit.");
  if (!c.filiereId) return echec("La filière du candidat n'est pas renseignée.");
  if (await db.profilEtudiant.findUnique({ where: { matricule } }))
    return echec("Ce matricule est déjà attribué.");
  const niveau = await db.niveau.findFirstOrThrow({ orderBy: { ordre: "asc" } });
  const promotion = await db.promotion.upsert({
    where: {
      filiereId_niveauId_anneeId: {
        filiereId: c.filiereId,
        niveauId: niveau.id,
        anneeId: c.campagne.anneeId,
      },
    },
    update: {},
    create: { filiereId: c.filiereId, niveauId: niveau.id, anneeId: c.campagne.anneeId },
  });
  const role = await roleEtudiant();
  const profil = await db.profilEtudiant.create({
    data: {
      utilisateurId: c.candidatId,
      matricule,
      sexe: c.sexe,
      dateNaissance: c.dateNaissance,
      lieuNaissance: c.lieuNaissance,
      inscriptions: { create: { promotionId: promotion.id, statut: "EN_ATTENTE" } },
    },
  });
  await db.$transaction([
    db.utilisateurRole.upsert({
      where: { utilisateurId_roleId: { utilisateurId: c.candidatId, roleId: role.id } },
      update: {},
      create: { utilisateurId: c.candidatId, roleId: role.id },
    }),
    db.candidature.update({
      where: { id: c.id },
      data: {
        statut: "INSCRITE",
        etudiantId: profil.id,
        historique: {
          create: {
            statut: "INSCRITE",
            auteurId: auteur.id,
            commentaire: `Matricule ${matricule}`,
          },
        },
      },
    }),
  ]);
  await journaliser({
    auteurId: auteur.id,
    action: "admis_inscrit",
    entite: "Candidature",
    entiteId: c.id,
    apres: { matricule, promotionId: promotion.id },
  });
  refresh();
  return succes(`Inscrit en première année avec le matricule ${matricule}.`);
}
