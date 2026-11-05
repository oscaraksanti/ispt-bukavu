import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TransitionPage } from "@/components/public/transition-page";
import { FilAriane, LienFleche } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { formatCodeValide, normaliserCodeDocument } from "@/features/documents/regles";
import { verifierCode } from "@/features/documents/verification";

export const metadata: Metadata = {
  title: "Résultat de la vérification",
  robots: { index: false },
};

export function generateStaticParams() {
  return [{ code: "exemple" }];
}

async function Resultat({ params }: { params: PageProps<"/verifier/[code]">["params"] }) {
  const { code: brut } = await params;
  const code = normaliserCodeDocument(decodeURIComponent(brut));
  const r = formatCodeValide(code) ? await verifierCode(code) : ({ etat: "inconnu" } as const);
  return (
    <div className="conteneur max-w-2xl py-10 lg:py-16">
      <FilAriane
        elements={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Vérifier un document", href: "/verifier" },
          { libelle: code || "—" },
        ]}
      />
      <div className="mt-8 rounded-md border border-pierre-200 bg-white p-6 sm:p-10">
        {r.etat === "valide" && (
          <>
            <h1 className="flex items-center gap-3 font-sans text-2xl font-medium text-succes">
              <CircleCheck aria-hidden className="size-8" /> Document authentique
            </h1>
            <p className="mt-2 text-pierre-700">
              Ce document a bien été délivré par l&apos;institut et il est toujours valable.
            </p>
          </>
        )}
        {r.etat === "revoque" && (
          <>
            <h1 className="flex items-center gap-3 font-sans text-2xl font-medium text-erreur">
              <CircleX aria-hidden className="size-8" /> Document révoqué
            </h1>
            <p className="mt-2 text-pierre-700">
              Délivré par l&apos;institut, ce document a été annulé le{" "}
              {formatJour.format(new Date(r.revoqueLe!))}
              {r.motif ? ` : ${r.motif}` : ""}. Il ne doit plus être accepté.
            </p>
          </>
        )}
        {r.etat === "inconnu" && (
          <>
            <h1 className="flex items-center gap-3 font-sans text-2xl font-medium text-attention">
              <CircleAlert aria-hidden className="size-8" /> Code inconnu
            </h1>
            <p className="mt-2 text-pierre-700">
              Aucun document de l&apos;institut ne correspond au code{" "}
              {code ? <span className="font-mono">{code}</span> : "saisi"}. Vérifiez la saisie ; en
              cas de doute, contactez le secrétariat.
            </p>
          </>
        )}
        {r.etat !== "inconnu" && (
          <dl className="mt-8 divide-y divide-pierre-200 border-y border-pierre-200 text-sm">
            {[
              ["Document", r.type],
              ["Code", code],
              ["Titulaire", r.titulaire.nom],
              ["Matricule", r.titulaire.matricule],
              ["Promotion", r.titulaire.promotion],
              ["Année académique", r.titulaire.annee],
              ...(r.titulaire.periode ? [["Période", r.titulaire.periode]] : []),
              ...(r.titulaire.resultat
                ? [
                    [
                      "Moyenne",
                      r.titulaire.resultat.moyenne === null
                        ? "—"
                        : `${r.titulaire.resultat.moyenne.toLocaleString("fr-FR")}/20`,
                    ],
                    ...(r.titulaire.resultat.mention
                      ? [["Mention", r.titulaire.resultat.mention]]
                      : []),
                    ["Crédits validés", r.titulaire.resultat.credits],
                    ...(r.titulaire.resultat.decision
                      ? [["Décision du jury", r.titulaire.resultat.decision]]
                      : []),
                  ]
                : []),
              ["Délivré le", formatJour.format(new Date(r.emisLe))],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
                <dt className="text-pierre-600">{k}</dt>
                <dd className="text-pierre-900">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-8">
          <LienFleche href="/verifier">Vérifier un autre document</LienFleche>
        </div>
      </div>
    </div>
  );
}

export default function PageVerification({ params }: PageProps<"/verifier/[code]">) {
  return (
    <TransitionPage>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <Resultat params={params} />
      </Suspense>
    </TransitionPage>
  );
}
