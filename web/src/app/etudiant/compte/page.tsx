import type { Metadata } from "next";
import { MonCompte } from "@/components/compte/mon-compte";
import { exigerEtudiant } from "@/features/espaces/acces";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Mon compte" };

export default async function PageMonCompte() {
  const { u } = await exigerEtudiant();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-titre-page leading-tight">Mon compte</h1>
      <p className="mt-2 mb-8 text-pierre-600">
        Votre identité, votre mot de passe et les appareils sur lesquels vous êtes connecté.
      </p>
      <MonCompte utilisateurId={u.id} nomComplet={u.nomComplet} />
    </div>
  );
}
