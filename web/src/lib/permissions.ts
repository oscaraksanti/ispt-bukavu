/**
 * Catalogue des permissions et rôles par défaut.
 * Les rôles sont ensuite modifiables dans l'administration ; ce fichier sert
 * de référence pour l'initialisation et pour les contrôles dans le code.
 */

export const PERMISSIONS = {
  // Contenus du site
  "contenu.modifier": { libelle: "Modifier les pages et réglages du site", domaine: "Contenus" },
  "actualites.gerer": { libelle: "Publier les actualités et événements", domaine: "Contenus" },
  "medias.gerer": { libelle: "Gérer la médiathèque", domaine: "Contenus" },
  // Valve
  "valve.publier": { libelle: "Publier des communiqués pour son périmètre", domaine: "Valve" },
  "valve.publier.institut": { libelle: "Publier des communiqués pour tout l'institut", domaine: "Valve" },
  "valve.valider": { libelle: "Valider les communiqués", domaine: "Valve" },
  // Admissions
  "admissions.consulter": { libelle: "Consulter les candidatures", domaine: "Admissions" },
  "admissions.decider": { libelle: "Instruire et décider des candidatures", domaine: "Admissions" },
  "admissions.campagnes": { libelle: "Configurer les campagnes d'admission", domaine: "Admissions" },
  // Académique
  "academique.structure": { libelle: "Gérer filières, années, promotions et cours", domaine: "Académique" },
  "academique.horaires": { libelle: "Construire et publier les horaires", domaine: "Académique" },
  "academique.notes.valider": { libelle: "Valider et publier les notes", domaine: "Académique" },
  "etudiants.gerer": { libelle: "Gérer les étudiants et inscriptions", domaine: "Académique" },
  "documents.emettre": { libelle: "Émettre les documents officiels", domaine: "Académique" },
  "stages.gerer": { libelle: "Gérer les stages", domaine: "Académique" },
  // Finances
  "finances.consulter": { libelle: "Consulter la situation financière", domaine: "Finances" },
  "finances.encaisser": { libelle: "Enregistrer les paiements", domaine: "Finances" },
  // Administration
  "utilisateurs.gerer": { libelle: "Gérer les comptes", domaine: "Administration" },
  "roles.gerer": { libelle: "Gérer les rôles et permissions", domaine: "Administration" },
  "journal.consulter": { libelle: "Consulter le journal d'activité", domaine: "Administration" },
  "pilotage.consulter": { libelle: "Consulter le tableau de bord de pilotage", domaine: "Administration" },
} as const;

export type CodePermission = keyof typeof PERMISSIONS;

const toutes = Object.keys(PERMISSIONS) as CodePermission[];

export const ROLES_PAR_DEFAUT: {
  code: string;
  libelle: string;
  description: string;
  permissions: CodePermission[];
}[] = [
  {
    code: "super_admin",
    libelle: "Administrateur technique",
    description: "Accès complet, y compris les rôles et permissions.",
    permissions: toutes,
  },
  {
    code: "direction",
    libelle: "Direction générale",
    description: "Pilotage, validation et lecture globale.",
    permissions: [
      "pilotage.consulter",
      "journal.consulter",
      "valve.publier",
      "valve.publier.institut",
      "valve.valider",
      "admissions.consulter",
      "finances.consulter",
      "documents.emettre",
    ],
  },
  {
    code: "secretariat_academique",
    libelle: "Secrétariat général académique",
    description: "Structure académique, notes, documents officiels.",
    permissions: [
      "academique.structure",
      "academique.horaires",
      "academique.notes.valider",
      "etudiants.gerer",
      "documents.emettre",
      "stages.gerer",
      "valve.publier",
      "valve.publier.institut",
      "valve.valider",
      "admissions.consulter",
    ],
  },
  {
    code: "secretariat_administratif",
    libelle: "Secrétariat général administratif",
    description: "Comptes du personnel et réglages institutionnels.",
    permissions: ["utilisateurs.gerer", "contenu.modifier", "journal.consulter", "finances.consulter"],
  },
  {
    code: "section",
    libelle: "Appariteur / secrétariat de section",
    description: "Admissions, inscriptions, horaires et communiqués de section.",
    permissions: [
      "admissions.consulter",
      "admissions.decider",
      "etudiants.gerer",
      "academique.horaires",
      "stages.gerer",
      "valve.publier",
    ],
  },
  {
    code: "caisse",
    libelle: "Caisse",
    description: "Encaissements et situation financière.",
    permissions: ["finances.consulter", "finances.encaisser"],
  },
  {
    code: "communication",
    libelle: "Communication",
    description: "Contenus du site, actualités, galerie et médias.",
    permissions: ["contenu.modifier", "actualites.gerer", "medias.gerer"],
  },
  {
    code: "support",
    libelle: "Support technique",
    description: "Comptes utilisateurs et assistance.",
    permissions: ["utilisateurs.gerer"],
  },
  {
    code: "enseignant",
    libelle: "Enseignant",
    description: "Cours, supports, notes et communiqués de ses cours.",
    permissions: ["valve.publier"],
  },
  { code: "etudiant", libelle: "Étudiant", description: "Espace étudiant.", permissions: [] },
  { code: "candidat", libelle: "Candidat", description: "Espace candidat.", permissions: [] },
];

/** Rôles donnant accès à l'administration. */
export const ROLES_PERSONNEL = [
  "super_admin",
  "direction",
  "secretariat_academique",
  "secretariat_administratif",
  "section",
  "caisse",
  "communication",
  "support",
];
