import "server-only";
import { redirect } from "next/navigation";
import { exigerConnexion } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Exige un compte étudiant ; renvoie le profil et les inscriptions de l'année courante. */
export async function exigerEtudiant() {
  const u = await exigerConnexion("/etudiant");
  const profil = u.roles.includes("etudiant")
    ? await db.profilEtudiant.findUnique({
        where: { utilisateurId: u.id },
        include: {
          inscriptions: {
            where: { promotion: { annee: { courante: true } } },
            include: { promotion: { include: { filiere: true, niveau: true, annee: true } } },
          },
        },
      })
    : null;
  if (!profil) redirect(u.estPersonnel ? "/admin" : "/acces-refuse");
  return { u, profil };
}

/** Exige un compte enseignant avec son profil. */
export async function exigerEnseignant() {
  const u = await exigerConnexion("/enseignant");
  const profil = u.roles.includes("enseignant")
    ? await db.profilEnseignant.findUnique({ where: { utilisateurId: u.id } })
    : null;
  if (!profil) redirect(u.estPersonnel ? "/admin" : "/acces-refuse");
  return { u, profil };
}
