import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireMotDePasse } from "./formulaire";

export const metadata: Metadata = { title: "Choisir un mot de passe", robots: { index: false } };

async function Contenu({ params }: { params: PageProps<"/reinitialiser/[jeton]">["params"] }) {
  const { jeton } = await params;
  return <FormulaireMotDePasse jeton={jeton} />;
}

export default function PageReinitialiser({ params }: PageProps<"/reinitialiser/[jeton]">) {
  return (
    <>
      <p className="surtitre">Espace sécurisé</p>
      <h1 className="mt-3 text-4xl">Choisir un mot de passe</h1>
      <p className="mt-3 text-pierre-600">
        Ce lien est personnel et ne peut servir qu&apos;une fois.
      </p>
      <div className="mt-8">
        <Suspense>
          <Contenu params={params} />
        </Suspense>
      </div>
    </>
  );
}
