/**
 * Navigation publique. Un lien n'est affiché que lorsque la page
 * correspondante existe (aucun lien mort en production).
 */

type Lien = { libelle: string; href: string; disponible: boolean };

const principale: Lien[] = [
  { libelle: "L'institut", href: "/institut", disponible: true },
  { libelle: "Formations", href: "/formations", disponible: true },
  { libelle: "Admissions", href: "/admissions", disponible: true },
  { libelle: "Actualités", href: "/actualites", disponible: false },
  { libelle: "Contact", href: "/contact", disponible: true },
];

const utilitaires: Lien[] = [
  { libelle: "Valve", href: "/valve", disponible: false },
  { libelle: "Galerie", href: "/galerie", disponible: false },
  { libelle: "Vérifier un document", href: "/verifier", disponible: false },
];

export const navigationPrincipale = principale.filter((l) => l.disponible);
export const liensUtilitaires = utilitaires.filter((l) => l.disponible);

/** Espaces connectés : activés avec l'authentification. */
export const espacesDisponibles = false;

/** Destination du bouton « Candidater » tant que le dépôt en ligne n'est pas ouvert. */
export const lienCandidature = espacesDisponibles
  ? "/admissions/candidater"
  : "/admissions#dossier";
