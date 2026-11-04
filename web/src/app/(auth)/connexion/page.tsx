import type { Metadata } from "next";
import { Suspense } from "react";
import { ViderEspacesHorsLigne } from "@/components/pwa/service-worker";
import { FormulaireConnexion } from "./formulaire-connexion";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

async function AvecSuite({
  searchParams,
}: {
  searchParams: PageProps<"/connexion">["searchParams"];
}) {
  const { suite } = await searchParams;
  return <FormulaireConnexion suite={typeof suite === "string" ? suite : undefined} />;
}

export default function PageConnexion({ searchParams }: PageProps<"/connexion">) {
  return (
    <>
      <ViderEspacesHorsLigne />
      <p className="surtitre">Espace sécurisé</p>
      <h1 className="mt-3 text-4xl">Connexion</h1>
      <p className="mt-3 text-pierre-600">
        Personnel, enseignants, étudiants et candidats de l&apos;ISPT-Bukavu.
      </p>
      <div className="mt-8">
        <Suspense fallback={<FormulaireConnexion />}>
          <AvecSuite searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
