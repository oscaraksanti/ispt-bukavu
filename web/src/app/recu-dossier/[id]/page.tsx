import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { Blason } from "@/components/marque/blason";
import { formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { formatMontant, MODES_PAIEMENT } from "@/features/finances/regles";
import { db } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = { title: "Reçu des frais de dossier", robots: { index: false } };

async function Recu({ params }: { params: PageProps<"/recu-dossier/[id]">["params"] }) {
  const u = await utilisateurConnecte();
  const { id } = await params;
  if (!u) redirect(`/connexion?suite=/recu-dossier/${id}`);
  const c = await db.candidature.findUnique({
    where: { id },
    include: { campagne: { include: { annee: true } }, filiere: true },
  });
  const autorise =
    c &&
    (c.candidatId === u.id ||
      u.permissions.has("admissions.consulter") ||
      u.permissions.has("finances.consulter"));
  if (!c || !autorise || !c.numeroRecu || !c.paiementVerifieLe) notFound();
  const [institut, caissier] = await Promise.all([
    lireInstitut(),
    c.paiementVerifieParId
      ? db.utilisateur.findUnique({
          where: { id: c.paiementVerifieParId },
          select: { prenom: true, nom: true },
        })
      : null,
  ]);
  const lignes: [string, string][] = [
    ["Reçu de", [c.nom, c.postnom, c.prenom].filter(Boolean).join(" ")],
    ["Dossier de candidature", `n° ${c.numero}`],
    ["Campagne", `${c.campagne.libelle} (${c.campagne.annee.libelle})`],
    ["Filière demandée", c.filiere?.nom ?? "—"],
    ["Objet", "Frais de dossier de candidature"],
    ["Montant", formatMontant(Number(c.montantFrais ?? 0), c.deviseFrais ?? "USD")],
    ["Mode de paiement", c.modePaiement ? MODES_PAIEMENT[c.modePaiement] : "—"],
    ["Référence", c.referencePaiement ?? "—"],
    ["Vérifié le", formatJour.format(c.paiementVerifieLe)],
    ["Vérifié par", caissier ? [caissier.prenom, caissier.nom].filter(Boolean).join(" ") : "—"],
  ];

  return (
    <main className="min-h-svh bg-pierre-100 py-10 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-2xl justify-end px-4 print:hidden">
        <BoutonImprimer libelle="Imprimer le reçu" />
      </div>
      <article className="mx-auto max-w-2xl border border-pierre-300 bg-white p-8 sm:p-12 print:border-0">
        <header className="flex items-center gap-5 border-b border-pierre-300 pb-6">
          <Blason hauteur={72} decoratif />
          <div>
            <p className="font-serif text-xl text-encre">{institut.nom}</p>
            <p className="text-sm text-pierre-600">
              {institut.rue}, {institut.ville} · {institut.boitePostale}
            </p>
          </div>
        </header>
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-3xl">Reçu des frais de dossier</h1>
          <p className="font-mono text-lg text-encre">N° {c.numeroRecu}</p>
        </div>
        <dl className="mt-8 divide-y divide-pierre-200 border-y border-pierre-200">
          {lignes.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[11rem_1fr] gap-4 py-2.5 text-sm">
              <dt className="text-pierre-600">{k}</dt>
              <dd className="text-pierre-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-xs leading-relaxed text-pierre-600">
          Reçu émis par la plateforme de l&apos;{institut.sigle} après vérification du paiement par
          la caisse. Il ne vaut pas décision d&apos;admission. Conservez également le bordereau de
          la banque ou de l&apos;opérateur.
        </p>
      </article>
    </main>
  );
}

export default function PageRecuDossier({ params }: PageProps<"/recu-dossier/[id]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Recu params={params} />
    </Suspense>
  );
}
