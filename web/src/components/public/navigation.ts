/**
 * Navigation publique. Un lien n'est affiché que lorsque la page
 * correspondante existe (aucun lien mort en production).
 */

type Lien = { libelle: string; href: string; disponible: boolean };

const principale: Lien[] = [
  { libelle: "L'institut", href: "/institut", disponible: true },
  { libelle: "Formations", href: "/formations", disponible: true },
  { libelle: "Admissions", href: "/admissions", disponible: true },
  { libelle: "Actualités", href: "/actualites", disponible: true },
  { libelle: "Contact", href: "/contact", disponible: true },
];

const utilitaires: Lien[] = [
  { libelle: "Valve", href: "/valve", disponible: true },
  { libelle: "Galerie", href: "/galerie", disponible: false },
  { libelle: "Vérifier un document", href: "/verifier", disponible: false },
];

export const navigationPrincipale = principale.filter((l) => l.disponible);
export const liensUtilitaires = utilitaires.filter((l) => l.disponible);

/** Bouton « Connexion » : personnel (et bientôt enseignants, étudiants, candidats). */
export const espacesDisponibles = true;

/**
 * Destination du bouton « Candidater » : la page de candidature indique
 * elle-même si une campagne est ouverte, et sinon comment se préparer.
 */
export const lienCandidature = "/candidater";
