import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { lienSur, type TypeNotification } from "./regles";

type Contenu = { type: TypeNotification; titre: string; message: string; lien?: string };

/**
 * Crée une notification pour chaque destinataire. Ne lève jamais d'erreur :
 * une notification manquée ne doit pas faire échouer l'action qui l'émet
 * (publication de notes, enregistrement d'un paiement…).
 */
export async function notifier(utilisateurIds: Iterable<string>, c: Contenu) {
  const ids = [...new Set(utilisateurIds)].filter(Boolean);
  if (!ids.length) return 0;
  const donnees = {
    type: c.type,
    titre: c.titre.slice(0, 160),
    message: c.message.slice(0, 500),
    lien: lienSur(c.lien),
  };
  try {
    for (let i = 0; i < ids.length; i += 1000)
      await db.notification.createMany({
        data: ids.slice(i, i + 1000).map((utilisateurId) => ({ ...donnees, utilisateurId })),
      });
    return ids.length;
  } catch (e) {
    console.error("[notifications] émission impossible", e);
    return 0;
  }
}

/** Utilisateurs actifs du personnel qui détiennent une permission. */
export async function personnelAvecPermission(permission: string) {
  const r = await db.utilisateur.findMany({
    where: {
      statut: "ACTIF",
      roles: { some: { role: { permissions: { some: { permissionCode: permission } } } } },
    },
    select: { id: true },
  });
  return r.map((u) => u.id);
}

/** Comptes des étudiants inscrits cette année qui correspondent à une condition. */
export async function etudiantsInscrits(promotion: Prisma.PromotionWhereInput = {}) {
  const r = await db.inscription.findMany({
    where: {
      statut: { in: ["EN_ATTENTE", "EN_REGLE"] },
      promotion: { annee: { courante: true }, ...promotion },
      etudiant: { utilisateur: { statut: "ACTIF" } },
    },
    select: { etudiant: { select: { utilisateurId: true } } },
  });
  return r.map((i) => i.etudiant.utilisateurId);
}

/** Compte utilisateur d'un étudiant (profil). */
export async function compteEtudiant(etudiantId: string) {
  const p = await db.profilEtudiant.findUnique({
    where: { id: etudiantId },
    select: { utilisateurId: true },
  });
  return p ? [p.utilisateurId] : [];
}
