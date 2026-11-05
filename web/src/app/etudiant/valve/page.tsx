import type { Metadata } from "next";
import { ListeCommuniques } from "@/components/valve/liste-communiques";
import { exigerEtudiant } from "@/features/espaces/acces";
import { valveEtudiant } from "@/features/espaces/valve-etudiant";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Valve" };

export default async function ValveEtudiant() {
  const { u } = await exigerEtudiant();
  const communiques = await valveEtudiant(u.id);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-titre-page leading-tight">Valve</h1>
      <p className="mt-2 text-pierre-600">
        Communiqués de l&apos;institut, de votre filière, de votre promotion et de vos cours.
      </p>
      <div className="mt-8">
        <ListeCommuniques
          communiques={communiques}
          base="/etudiant/valve"
          vide="Aucun communiqué pour le moment."
        />
      </div>
    </div>
  );
}
