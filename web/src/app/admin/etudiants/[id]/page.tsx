import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireIdentite } from "@/components/admin/formulaire-identite";
import { exigerPermission } from "@/features/auth/acces";
import { corrigerIdentite } from "@/features/comptes/actions";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Étudiant" };

/** Fiche d'un étudiant : correction de son identité par le secrétariat. */
export default async function Etudiant({ params }: PageProps<"/admin/etudiants/[id]">) {
  await exigerPermission("etudiants.gerer");
  const { id } = await params;
  const u = await db.utilisateur.findUnique({
    where: { id },
    include: {
      profilEtudiant: {
        include: {
          inscriptions: {
            orderBy: { creeLe: "desc" },
            take: 1,
            include: { promotion: { include: { filiere: true, niveau: true } } },
          },
        },
      },
      roles: { include: { role: true } },
    },
  });
  // Seuls les comptes purement étudiants se corrigent ici (le personnel : « Comptes »).
  if (!u?.profilEtudiant || u.roles.some((r) => r.role.code !== "etudiant")) notFound();
  const nomComplet = [u.nom, u.postnom, u.prenom].filter(Boolean).join(" ");
  const promotion = u.profilEtudiant.inscriptions[0]?.promotion;
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          {
            libelle: "Étudiants",
            href: promotion ? `/admin/etudiants?promotion=${promotion.id}` : "/admin/etudiants",
          },
          { libelle: nomComplet },
        ]}
        titre={nomComplet}
        description={`Matricule ${u.profilEtudiant.matricule}`}
      />
      <Panneau
        className="mt-8"
        titre="Corriger l'identité"
        description="Pour rectifier un nom, un matricule, une adresse ou un numéro à la demande de l'étudiant."
      >
        <FormulaireIdentite
          action={corrigerIdentite.bind(null, u.id)}
          valeurs={{ ...u, matricule: u.profilEtudiant.matricule, sexe: u.profilEtudiant.sexe }}
          etudiant
        />
      </Panneau>
    </>
  );
}
