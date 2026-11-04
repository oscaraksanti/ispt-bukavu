/**
 * Lecture d'une liste du personnel ou des enseignants (CSV exporté d'un
 * tableur) pour une invitation en masse. Colonnes reconnues, dans n'importe
 * quel ordre : Prénom, Nom, Post-nom, Email, Rôle, et pour les enseignants
 * Titre et Domaine. Fonctions pures, testées unitairement.
 */
import { decouper, sansAccents, separateur } from "@/features/academique/registre";

export type RoleConnu = { code: string; libelle: string };

export type LignePersonnel = {
  ligne: number;
  prenom: string;
  nom: string;
  postnom: string;
  email: string;
  roles: string[];
  titre: string;
  domaine: string;
  erreur?: string;
};

export const MAX_LIGNES_IMPORT = 300;

/** Noms d'usage des rôles, en plus de leur code et de leur libellé. */
const ALIAS: Record<string, string> = {
  appariteur: "section",
  apparitorat: "section",
  "secretariat de section": "section",
  "secretaire de section": "section",
  dg: "direction",
  "directeur general": "direction",
  sga: "secretariat_academique",
  "secretaire general academique": "secretariat_academique",
  sgad: "secretariat_administratif",
  "secretaire general administratif": "secretariat_administratif",
  caissier: "caisse",
  caissiere: "caisse",
  comptable: "caisse",
  professeur: "enseignant",
  assistant: "enseignant",
  "chef de travaux": "enseignant",
  informaticien: "support",
};

const simplifier = (t: string) =>
  sansAccents(t)
    .replace(/[^a-z0-9_ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Retrouve un rôle par son code, son libellé ou un nom d'usage. */
export function trouverRole(saisie: string, roles: RoleConnu[]): string | null {
  const s = simplifier(saisie);
  if (!s) return null;
  const direct = roles.find(
    (r) => simplifier(r.code) === s || simplifier(r.libelle) === s || r.code === saisie.trim(),
  );
  if (direct) return direct.code;
  const alias = ALIAS[s];
  return alias && roles.some((r) => r.code === alias) ? alias : null;
}

function indexColonne(entetes: string[], ...noms: string[]) {
  return entetes.findIndex((e) => noms.includes(e));
}

/**
 * Analyse le fichier. Les rôles non reconnus ou non attribuables par
 * l'auteur sont signalés ligne par ligne (rien n'est importé en silence).
 */
export function lireListePersonnel(contenu: string, roles: RoleConnu[]): LignePersonnel[] {
  const lignes = contenu
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lignes.length < 2) return [];
  const sep = separateur(lignes[0]);
  const entetes = decouper(lignes[0], sep).map((e) => simplifier(e).replace(/[ _]/g, ""));
  const iPrenom = indexColonne(entetes, "prenom", "prenoms");
  const iNom = indexColonne(entetes, "nom");
  const iPostnom = indexColonne(entetes, "postnom");
  const iEmail = indexColonne(entetes, "email", "mail", "courriel", "adresseemail");
  const iRole = indexColonne(entetes, "role", "roles", "fonction");
  const iTitre = indexColonne(entetes, "titre", "grade");
  const iDomaine = indexColonne(entetes, "domaine", "specialite");
  if (iNom < 0 || iEmail < 0 || iRole < 0) return [];

  const vus = new Set<string>();
  return lignes.slice(1, MAX_LIGNES_IMPORT + 1).map((brute, k) => {
    const c = decouper(brute, sep);
    const cellule = (i: number) => (i >= 0 ? (c[i] ?? "").trim() : "");
    const saisieRoles = cellule(iRole)
      .split(/[|+/,]| et /)
      .map((r) => r.trim())
      .filter(Boolean);
    const codes = saisieRoles.map((r) => trouverRole(r, roles));
    const email = cellule(iEmail).toLowerCase();
    const ligne: LignePersonnel = {
      ligne: k + 2,
      prenom: cellule(iPrenom),
      nom: cellule(iNom).toUpperCase(),
      postnom: cellule(iPostnom).toUpperCase(),
      email,
      roles: [...new Set(codes.filter((x): x is string => !!x))],
      titre: cellule(iTitre),
      domaine: cellule(iDomaine),
    };
    const inconnu = saisieRoles.find((_, i) => !codes[i]);
    if (!ligne.nom) ligne.erreur = "Nom manquant";
    else if (!email) ligne.erreur = "Email manquant";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160)
      ligne.erreur = "Email invalide";
    else if (vus.has(email)) ligne.erreur = "Email en double dans le fichier";
    else if (saisieRoles.length === 0) ligne.erreur = "Rôle manquant";
    else if (inconnu) ligne.erreur = `Rôle non reconnu ou non attribuable : « ${inconnu} »`;
    else if (ligne.prenom.length > 80 || ligne.nom.length > 80 || ligne.postnom.length > 80)
      ligne.erreur = "Nom trop long";
    vus.add(email);
    return ligne;
  });
}

/** Modèle de fichier proposé au téléchargement. */
export const MODELE_CSV_PERSONNEL =
  "Prénom;Nom;Post-nom;Email;Rôle;Titre;Domaine\n" +
  "Prénom;NOM;POSTNOM;adresse@exemple.org;Appariteur;;\n" +
  "Prénom;NOM;POSTNOM;enseignant@exemple.org;Enseignant;CT;Génie informatique\n";
