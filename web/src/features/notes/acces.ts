import "server-only";
import type { UtilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Enseignant affecté au cours, ou secrétariat académique. */
export async function peutGererCours(u: UtilisateurConnecte, coursOffertId: string) {
  if (u.permissions.has("academique.notes.valider")) return true;
  const affectation = await db.coursEnseignant.findFirst({
    where: { coursOffertId, enseignant: { utilisateurId: u.id } },
  });
  return !!affectation;
}

/** Étudiants inscrits (non sortis) dans la promotion du cours, par ordre alphabétique. */
export async function etudiantsDuCours(coursOffertId: string) {
  const co = await db.coursOffert.findUnique({ where: { id: coursOffertId } });
  if (!co) return [];
  const inscriptions = await db.inscription.findMany({
    where: { promotionId: co.promotionId, statut: { notIn: ["ABANDON"] } },
    include: { etudiant: { include: { utilisateur: true } } },
    orderBy: [
      { etudiant: { utilisateur: { nom: "asc" } } },
      { etudiant: { utilisateur: { prenom: "asc" } } },
    ],
  });
  return inscriptions.map((i) => ({
    id: i.etudiant.id,
    utilisateurId: i.etudiant.utilisateurId,
    matricule: i.etudiant.matricule,
    nom: [i.etudiant.utilisateur.nom, i.etudiant.utilisateur.postnom, i.etudiant.utilisateur.prenom]
      .filter(Boolean)
      .join(" "),
  }));
}
