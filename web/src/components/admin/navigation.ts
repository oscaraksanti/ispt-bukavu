import type { CodePermission } from "@/lib/permissions";

/**
 * Icônes de la navigation : une icône par concept, la même partout (barre latérale,
 * notifications, tableaux de bord). Voir la table de docs/design/charte.md.
 */
export type IconeNavigation =
  | "LayoutDashboard"
  | "ListChecks"
  | "ChartColumn"
  | "GraduationCap"
  | "Presentation"
  | "CalendarCog"
  | "BookOpen"
  | "CalendarClock"
  | "CalendarCheck"
  | "ClipboardCheck"
  | "Scale"
  | "FileBadge"
  | "FolderOpen"
  | "CalendarRange"
  | "Wallet"
  | "HardHat"
  | "BriefcaseBusiness"
  | "Award"
  | "Megaphone"
  | "Newspaper"
  | "CalendarDays"
  | "Inbox"
  | "FileText"
  | "Layers"
  | "Landmark"
  | "Handshake"
  | "CircleHelp"
  | "Settings2"
  | "Images"
  | "GalleryHorizontalEnd"
  | "UserCog"
  | "ShieldCheck"
  | "History"
  | "FileSpreadsheet";

export type EntreeNavigation = {
  libelle: string;
  href: string;
  icone: IconeNavigation;
  /** Permission exigée ; avec une liste, l'une d'elles suffit. */
  permission?: CodePermission | CodePermission[];
  /** Mots supplémentaires pour la recherche rapide (⌘K). */
  motsCles?: string;
};

export type GroupeNavigation = { titre: string; entrees: EntreeNavigation[] };

/**
 * Ordre des groupes : le quotidien de la scolarité d'abord, la vitrine et le
 * système ensuite.
 */
