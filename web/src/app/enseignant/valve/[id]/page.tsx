import type { Metadata } from "next";
import { LienRetour } from "@/components/ui/elements";
import { GestionCommunique } from "@/components/valve/gestion-communique";
import { exigerEnseignant } from "@/features/espaces/acces";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Communiqué" };

export default async function CommuniqueEnseignant({
  params,
  searchParams,
}: PageProps<"/enseignant/valve/[id]">) {
  const { u } = await exigerEnseignant();
  const { id } = await params;
  const { enregistre } = await searchParams;
  return (
    <div>
      <LienRetour href="/enseignant/valve">Mes communiqués</LienRetour>
      <div className="mt-6">
        <GestionCommunique id={id} u={u} retour="enseignant" enregistre={enregistre === "1"} />
      </div>
    </div>
  );
}
