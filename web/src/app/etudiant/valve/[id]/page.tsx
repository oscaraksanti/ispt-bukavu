import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccuseLecture } from "@/components/valve/accuse-lecture";
import { Communique } from "@/components/valve/communique";
import { exigerEtudiant } from "@/features/espaces/acces";
import { contexteEtudiant, filtreEnLigne } from "@/features/valve/donnees";
import { INCLURE_AFFICHAGE, versAffiche } from "@/features/valve/requetes";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Communiqué" };

export default async function CommuniqueEtudiant({ params }: PageProps<"/etudiant/valve/[id]">) {
  const { u } = await exigerEtudiant();
  const { id } = await params;
  const c = await db.communique.findFirst({
    where: { id, ...filtreEnLigne(await contexteEtudiant(u.id)) },
    include: INCLURE_AFFICHAGE,
  });
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/etudiant/valve" className="text-sm text-ispt-600 underline hover:no-underline">
        ← Valve
      </Link>
      <div className="mt-6 rounded-md border border-pierre-200 bg-white p-6 sm:p-10">
        <Communique c={versAffiche(c)} />
      </div>
      <AccuseLecture communiqueId={c.id} />
    </div>
  );
}
