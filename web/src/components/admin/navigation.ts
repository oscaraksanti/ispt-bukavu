import type { CodePermission } from "@/lib/permissions";

export type EntreeNavigation = {
  libelle: string;
  href: string;
  icone: string;
  permission?: CodePermission;
};

export type GroupeNavigation = { titre: string; entrees: EntreeNavigation[] };

export const NAVIGATION_ADMIN: GroupeNavigation[] = [
  {
    titre: "Général",
    entrees: [
      { libelle: "Tableau de bord", href: "/admin", icone: "LayoutDashboard" },
      { libelle: "Mise en service", href: "/admin/demarrage", icone: "ListChecks" },
      {
        libelle: "Pilotage",
        href: "/admin/pilotage",
        icone: "ChartColumn",
        permission: "pilotage.consulter",
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
      },
      {
        libelle: "Filières",
        href: "/admin/site/filieres",
        icone: "GraduationCap",
        permission: "contenu.modifier",
      },
      {
        libelle: "Autorités",
        href: "/admin/site/autorites",
        icone: "Landmark",
        permission: "contenu.modifier",
      },
      {
        libelle: "Partenaires",
        href: "/admin/site/partenaires",
        icone: "Handshake",
        permission: "contenu.modifier",
      },
      {
        libelle: "Questions fréquentes",
        href: "/admin/site/faq",
        icone: "CircleHelp",
        permission: "contenu.modifier",
      },
      {
        libelle: "Médiathèque",
        href: "/admin/medias",
        icone: "Images",
        permission: "medias.gerer",
      },
      {
        libelle: "Galerie",
        href: "/admin/galerie",
        icone: "Camera",
        permission: "medias.gerer",
      },
      {
        libelle: "Anciens",
        href: "/admin/anciens",
        icone: "UsersRound",
        permission: "contenu.modifier",
      },
      {
        libelle: "Identité et contacts",
        href: "/admin/site/reglages",
        icone: "Settings2",
        permission: "contenu.modifier",
      },
    ],
  },
  {
    titre: "Académique",
    entrees: [
      {
        libelle: "Années et promotions",
        href: "/admin/academique",
        icone: "CalendarCog",
        permission: "academique.structure",
      },
      {
        libelle: "Programme des cours",
        href: "/admin/academique/programme",
        icone: "BookOpen",
        permission: "academique.structure",
      },
      {
        libelle: "Horaires",
        href: "/admin/horaires",
        icone: "CalendarClock",
        permission: "academique.horaires",
      },
      {
        libelle: "Examens",
        href: "/admin/examens",
        icone: "CalendarCheck",
        permission: "academique.horaires",
      },
      {
        libelle: "Notes",
        href: "/admin/notes",
        icone: "ClipboardCheck",
        permission: "academique.notes.valider",
      },
      {
        libelle: "Délibérations",
        href: "/admin/deliberations",
        icone: "Scale",
        permission: "academique.notes.valider",
      },
      {
        libelle: "Documents officiels",
        href: "/admin/documents",
        icone: "FileBadge",
        permission: "documents.emettre",
      },
      {
        libelle: "Stages",
        href: "/admin/stages",
        icone: "Briefcase",
        permission: "stages.gerer",
      },
      {
        libelle: "Offres d'insertion",
        href: "/admin/offres",
        icone: "BriefcaseBusiness",
        permission: "stages.gerer",
      },
      {
        libelle: "Étudiants",
        href: "/admin/etudiants",
        icone: "Users",
        permission: "etudiants.gerer",
      },
      {
        libelle: "Enseignants",
        href: "/admin/enseignants",
        icone: "Presentation",
        permission: "academique.structure",
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
    titre: "Communication",
    entrees: [
      {
        libelle: "Valve",
        href: "/admin/valve",
        icone: "Megaphone",
        permission: "valve.publier",
      },
      {
        libelle: "Actualités",
        href: "/admin/actualites",
        icone: "Newspaper",
        permission: "actualites.gerer",
      },
      {
        libelle: "Agenda",
        href: "/admin/agenda",
        icone: "CalendarDays",
        permission: "actualites.gerer",
      },
      {
        libelle: "Messages reçus",
        href: "/admin/messages",
        icone: "Inbox",
        permission: "contenu.modifier",
      },
    ],
  },
  {
    titre: "Personnes",
    entrees: [
      {
        libelle: "Comptes",
        href: "/admin/utilisateurs",
        icone: "Users",
        permission: "utilisateurs.gerer",
      },
      {
        libelle: "Rôles et permissions",
        href: "/admin/roles",
        icone: "ShieldCheck",
        permission: "roles.gerer",
      },
    ],
  },
  {
    titre: "Système",
    entrees: [
      {
        libelle: "Journal d'activité",
        href: "/admin/journal",
        icone: "History",
        permission: "journal.consulter",
      },
    ],
  },
];
