import "server-only";
import { redirect } from "next/navigation";
import { exigerConnexion } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Exige un compte candidat ; le personnel est renvoyé vers l'administration. */
export async function exigerCandidat() {
  const u = await exigerConnexion("/candidat");
  if (!u.roles.includes("candidat")) redirect(u.estPersonnel ? "/admin" : "/");
  return u;
}

/** Dossier le plus récent du candidat, avec tout ce qu'il faut pour l'afficher. */
export async function dossierDuCandidat(candidatId: string) {
  return db.candidature.findFirst({
    where: { candidatId },
    orderBy: { creeLe: "desc" },
    include: {
      campagne: {
        include: {
          annee: true,
          filieres: { where: { ouverte: true }, orderBy: { ordre: "asc" } },
          pieces: { orderBy: { ordre: "asc" } },
        },
      },
      filiere: true,
      pieces: { include: { media: true } },
      historique: { orderBy: { creeLe: "asc" } },
    },
  });
}

export type DossierCandidat = NonNullable<Awaited<ReturnType<typeof dossierDuCandidat>>>;
