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
    entrees: [{ libelle: "Tableau de bord", href: "/admin", icone: "LayoutDashboard" }],
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
        libelle: "Identité et contacts",
        href: "/admin/site/reglages",
        icone: "Settings2",
        permission: "contenu.modifier",
      },
    ],
  },
  {
    titre: "Communication",
    entrees: [
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
