import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Apercu } from "@/components/documents/papier";
import { RecuImprimable } from "@/components/documents/recu";
import { formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { lireParametresDocuments } from "@/features/documents/parametres";
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
  const [institut, parametres, caissier] = await Promise.all([
    lireInstitut(),
    lireParametresDocuments(),
    c.paiementVerifieParId
      ? db.utilisateur.findUnique({
          where: { id: c.paiementVerifieParId },
          select: { prenom: true, nom: true },
        })
      : null,
  ]);
  return (
    <Apercu
      libelleImprimer="Imprimer le reçu"
      informations={
        <>
          Reçu N° <span className="font-mono">{c.numeroRecu}</span>
        </>
      }
    >
      <RecuImprimable
        institut={institut}
        tutelle={parametres.entete}
        titre="Reçu des frais de dossier"
        numero={c.numeroRecu}
        synthese={[
          {
            libelle: "Montant reçu",
            valeur: formatMontant(Number(c.montantFrais ?? 0), c.deviseFrais ?? "USD"),
            accent: true,
          },
          {
            libelle: "Mode de paiement",
            valeur: c.modePaiement ? MODES_PAIEMENT[c.modePaiement] : "—",
          },
          { libelle: "Vérifié le", valeur: formatJour.format(c.paiementVerifieLe) },
        ]}
        details={[
          {
            libelle: "Reçu de",
            valeur: [c.nom, c.postnom, c.prenom].filter(Boolean).join(" "),
            large: true,
          },
          { libelle: "Dossier de candidature", valeur: `n° ${c.numero}`, mono: true },
          { libelle: "Filière demandée", valeur: c.filiere?.nom ?? "—" },
          { libelle: "Campagne", valeur: `${c.campagne.libelle} (${c.campagne.annee.libelle})` },
          { libelle: "Objet", valeur: "Frais de dossier de candidature" },
          { libelle: "Référence du paiement", valeur: c.referencePaiement ?? "—", mono: true },
        ]}
        mention={`Reçu émis par la plateforme de l'${institut.sigle} après vérification du paiement par la caisse. Il ne vaut pas décision d'admission. Conservez également le bordereau de la banque ou de l'opérateur.`}
        caissier={caissier ? [caissier.prenom, caissier.nom].filter(Boolean).join(" ") : null}
        date={formatJour.format(c.paiementVerifieLe)}
      />
    </Apercu>
  );
}

export default function PageRecuDossier({ params }: PageProps<"/recu-dossier/[id]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Recu params={params} />
    </Suspense>
  );
}