export const NAVIGATION_ADMIN: GroupeNavigation[] = [
  {
    titre: "Général",
    entrees: [
      { libelle: "Tableau de bord", href: "/admin", icone: "LayoutDashboard", motsCles: "accueil" },
      {
        libelle: "Mise en service",
        href: "/admin/demarrage",
        icone: "ListChecks",
        motsCles: "démarrage étapes",
      },
      {
        libelle: "Pilotage",
        href: "/admin/pilotage",
        icone: "ChartColumn",
        permission: "pilotage.consulter",
        motsCles: "statistiques indicateurs direction",
      },
    ],
  },
  {
    titre: "Scolarité",
    entrees: [
      {
        libelle: "Étudiants",
        href: "/admin/etudiants",
        icone: "GraduationCap",
        permission: "etudiants.gerer",
        motsCles: "registre matricule inscription codes activation",
      },
      {
        libelle: "Enseignants",
        href: "/admin/enseignants",
        icone: "Presentation",
        permission: "academique.structure",
        motsCles: "professeurs",
      },
      {
        libelle: "Années et promotions",
        href: "/admin/academique",
        icone: "CalendarCog",
        permission: "academique.structure",
        motsCles: "année académique bac1 bac2 bac3 bac4",
      },
      {
        libelle: "Programme des cours",
        href: "/admin/academique/programme",
        icone: "BookOpen",
        permission: "academique.structure",
        motsCles: "ue unités enseignement crédits",
      },
    ],
  },
  {
    titre: "Enseignement et évaluation",
    entrees: [
      {
        libelle: "Horaires",
        href: "/admin/horaires",
        icone: "CalendarClock",
        permission: "academique.horaires",
        motsCles: "emploi du temps séances salles",
      },
      {
        libelle: "Examens",
        href: "/admin/examens",
        icone: "CalendarCheck",
        permission: "academique.horaires",
        motsCles: "session épreuves surveillants",
      },
      {
        libelle: "Notes",
        href: "/admin/notes",
        icone: "ClipboardCheck",
        permission: "academique.notes.valider",
        motsCles: "évaluations cotes validation publication",
      },
      {
        libelle: "Délibérations",
        href: "/admin/deliberations",
        icone: "Scale",
        permission: "academique.notes.valider",
        motsCles: "jury proclamation pv bulletins",
      },
      {
        libelle: "Documents officiels",
        href: "/admin/documents",
        icone: "FileBadge",
        permission: "documents.emettre",
        motsCles: "relevé attestation qr",
      },
    ],
  },
  {
    titre: "Admissions",
    entrees: [
      {
        libelle: "Candidatures",
        href: "/admin/admissions",
        icone: "FolderOpen",
        permission: "admissions.consulter",
        motsCles: "dossiers candidats",
      },
      {
        libelle: "Campagnes",
        href: "/admin/admissions/campagnes",
        icone: "CalendarRange",
        permission: "admissions.campagnes",
      },
    ],
  },
  {
    titre: "Finances",
    entrees: [
      {
        libelle: "Frais et paiements",
        href: "/admin/finances",
        icone: "Wallet",
        permission: "finances.consulter",
        motsCles: "caisse reçus barèmes exonérations frais de dossier",
      },
    ],
  },
  {
    titre: "Insertion",
    entrees: [
      {
        libelle: "Stages",
        href: "/admin/stages",
        icone: "HardHat",
        permission: "stages.gerer",
        motsCles: "lieux affectations rapports",
      },
      {
        libelle: "Offres d'insertion",
        href: "/admin/offres",
        icone: "BriefcaseBusiness",
        permission: "stages.gerer",
        motsCles: "emploi bourse formation",
      },
      {
        libelle: "Anciens",
        href: "/admin/anciens",
        icone: "Award",
        permission: "contenu.modifier",
        motsCles: "diplômés annuaire",
      },
    ],
  },
  {
    titre: "Communication",
    entrees: [
      {
        libelle: "Valve",
        href: "/admin/valve",
        icone: "Megaphone",
        permission: "valve.publier",
        motsCles: "communiqués annonces",
      },
      {
        libelle: "Actualités",
        href: "/admin/actualites",
        icone: "Newspaper",
        permission: "actualites.gerer",
        motsCles: "articles nouvelles",
      },
      {
        libelle: "Agenda",
        href: "/admin/agenda",
        icone: "CalendarDays",
        permission: "actualites.gerer",
        motsCles: "événements",
      },
      {
        libelle: "Messages reçus",
        href: "/admin/messages",
        icone: "Inbox",
        permission: "contenu.modifier",
        motsCles: "contact formulaire",
      },
    ],
  },
  {
    titre: "Site public",
    entrees: [
      {
        libelle: "Pages",
        href: "/admin/site/pages",
        icone: "FileText",
        permission: "contenu.modifier",
        motsCles: "accueil contenu textes",
      },
      {
        libelle: "Filières",
        href: "/admin/site/filieres",
        icone: "Layers",
        permission: "contenu.modifier",
        motsCles: "formations",
      },
      {
        libelle: "Autorités",
        href: "/admin/site/autorites",
        icone: "Landmark",
        permission: "contenu.modifier",
        motsCles: "gouvernance directeur",
      },
      {
        libelle: "Partenaires",
        href: "/admin/site/partenaires",
        icone: "Handshake",
        permission: "contenu.modifier",
        motsCles: "employeurs lieux de stage",
      },
      {
        libelle: "Questions fréquentes",
        href: "/admin/site/faq",
        icone: "CircleHelp",
        permission: "contenu.modifier",
        motsCles: "faq",
      },
      {
        libelle: "Médiathèque",
        href: "/admin/medias",
        icone: "Images",
        permission: "medias.gerer",
        motsCles: "photos images fichiers",
      },
      {
        libelle: "Galerie",
        href: "/admin/galerie",
        icone: "GalleryHorizontalEnd",
        permission: "medias.gerer",
        motsCles: "albums",
      },
      {
        libelle: "Identité et contacts",
        href: "/admin/site/reglages",
        icone: "Settings2",
        permission: "contenu.modifier",
        motsCles: "réglages adresse téléphone",
      },
    ],
  },
  {
    titre: "Administration",
    entrees: [
      {
        libelle: "Comptes",
        href: "/admin/utilisateurs",
        icone: "UserCog",
        permission: "utilisateurs.gerer",
        motsCles: "utilisateurs invitations personnel",
      },
      {
        libelle: "Rôles et permissions",
        href: "/admin/roles",
        icone: "ShieldCheck",
        permission: "roles.gerer",
      },
      {
        libelle: "Exports",
        href: "/admin/exports",
        icone: "FileSpreadsheet",
        permission: ["etudiants.gerer", "academique.notes.valider"],
        motsCles: "excel csv tableur optsolution ministère effectifs inscriptions",
      },
      {
        libelle: "Journal d'activité",
        href: "/admin/journal",
        icone: "History",
        permission: "journal.consulter",
        motsCles: "audit traces",
      },
    ],
  },
];

/** L'utilisateur peut-il voir cette entrée ? */
export function entreeAccessible(e: EntreeNavigation, permissions: Set<string>) {
  if (!e.permission) return true;
  const liste = Array.isArray(e.permission) ? e.permission : [e.permission];
  return liste.some((p) => permissions.has(p));
}
