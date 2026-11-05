import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { DocumentOfficiel } from "@/components/documents/document-officiel";
import { Apercu } from "@/components/documents/papier";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { lireParametresDocuments, signataireDocuments } from "@/features/documents/parametres";
import { qrSvg } from "@/features/documents/qr";
import { type DonneesDocument, LIBELLES_DOCUMENT } from "@/features/documents/regles";
import { db } from "@/lib/db";
import { urlSite } from "@/lib/email";

export const instant = false;

export const metadata: Metadata = { title: "Document officiel", robots: { index: false } };

async function Contenu({ params }: { params: PageProps<"/documents/[id]">["params"] }) {
  const u = await utilisateurConnecte();
  const { id } = await params;
  if (!u) redirect(`/connexion?suite=/documents/${id}`);
  const doc = await db.documentOfficiel.findUnique({ where: { id }, include: { etudiant: true } });
  if (!doc || (doc.etudiant.utilisateurId !== u.id && !u.permissions.has("documents.emettre")))
    notFound();
  const [institut, parametres] = await Promise.all([lireInstitut(), lireParametresDocuments()]);
  const signataire = await signataireDocuments(parametres);
  const url = `${urlSite()}/verifier/${doc.code}`;
  return (
    <Apercu
      informations={
        <>
          {LIBELLES_DOCUMENT[doc.type]} · N° <span className="font-mono">{doc.code}</span>
          {doc.revoqueLe && <strong className="ml-2 text-erreur">Révoqué</strong>}
        </>
      }
    >
      <DocumentOfficiel
        type={doc.type}
        donnees={doc.donnees as DonneesDocument}
        code={doc.code}
        emisLe={doc.emisLe}
        institut={institut}
        signataire={signataire}
        parametres={parametres}
        qr={await qrSvg(url)}
        urlVerification={url.replace(/^https?:\/\//, "")}
        revoque={doc.revoqueLe ? (doc.motifRevocation ?? "révoqué") : null}
      />
    </Apercu>
  );
}

export default function PageDocument({ params }: PageProps<"/documents/[id]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Contenu params={params} />
    </Suspense>
  );
}
