import "server-only";
import type { IconeNavigation } from "@/components/admin/navigation";
import type { CodePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export type Tache = {
  libelle: string;
  nombre: number;
  href: string;
  icone: IconeNavigation;
};

type Definition = {
  permission: CodePermission;
  libelle: string;
  href: string;
  icone: IconeNavigation;
  compter: () => Promise<number>;
};

/**
 * Ce qui attend une action, selon les permissions du compte connecté.
 * Chaque compteur reprend le filtre de la page vers laquelle il mène.
 */
const TACHES: Definition[] = [
  {
    permission: "admissions.consulter",
    libelle: "Dossiers déposés à instruire",
    href: "/admin/admissions?statut=SOUMISE",
    icone: "FolderOpen",
    compter: () => db.candidature.count({ where: { statut: "SOUMISE" } }),
  },
  {
    permission: "finances.encaisser",
    libelle: "Frais de dossier à vérifier",
    href: "/admin/finances#frais-dossier",
    icone: "Wallet",
    compter: () =>
      db.candidature.count({
        where: {
          statut: { notIn: ["BROUILLON", "ABANDONNEE"] },
          referencePaiement: { not: null },
          paiementMotifRefus: null,
          paiementVerifieLe: null,
          campagne: { fraisInscription: { gt: 0 } },
        },
      }),
  },
  {
    permission: "academique.notes.valider",
    libelle: "Évaluations à valider",
    href: "/admin/notes",
    icone: "ClipboardCheck",
    compter: () => db.evaluation.count({ where: { statut: "SOUMISE" } }),
  },
  {
    permission: "valve.valider",
    libelle: "Communiqués à valider",
    href: "/admin/valve",
    icone: "Megaphone",
    compter: () => db.communique.count({ where: { statut: "EN_VALIDATION" } }),
  },
  {
    permission: "documents.emettre",
    libelle: "Demandes de documents",
    href: "/admin/documents",
    icone: "FileBadge",
    compter: () => db.demandeDocument.count({ where: { statut: "EN_ATTENTE" } }),
  },
  {
    permission: "contenu.modifier",
    libelle: "Messages non traités",
    href: "/admin/messages",
    icone: "Inbox",
    compter: () => db.messageContact.count({ where: { traite: false } }),
  },
  {
    permission: "contenu.modifier",
    libelle: "Anciens à vérifier",
    href: "/admin/anciens",
    icone: "Award",
    compter: () => db.ancien.count({ where: { statut: "EN_ATTENTE" } }),
  },
];

export async function tachesEnAttente(permissions: Set<string>): Promise<Tache[]> {
  const visibles = TACHES.filter((t) => permissions.has(t.permission));
  const nombres = await Promise.all(visibles.map((t) => t.compter()));
  return visibles.map(({ libelle, href, icone }, i) => ({
    libelle,
    href,
    icone,
    nombre: nombres[i] ?? 0,
  }));
}
