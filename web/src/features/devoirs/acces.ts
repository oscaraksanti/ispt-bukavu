import "server-only";
import type { UtilisateurConnecte } from "@/features/auth/acces";
import { peutGererCours } from "@/features/notes/acces";
import { db } from "@/lib/db";

/** Profil de l'étudiant connecté s'il est inscrit (actif) dans la promotion du cours. */
export async function etudiantDuCours(u: UtilisateurConnecte, coursOffertId: string) {
  const co = await db.coursOffert.findUnique({
    where: { id: coursOffertId },
    select: { promotionId: true },
  });
  if (!co) return null;
  const inscription = await db.inscription.findFirst({
    where: {
      promotionId: co.promotionId,
      statut: { notIn: ["ABANDON", "SUSPENDUE"] },
      etudiant: { utilisateurId: u.id },
    },
    select: { etudiantId: true },
  });
  return inscription?.etudiantId ?? null;
}

/** Cours confié à l'enseignant (ou au secrétariat), avec ce qu'il faut pour l'en-tête. */
export async function coursDeLEnseignant(u: UtilisateurConnecte, coursOffertId: string) {
  if (!(await peutGererCours(u, coursOffertId))) return null;
  return db.coursOffert.findUnique({
    where: { id: coursOffertId },
    include: {
      cours: { include: { ue: true } },
      promotion: { include: { filiere: true, niveau: true } },
    },
  });
}
