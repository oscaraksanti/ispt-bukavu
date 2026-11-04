import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireConfirmation } from "./formulaire";

export const metadata: Metadata = { title: "Confirmer mon adresse", robots: { index: false } };

async function Contenu({ params }: { params: PageProps<"/confirmer-email/[jeton]">["params"] }) {
  const { jeton } = await params;
  return <FormulaireConfirmation jeton={jeton} />;
}

export default function PageConfirmerEmail({ params }: PageProps<"/confirmer-email/[jeton]">) {
  return (
    <>
      <p className="surtitre">Candidature en ligne</p>
      <h1 className="mt-3 text-4xl">Confirmer mon adresse</h1>
      <p className="mt-3 text-pierre-600">
        Une dernière étape : confirmez que cette adresse email est bien la vôtre. Toutes les
        nouvelles de votre dossier y seront envoyées.
      </p>
      <div className="mt-8">
        <Suspense>
          <Contenu params={params} />
        </Suspense>
      </div>
    </>
  );
}
