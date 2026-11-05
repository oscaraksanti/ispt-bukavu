import type { Metadata } from "next";
import { Suspense } from "react";
import { ViderEspacesHorsLigne } from "@/components/pwa/service-worker";
import { COMPTES_DEMO, MODE_DEMO, MOT_DE_PASSE_DEMO } from "@/lib/demo";
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
      <h1 className="mt-3 text-titre-page">Connexion</h1>
      <p className="mt-3 text-pierre-600">
        Personnel, enseignants, étudiants et candidats de l&apos;ISPT-Bukavu.
      </p>
      <div className="mt-8">
        <Suspense fallback={<FormulaireConnexion />}>
          <AvecSuite searchParams={searchParams} />
        </Suspense>
      </div>
      {MODE_DEMO && (
        <section
          aria-labelledby="comptes-demo"
          className="mt-8 rounded-md border border-chantier/60 bg-chantier/10 p-4 text-sm"
        >
          <h2 id="comptes-demo" className="font-sans text-sm font-semibold text-encre">
            Comptes de démonstration
          </h2>
          <p className="mt-1 text-pierre-700">
            Mot de passe commun : <span className="font-mono">{MOT_DE_PASSE_DEMO}</span>
          </p>
          <dl className="mt-3 space-y-2">
            {COMPTES_DEMO.map((c) => (
              <div key={c.identifiant}>
                <dt className="text-xs text-pierre-600">{c.profil}</dt>
                <dd className="font-mono text-detail text-encre">{c.identifiant}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}
