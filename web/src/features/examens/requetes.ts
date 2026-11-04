import "server-only";
import { libellePromotion } from "@/features/academique/regles";
import { db } from "@/lib/db";
import type { EpreuvePlanifiee } from "./regles";

const nomComplet = (u: { prenom: string | null; nom: string; postnom: string | null }) =>
  [u.prenom, u.nom, u.postnom].filter(Boolean).join(" ");

const inclureEpreuve = {
  coursOffert: {
    include: {
      cours: true,
      promotion: { include: { niveau: true, filiere: true } },
      enseignants: { include: { enseignant: { include: { utilisateur: true } } } },
    },
  },
  surveillants: { include: { enseignant: { include: { utilisateur: true } } } },
} as const;

/** Épreuves d'une session, dans la forme attendue par le contrôle des conflits. */
export async function planningDeLaSession(sessionId: string): Promise<EpreuvePlanifiee[]> {
  const epreuves = await db.epreuve.findMany({
    where: { sessionId },
    include: inclureEpreuve,
    orderBy: { debut: "asc" },
  });
  return epreuves.map((e) => ({
    id: e.id,
    libelle: e.coursOffert.cours.intitule,
    promotionId: e.coursOffert.promotionId,
    promotion: libellePromotion(e.coursOffert.promotion),
    debut: e.debut,
    fin: e.fin,
    salle: e.salle,
    surveillants: e.surveillants.map((s) => ({
      id: s.enseignantId,
      nom: nomComplet(s.enseignant.utilisateur),
    })),
  }));
}

/** Session complète pour l'administration. */
export async function sessionDetaillee(id: string) {
  return db.sessionExamen.findUnique({
    where: { id },
    include: {
      annee: true,
      epreuves: { include: inclureEpreuve, orderBy: { debut: "asc" } },
    },
  });
}

export type EpreuveDetaillee = NonNullable<
  Awaited<ReturnType<typeof sessionDetaillee>>
>["epreuves"][number];

/** Épreuves publiées des promotions d'un étudiant. */
export async function epreuvesDeLEtudiant(promotionIds: string[]) {
  return db.epreuve.findMany({
    where: {
      coursOffert: { promotionId: { in: promotionIds } },
      session: { statut: "PUBLIEE" },
    },
    include: { ...inclureEpreuve, session: true },
    orderBy: { debut: "asc" },
  });
}

/** Épreuves publiées qu'un enseignant donne ou surveille. */
export async function epreuvesDeLEnseignant(enseignantId: string) {
  return db.epreuve.findMany({
    where: {
      session: { statut: "PUBLIEE" },
      OR: [
        { coursOffert: { enseignants: { some: { enseignantId } } } },
        { surveillants: { some: { enseignantId } } },
      ],
    },
    include: { ...inclureEpreuve, session: true },
    orderBy: { debut: "asc" },
  });
}

export { nomComplet };
