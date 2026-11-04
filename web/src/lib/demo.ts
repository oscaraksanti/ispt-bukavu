/**
 * Mode démonstration : instance séparée de la production (autre base,
 * autre adresse), peuplée de données fictives et réinitialisée chaque nuit.
 * Activé uniquement par NEXT_PUBLIC_MODE_DEMO=1 ; jamais en production.
 */
export const MODE_DEMO = process.env.NEXT_PUBLIC_MODE_DEMO === "1";

/** Mot de passe commun des comptes de démonstration (public par nature). */
export const MOT_DE_PASSE_DEMO = "Demo-ISPT-2026";

export const COMPTES_DEMO: { profil: string; identifiant: string }[] = [
  { profil: "Direction générale", identifiant: "demo.direction@example.org" },
  { profil: "Secrétariat académique", identifiant: "demo.academique@example.org" },
  { profil: "Appariteur", identifiant: "demo.appariteur@example.org" },
  { profil: "Caisse", identifiant: "demo.caisse@example.org" },
  { profil: "Enseignant", identifiant: "demo.enseignant@example.org" },
  { profil: "Étudiant", identifiant: "DEMO0001" },
  { profil: "Candidat", identifiant: "demo.candidat@example.org" },
];
