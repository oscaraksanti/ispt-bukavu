import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { Blason } from "@/components/marque/blason";
import { libellePromotion } from "@/features/academique/regles";
import { formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { formatMontant, MODES_PAIEMENT } from "@/features/finances/regles";
import { db } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = { title: "Reçu de paiement", robots: { index: false } };

async function Recu({ params }: { params: PageProps<"/recu/[id]">["params"] }) {
  const u = await utilisateurConnecte();
  const { id } = await params;
  if (!u) redirect(`/connexion?suite=/recu/${id}`);
  const p = await db.paiement.findUnique({
    where: { id },
    include: {
      annee: true,
      enregistrePar: { select: { prenom: true, nom: true } },
      etudiant: {
        include: {
          utilisateur: true,
          inscriptions: { include: { promotion: { include: { niveau: true, filiere: true } } } },
        },
      },
    },
  });
  if (!p || (p.etudiant.utilisateurId !== u.id && !u.permissions.has("finances.consulter")))
    notFound();
  const institut = await lireInstitut();
  const inscription = p.etudiant.inscriptions.find((i) => i.promotion.anneeId === p.anneeId);
  const nom = [
    p.etudiant.utilisateur.nom,
    p.etudiant.utilisateur.postnom,
    p.etudiant.utilisateur.prenom,
  ]
    .filter(Boolean)
    .join(" ");
  const lignes: [string, string][] = [
    ["Reçu de", nom],
    ["Matricule", p.etudiant.matricule],
    ["Promotion", inscription ? libellePromotion(inscription.promotion) : "—"],
    ["Année académique", p.annee.libelle],
    ["Montant", formatMontant(Number(p.montant), p.devise)],
    ["Mode de paiement", MODES_PAIEMENT[p.mode]],
    ["Référence", p.reference],
    ["Date du paiement", formatJour.format(p.payeLe)],
    ["Enregistré par", [p.enregistrePar.prenom, p.enregistrePar.nom].filter(Boolean).join(" ")],
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
          <h1 className="text-3xl">Reçu de paiement</h1>
          <p className="font-mono text-lg text-encre">N° {p.numeroRecu}</p>
        </div>
        {p.annuleLe && (
          <p className="mt-4 border border-erreur px-3 py-2 text-sm font-semibold text-erreur uppercase">
            Paiement annulé le {formatJour.format(p.annuleLe)} : {p.motifAnnulation}
          </p>
        )}
        <dl className="mt-8 divide-y divide-pierre-200 border-y border-pierre-200">
          {lignes.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[11rem_1fr] gap-4 py-2.5 text-sm">
              <dt className="text-pierre-600">{k}</dt>
              <dd className="text-pierre-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-xs leading-relaxed text-pierre-500">
          Reçu émis par la plateforme de l&apos;{institut.sigle} à partir du paiement enregistré par
          la caisse. Conservez également le bordereau de la banque ou de l&apos;opérateur.
        </p>
      </article>
    </main>
  );
}

export default function PageRecu({ params }: PageProps<"/recu/[id]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Recu params={params} />
    </Suspense>
  );
}
