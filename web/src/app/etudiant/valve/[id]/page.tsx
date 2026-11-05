import type { Metadata } from "next";
import { LienRetour } from "@/components/ui/elements";
import { MessageCircleQuestion } from "lucide-react";
import { notFound } from "next/navigation";
import { AccuseLecture } from "@/components/valve/accuse-lecture";
import { Communique } from "@/components/valve/communique";
import { exigerEtudiant } from "@/features/espaces/acces";
import { poserQuestion } from "@/features/messagerie/actions";
import { contexteEtudiant, filtreEnLigne } from "@/features/valve/donnees";
import { INCLURE_AFFICHAGE, versAffiche } from "@/features/valve/requetes";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Communiqué" };

export default async function CommuniqueEtudiant({
  params,
  searchParams,
}: PageProps<"/etudiant/valve/[id]">) {
  const { u } = await exigerEtudiant();
  const [{ id }, { question }] = await Promise.all([params, searchParams]);
  const c = await db.communique.findFirst({
    where: { id, ...filtreEnLigne(await contexteEtudiant(u.id)) },
    include: INCLURE_AFFICHAGE,
  });
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <LienRetour href="/etudiant/valve">Valve</LienRetour>
      <div className="mt-6 rounded-md border border-pierre-200 bg-white p-6 sm:p-10">
        <Communique c={versAffiche(c)} />
      </div>
      <AccuseLecture communiqueId={c.id} />
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md border border-pierre-200 bg-white px-5 py-4">
        <MessageCircleQuestion aria-hidden className="size-5 shrink-0 text-ispt-600" />
        <p className="min-w-0 flex-1 text-sm text-pierre-700">
          Une question sur ce communiqué ? Écrivez directement à son auteur.
        </p>
        <form action={poserQuestion.bind(null, c.id)}>
          <button
            type="submit"
            className="h-10 rounded-xs border border-pierre-300 px-4 text-sm font-medium text-encre hover:border-encre"
          >
            Poser une question
          </button>
        </form>
        {question === "impossible" && (
          <p role="alert" className="w-full text-detail text-erreur">
            L&apos;auteur de ce communiqué ne reçoit pas de messages : adressez-vous au secrétariat
            de votre section.
          </p>
        )}
      </div>
    </div>
  );
}
