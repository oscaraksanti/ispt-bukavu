import "server-only";
import type { UtilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { etudiantsInscrits } from "@/features/notifications/emettre";
import type { Auteur, Contexte } from "./regles";

/** Inscriptions de l'année courante d'un étudiant : filières, promotions, cours. */
export async function contexteEtudiant(utilisateurId: string): Promise<Contexte> {
  const inscriptions = await db.inscription.findMany({
    where: {
      etudiant: { utilisateurId },
      statut: { in: ["EN_ATTENTE", "EN_REGLE"] },
      promotion: { annee: { courante: true } },
    },
    include: { promotion: { include: { cours: { select: { id: true } } } } },
  });
  return {
    filieres: [...new Set(inscriptions.map((i) => i.promotion.filiereId))],
    promotions: inscriptions.map((i) => i.promotionId),
    coursOfferts: inscriptions.flatMap((i) => i.promotion.cours.map((c) => c.id)),
  };
}

/** Condition Prisma : communiqués en ligne qui concernent ce contexte. */
export function filtreEnLigne(ctx: Contexte | null): Prisma.CommuniqueWhereInput {
  const maintenant = new Date();
  return {
    statut: "PUBLIE",
    publieLe: { lte: maintenant },
    OR: [{ expireLe: null }, { expireLe: { gt: maintenant } }],
    AND: [
      ctx
        ? {
            OR: [
              { cible: { in: ["PUBLIC", "INSTITUT"] } },
              { cible: "FILIERE", filiereId: { in: ctx.filieres } },
              { cible: "PROMOTION", promotionId: { in: ctx.promotions } },
              { cible: "COURS", coursOffertId: { in: ctx.coursOfferts } },
            ],
          }
        : { cible: "PUBLIC" },
    ],
  };
}

export async function auteurValve(u: UtilisateurConnecte): Promise<Auteur> {
  const affectations = await db.coursEnseignant.findMany({
    where: {
      enseignant: { utilisateurId: u.id },
      coursOffert: { promotion: { annee: { courante: true } } },
    },
    select: { coursOffertId: true },
  });
  return { permissions: u.permissions, coursOfferts: affectations.map((a) => a.coursOffertId) };
}

/** Nombre d'étudiants visés par un communiqué (inscriptions de l'année courante). */
export async function nombreDestinataires(c: {
  cible: string;
  filiereId: string | null;
  promotionId: string | null;
  coursOffertId: string | null;
}) {
  const base: Prisma.InscriptionWhereInput = {
    statut: { in: ["EN_ATTENTE", "EN_REGLE"] },
    promotion: { annee: { courante: true } },
  };
  switch (c.cible) {
    case "PUBLIC":
    case "INSTITUT":
      return db.inscription.count({ where: base });
    case "FILIERE":
      return db.inscription.count({
        where: { ...base, promotion: { annee: { courante: true }, filiereId: c.filiereId ?? "" } },
      });
    case "PROMOTION":
      return db.inscription.count({ where: { ...base, promotionId: c.promotionId ?? "" } });
    case "COURS": {
      const co = await db.coursOffert.findUnique({ where: { id: c.coursOffertId ?? "" } });
      return co ? db.inscription.count({ where: { ...base, promotionId: co.promotionId } }) : 0;
    }
    default:
      return 0;
  }
}

/** Comptes des étudiants visés par un communiqué (pour les notifier). */
export async function comptesDestinataires(c: {
  cible: string;
  filiereId: string | null;
  promotionId: string | null;
  coursOffertId: string | null;
}) {
  switch (c.cible) {
    case "PUBLIC":
    case "INSTITUT":
      return etudiantsInscrits();
    case "FILIERE":
      return c.filiereId ? etudiantsInscrits({ filiereId: c.filiereId }) : [];
    case "PROMOTION":
      return c.promotionId ? etudiantsInscrits({ id: c.promotionId }) : [];
    case "COURS": {
      const co = await db.coursOffert.findUnique({ where: { id: c.coursOffertId ?? "" } });
      return co ? etudiantsInscrits({ id: co.promotionId }) : [];
    }
    default:
      return [];
  }
}

/** Libellé lisible du public visé. */
export function libelleDestinataires(c: {
  cible: string;
  filiere?: { nom: string } | null;
  promotion?: { niveau: { code: string }; filiere: { nomCourt: string } } | null;
  coursOffert?: {
    cours: { intitule: string };
    promotion: { niveau: { code: string }; filiere: { nomCourt: string } };
  } | null;
}) {
  switch (c.cible) {
    case "PUBLIC":
      return "Public";
    case "INSTITUT":
      return "Tout l'institut";
    case "FILIERE":
      return c.filiere?.nom ?? "Filière";
    case "PROMOTION":
      return c.promotion
        ? `${c.promotion.niveau.code} ${c.promotion.filiere.nomCourt}`
        : "Promotion";
    case "COURS":
      return c.coursOffert
        ? `${c.coursOffert.cours.intitule} · ${c.coursOffert.promotion.niveau.code} ${c.coursOffert.promotion.filiere.nomCourt}`
        : "Cours";
    default:
      return "";
  }
}

export const INCLURE_CIBLE = {
  filiere: true,
  promotion: { include: { niveau: true, filiere: true } },
  coursOffert: {
    include: { cours: true, promotion: { include: { niveau: true, filiere: true } } },
  },
} as const;
