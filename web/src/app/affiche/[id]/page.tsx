import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { Blason } from "@/components/marque/blason";
import { formatJour } from "@/features/actualites/dates";
import { fraisExiges } from "@/features/admissions/regles";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { qrSvg } from "@/features/documents/qr";
import { formatMontant } from "@/features/finances/regles";
import { db } from "@/lib/db";
import { urlSite } from "@/lib/email";

export const instant = false;

export const metadata: Metadata = { title: "Affiche des admissions", robots: { index: false } };

/**
 * Affiche A4 d'une campagne d'admission, à imprimer pour les valves, les
 * écoles et les paroisses. Tout son contenu vient de la campagne enregistrée.
 */
async function Affiche({ params }: { params: PageProps<"/affiche/[id]">["params"] }) {
  const u = await utilisateurConnecte();
  const { id } = await params;
  if (!u) redirect(`/connexion?suite=/affiche/${id}`);
  if (!u.permissions.has("admissions.consulter")) notFound();
  const c = await db.campagneAdmission.findUnique({
    where: { id },
    include: {
      annee: true,
      filieres: { orderBy: { ordre: "asc" } },
      pieces: { orderBy: { ordre: "asc" } },
    },
  });
  if (!c) notFound();
  const institut = await lireInstitut();
  const url = `${urlSite()}/candidater`;
  const qr = await qrSvg(url);

  return (
    <main className="min-h-svh bg-pierre-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-4 px-4 print:hidden">
        <p className="text-sm text-pierre-700">
          Format A4. Le QR code mène à la page de candidature en ligne.
        </p>
        <BoutonImprimer libelle="Imprimer l'affiche" />
      </div>
      <article className="document-a4 mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white shadow-lg print:shadow-none">
        <header className="trame-claire flex items-center gap-6 bg-encre px-[16mm] py-[12mm] text-white">
          <Blason variante="blanc" hauteur={96} decoratif />
          <div>
            <p className="font-mono text-[9pt] tracking-[0.2em] text-chantier uppercase">
              Admissions {c.annee.libelle}
            </p>
            <p className="mt-2 font-serif text-[20pt] leading-tight">{institut.nom}</p>
            <p className="mt-1 text-[10pt] text-white/75">
              {institut.ville}, {institut.province}
            </p>
          </div>
        </header>

        <section className="px-[16mm] pt-[12mm]">
          <h1 className="font-serif text-[34pt] leading-[1.05] text-encre">
            Candidatez en ligne,
            <br />
            sans vous déplacer.
          </h1>
          <p className="mt-4 text-[12pt] text-pierre-800">
            Dépôt des dossiers du <strong>{formatJour.format(c.ouverture)}</strong> au{" "}
            <strong>{formatJour.format(c.cloture)}</strong>.
          </p>
        </section>

        <section className="grid flex-1 grid-cols-2 gap-[10mm] px-[16mm] pt-[10mm]">
          <div>
            <h2 className="font-mono text-[9pt] tracking-[0.15em] text-ispt-700 uppercase">
              Filières ouvertes
            </h2>
            <ul className="mt-3 space-y-2 text-[11.5pt] text-pierre-900">
              {c.filieres.map((f) => (
                <li key={f.id} className="border-b border-pierre-200 pb-2">
                  {f.nom}
                </li>
              ))}
            </ul>
            {fraisExiges(c) && (
              <p className="mt-6 text-[11pt] text-pierre-800">
                Frais de dossier :{" "}
                <strong>{formatMontant(Number(c.fraisInscription), c.devise)}</strong>
              </p>
            )}
          </div>
          <div>
            <h2 className="font-mono text-[9pt] tracking-[0.15em] text-ispt-700 uppercase">
              Pièces à préparer
            </h2>
            <ul className="mt-3 space-y-2 text-[10.5pt] text-pierre-900">
              {c.pieces.map((p) => (
                <li key={p.id} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-chantier"
                  />
                  <span>
                    {p.libelle}
                    {!p.obligatoire && <span className="text-pierre-600"> (facultatif)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="mt-[10mm] flex items-center gap-[10mm] border-t-4 border-chantier px-[16mm] py-[10mm]">
          <div
            className="size-[42mm] shrink-0 [&_svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <div>
            <p className="font-serif text-[18pt] text-encre">Scannez pour candidater</p>
            <p className="mt-1 font-mono text-[11pt] text-pierre-800">
              {url.replace(/^https?:\/\//, "")}
            </p>
            <p className="mt-4 text-[10pt] text-pierre-700">
              Renseignements : {institut.telephone}
              {institut.whatsapp ? ` · WhatsApp ${institut.whatsapp}` : ""}
              {institut.email ? ` · ${institut.email}` : ""}
            </p>
            <p className="text-[10pt] text-pierre-700">
              {institut.rue}, {institut.ville}
            </p>
          </div>
        </footer>
      </article>
    </main>
  );
}

export default function PageAffiche({ params }: PageProps<"/affiche/[id]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Affiche params={params} />
    </Suspense>
  );
}
