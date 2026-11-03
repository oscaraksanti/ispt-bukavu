/**
 * Lecture des registres d'étudiants tenus par l'institut (tableur exporté en
 * CSV) : N°, « Nom, post-nom et prénom », Sexe, Matricule, et facultativement
 * une adresse email. Fonctions pures, testées unitairement.
 */
import { normaliserMatricule } from "@/features/auth/regles";

export type LigneRegistre = {
  ligne: number;
  nom: string;
  postnom: string | null;
  prenom: string | null;
  sexe: "F" | "M" | null;
  matricule: string;
  email: string | null;
  erreur?: string;
};

function separateur(entete: string) {
  const candidats = [";", "\t", ","];
  return candidats.reduce((meilleur, c) =>
    entete.split(c).length > entete.split(meilleur).length ? c : meilleur,
  );
}

function decouper(ligne: string, sep: string) {
  const cellules: string[] = [];
  let courante = "";
  let guillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (guillemets && ligne[i + 1] === '"') {
        courante += '"';
        i++;
      } else guillemets = !guillemets;
    } else if (c === sep && !guillemets) {
      cellules.push(courante.trim());
      courante = "";
    } else courante += c;
  }
  cellules.push(courante.trim());
  return cellules;
}

const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Sépare « NOM POST-NOM Prénom » : les mots en capitales forment le nom et le
 * post-nom, les autres le prénom. Si tout est en capitales, le dernier mot
 * est pris comme prénom (à vérifier dans l'aperçu avant l'import).
 */
export function separerNomComplet(complet: string) {
  const mots = complet.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (mots.length === 0) return { nom: "", postnom: null, prenom: null };
  const capitales = mots.filter((m) => m === m.toUpperCase() && /\p{L}/u.test(m));
  const autres = mots.filter((m) => !capitales.includes(m));
  if (capitales.length > 0 && autres.length > 0) {
    return {
      nom: capitales[0],
      postnom: capitales.slice(1).join(" ") || null,
      prenom: autres.join(" "),
    };
  }
  if (mots.length === 1) return { nom: mots[0].toUpperCase(), postnom: null, prenom: null };
  if (mots.length === 2) return { nom: mots[0].toUpperCase(), postnom: null, prenom: mots[1] };
  return {
    nom: mots[0].toUpperCase(),
    postnom: mots.slice(1, -1).join(" ").toUpperCase(),
    prenom: mots[mots.length - 1],
  };
}

function versSexe(v: string): "F" | "M" | null {
  const t = sansAccents(v).trim();
  if (["f", "feminin", "femme"].includes(t)) return "F";
  if (["m", "h", "masculin", "homme"].includes(t)) return "M";
  return null;
}

/** Analyse le contenu CSV d'un registre et signale les lignes à corriger. */
export function lireRegistre(contenu: string): LigneRegistre[] {
  const lignes = contenu
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lignes.length < 2) return [];
  const sep = separateur(lignes[0]);
  const entetes = decouper(lignes[0], sep).map(sansAccents);
  const col = (...motsCles: string[]) =>
    entetes.findIndex((e) => motsCles.some((m) => e.includes(m)));
  const iNom = col("nom");
  const iSexe = col("sexe", "genre");
  const iMatricule = col("matricule");
  const iEmail = col("email", "mail", "courriel");
  if (iNom < 0 || iMatricule < 0) return [];

  const vus = new Set<string>();
  return lignes.slice(1).map((brute, k) => {
    const c = decouper(brute, sep);
    const { nom, postnom, prenom } = separerNomComplet(c[iNom] ?? "");
    const matricule = normaliserMatricule(c[iMatricule] ?? "");
    const email = iEmail >= 0 && c[iEmail] ? c[iEmail].trim().toLowerCase() : null;
    const ligne: LigneRegistre = {
      ligne: k + 2,
      nom,
      postnom,
      prenom,
      sexe: iSexe >= 0 ? versSexe(c[iSexe] ?? "") : null,
      matricule,
      email,
    };
    if (!nom) ligne.erreur = "Nom manquant";
    else if (!matricule) ligne.erreur = "Matricule manquant";
    else if (!/^[A-Z0-9/._-]{3,30}$/.test(matricule)) ligne.erreur = "Matricule invalide";
    else if (vus.has(matricule)) ligne.erreur = "Matricule en double dans le fichier";
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ligne.erreur = "Email invalide";
    vus.add(matricule);
    return ligne;
  });
}
