import type { Metadata } from "next";
import Link from "next/link";
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
      <Link href="/enseignant/valve" className="text-sm text-ispt-600 underline hover:no-underline">
        ← Mes communiqués
      </Link>
      <div className="mt-6">
        <GestionCommunique id={id} u={u} retour="enseignant" enregistre={enregistre === "1"} />
      </div>
    </div>
  );
}
