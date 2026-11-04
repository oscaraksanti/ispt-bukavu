import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { DocumentOfficiel } from "@/components/documents/document-officiel";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { qrSvg } from "@/features/documents/qr";
import type { DonneesDocument } from "@/features/documents/regles";
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
  const [institut, autorites] = await Promise.all([
    lireInstitut(),
    db.autorite.findMany({ where: { visible: true }, orderBy: { ordre: "asc" } }),
  ]);
  // Signataire : le Secrétaire général académique s'il figure parmi les autorités.
  const sga = autorites.find((a) => /acad[ée]mique/i.test(a.fonction)) ?? null;
  const url = `${urlSite()}/verifier/${doc.code}`;
  return (
    <main className="min-h-svh bg-pierre-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[210mm] justify-end px-4 print:hidden">
        <BoutonImprimer libelle="Imprimer ou enregistrer en PDF" />
      </div>
      <div className="shadow-lg print:shadow-none">
        <DocumentOfficiel
          type={doc.type}
          donnees={doc.donnees as DonneesDocument}
          code={doc.code}
          emisLe={doc.emisLe}
          institut={institut}
          signataire={sga ? { fonction: sga.fonction, nom: sga.nom } : null}
          qr={await qrSvg(url)}
          urlVerification={url.replace(/^https?:\/\//, "")}
          revoque={doc.revoqueLe ? (doc.motifRevocation ?? "révoqué") : null}
        />
      </div>
    </main>
  );
}

export default function PageDocument({ params }: PageProps<"/documents/[id]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Contenu params={params} />
    </Suspense>
  );
}
