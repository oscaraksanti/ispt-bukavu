import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { ajouterJours, situerSeance } from "./regles";

export type SeanceSemaine = {
  id: string;
  jour: string;
  plage: "matin" | "apresMidi";
  cours: string;
  promotion: string;
  salle: string | null;
  statut: "PREVUE" | "REPORTEE" | "ANNULEE";
  remarque: string | null;
  enseignants: string;
};

/** Séances d'une semaine (lundi → samedi, heure de Bukavu) répondant au filtre. */
export async function seancesDeLaSemaine(
  lundi: string,
  filtre: Prisma.CoursOffertWhereInput,
): Promise<SeanceSemaine[]> {
  const lignes = await db.seance.findMany({
    where: {
      debut: {
        gte: new Date(`${lundi}T00:00:00+02:00`),
        lt: new Date(`${ajouterJours(lundi, 7)}T00:00:00+02:00`),
      },
      coursOffert: filtre,
    },
    include: {
      coursOffert: {
        include: {
          cours: true,
          promotion: { include: { niveau: true, filiere: true } },
          enseignants: { include: { enseignant: { include: { utilisateur: true } } } },
        },
      },
    },
    orderBy: { debut: "asc" },
  });
  return lignes.map((s) => ({
    id: s.id,
    ...situerSeance(s.debut),
    cours: s.coursOffert.cours.intitule,
    promotion: `${s.coursOffert.promotion.niveau.code} ${s.coursOffert.promotion.filiere.nomCourt}`,
    salle: s.salle,
    statut: s.statut,
    remarque: s.remarque,
    enseignants: s.coursOffert.enseignants
      .map((e) => [e.enseignant.titre, e.enseignant.utilisateur.nom].filter(Boolean).join(" "))
      .join(", "),
  }));
}
