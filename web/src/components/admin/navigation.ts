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
