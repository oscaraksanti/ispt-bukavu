import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Apercu } from "@/components/documents/papier";
import { RecuImprimable } from "@/components/documents/recu";
import { libellePromotion } from "@/features/academique/regles";
import { formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { lireParametresDocuments } from "@/features/documents/parametres";
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
  const [institut, parametres] = await Promise.all([lireInstitut(), lireParametresDocuments()]);
  const inscription = p.etudiant.inscriptions.find((i) => i.promotion.anneeId === p.anneeId);
  const nom = [
    p.etudiant.utilisateur.nom,
    p.etudiant.utilisateur.postnom,
    p.etudiant.utilisateur.prenom,
  ]
    .filter(Boolean)
    .join(" ");
  const caissier = [p.enregistrePar.prenom, p.enregistrePar.nom].filter(Boolean).join(" ");
  return (
    <Apercu
      libelleImprimer="Imprimer le reçu"
      informations={
        <>
          Reçu N° <span className="font-mono">{p.numeroRecu}</span>
        </>
      }
    >
      <RecuImprimable
        institut={institut}
        tutelle={parametres.entete}
        titre="Reçu de paiement"
        numero={p.numeroRecu}
        synthese={[
          {
            libelle: "Montant reçu",
            valeur: formatMontant(Number(p.montant), p.devise),
            accent: true,
          },
          { libelle: "Mode de paiement", valeur: MODES_PAIEMENT[p.mode] },
          { libelle: "Date du paiement", valeur: formatJour.format(p.payeLe) },
        ]}
        details={[
          { libelle: "Reçu de", valeur: nom, large: true },
          { libelle: "Matricule", valeur: p.etudiant.matricule, mono: true },
          {
            libelle: "Promotion",
            valeur: inscription ? libellePromotion(inscription.promotion) : "—",
          },
          { libelle: "Année académique", valeur: p.annee.libelle },
          { libelle: "Référence du paiement", valeur: p.reference, mono: true },
        ]}
        mention={`Reçu émis par la plateforme de l'${institut.sigle} à partir du paiement enregistré par la caisse. Conservez également le bordereau de la banque ou de l'opérateur.`}
        caissier={caissier || null}
        date={formatJour.format(p.creeLe)}
        annulation={
          p.annuleLe
            ? `Paiement annulé le ${formatJour.format(p.annuleLe)} : ${p.motifAnnulation}`
            : null
        }
      />
    </Apercu>
  );
}

export default function PageRecu({ params }: PageProps<"/recu/[id]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Recu params={params} />
    </Suspense>
  );
}
