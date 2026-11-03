import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TransitionPage } from "@/components/public/transition-page";
import { FilAriane } from "@/components/ui/elements";
import { Communique } from "@/components/valve/communique";
import { lireCommuniquePublic, lireValvePublique } from "@/features/valve/publique";

export async function generateStaticParams() {
  const liste = await lireValvePublique();
  return liste.length ? liste.map((c) => ({ id: c.id })) : [{ id: "aucun" }];
}

export async function generateMetadata({ params }: PageProps<"/valve/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = await lireCommuniquePublic(id);
  return c ? { title: c.titre } : { title: "Communiqué introuvable" };
}

async function Contenu({ params }: { params: PageProps<"/valve/[id]">["params"] }) {
  const { id } = await params;
  const c = await lireCommuniquePublic(id);
  if (!c) notFound();
  return (
    <div className="conteneur max-w-3xl py-10 lg:py-16">
      <FilAriane
        elements={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Valve", href: "/valve" },
          { libelle: c.titre },
        ]}
      />
      <div className="mt-8 rounded-md border border-pierre-200 bg-white p-6 sm:p-10">
        <Communique c={c} />
      </div>
    </div>
  );
}

export default function CommuniquePublic({ params }: PageProps<"/valve/[id]">) {
  return (
    <TransitionPage>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Contenu params={params} />
      </Suspense>
    </TransitionPage>
  );
}
