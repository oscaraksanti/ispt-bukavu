import { CalendarDays, Check, CircleDollarSign } from "lucide-react";
import type { Metadata } from "next";
import { EntetePage } from "@/components/public/entete-page";
import { FormulaireInscriptionCandidat } from "@/components/public/formulaire-inscription-candidat";
import { TransitionPage } from "@/components/public/transition-page";
import { LienBouton } from "@/components/ui/bouton";
import { Encadre } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { lireCampagneOuverte, lireInstitut, lirePage } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";

export const metadata: Metadata = {
  title: "Candidater en ligne",
  description:
    "Ouvrez votre dossier de candidature à l'ISPT-Bukavu, déposez vos pièces et suivez la décision en ligne.",
};

const formatMontant = (montant: string, devise: string) =>
  `${Number(montant).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${devise === "USD" ? "$" : "FC"}`;

export default async function Candidater() {
  const [campagne, institut, pageAdmissions] = await Promise.all([
    lireCampagneOuverte(),
    lireInstitut(),
    lirePage("admissions"),
  ]);

  if (!campagne) {
    const pieces = lecteur(pageAdmissions.pieces).liste("liste");
    return (
      <TransitionPage>
        <EntetePage
          ariane={[
            { libelle: "Accueil", href: "/" },
            { libelle: "Admissions", href: "/admissions" },
            { libelle: "Candidater" },
          ]}
          surtitre="Candidater en ligne"
          titre="Les candidatures en ligne ne sont pas ouvertes"
          intro="Le dépôt en ligne ouvre avec chaque campagne d'admission. Préparez dès maintenant les pièces de votre dossier."
        />
        <section className="conteneur grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
          <div className="revele lg:col-span-7">
            <h2 className="text-3xl">Pièces à préparer</h2>
            <ul className="mt-6 divide-y divide-pierre-200 border-y border-pierre-200">
              {pieces.map((p, i) => (
                <li key={i} className="flex items-center gap-4 py-3.5 text-pierre-900">
                  <Check aria-hidden className="size-4 shrink-0 text-ispt-600" />
                  {p.texte("libelle")}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="revele lg:col-span-4 lg:col-start-9"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <Encadre titre="Une question ?">
              Le secrétariat vous renseigne au {institut.telephone}
              {institut.email ? ` ou à ${institut.email}` : ""}.
            </Encadre>
            <div className="mt-6">
              <LienBouton href="/admissions" variante="contour">
                Conditions d&apos;admission
              </LienBouton>
            </div>
          </div>
        </section>
      </TransitionPage>
    );
  }

  return (
    <TransitionPage>
      <EntetePage
        ariane={[
          { libelle: "Accueil", href: "/" },
          { libelle: "Admissions", href: "/admissions" },
          { libelle: "Candidater" },
        ]}
        surtitre={campagne.libelle}
        titre="Ouvrir mon dossier de candidature"
        intro="Créez votre compte, complétez votre dossier et déposez vos pièces depuis un téléphone. Vous pouvez enregistrer et reprendre à tout moment avant le dépôt."
      />
      <section className="conteneur grid gap-14 py-16 lg:grid-cols-12 lg:py-20">
        <aside className="revele space-y-8 lg:col-span-4">
          <dl className="divide-y divide-pierre-200 border-y border-pierre-200">
            <div className="flex gap-4 py-4">
              <CalendarDays aria-hidden className="mt-0.5 size-5 shrink-0 text-ispt-600" />
              <div>
                <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">Dépôt</dt>
                <dd className="mt-1 text-pierre-900">
                  Jusqu&apos;au {formatJour.format(new Date(campagne.cloture))}
                </dd>
              </div>
            </div>
            <div className="flex gap-4 py-4">
              <CircleDollarSign aria-hidden className="mt-0.5 size-5 shrink-0 text-ispt-600" />
              <div>
                <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">
                  Frais d&apos;inscription
                </dt>
                <dd className="mt-1 text-pierre-900">
                  {formatMontant(campagne.frais, campagne.devise)}
                </dd>
              </div>
            </div>
          </dl>
          <div>
            <h2 className="font-sans text-sm font-medium tracking-wide text-pierre-500 uppercase">
              Filières ouvertes
            </h2>
            <ul className="mt-3 space-y-2">
              {campagne.filieres.map((f) => (
                <li key={f.id} className="font-serif text-xl text-encre">
                  {f.nom}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-sans text-sm font-medium tracking-wide text-pierre-500 uppercase">
              Pièces à déposer
            </h2>
            <ul className="mt-3 space-y-2">
              {campagne.pieces.map((p) => (
                <li key={p.id} className="flex items-start gap-3 text-[0.9375rem] text-pierre-800">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-ispt-600" />
                  <span>
                    {p.libelle}
                    {!p.obligatoire && <span className="text-pierre-500"> (facultatif)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div
          className="revele rounded-md border border-pierre-200 bg-white p-6 sm:p-8 lg:col-span-7 lg:col-start-6"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <h2 className="text-3xl">Créer mon compte candidat</h2>
          <p className="mt-2 text-pierre-600">
            Une seule candidature par personne et par campagne.
          </p>
          <div className="mt-8">
            <FormulaireInscriptionCandidat />
          </div>
        </div>
      </section>
    </TransitionPage>
  );
}
