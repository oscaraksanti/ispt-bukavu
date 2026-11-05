import type { Metadata } from "next";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { MonCompte } from "@/components/compte/mon-compte";
import { exigerPersonnel } from "@/features/auth/acces";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Mon compte" };

export default async function PageMonCompte() {
  const u = await exigerPersonnel();
  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Mon compte" }]}
        titre="Mon compte"
        description="Votre identité, votre mot de passe et les appareils sur lesquels vous êtes connecté."
      />
      <div className="mt-8">
        <MonCompte utilisateurId={u.id} nomComplet={u.nomComplet} />
      </div>
    </>
  );
}
