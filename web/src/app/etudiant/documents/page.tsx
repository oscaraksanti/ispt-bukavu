import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { demanderDocument } from "@/features/documents/actions";
import { LIBELLES_DOCUMENT } from "@/features/documents/regles";
import { exigerEtudiant } from "@/features/espaces/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsEtudiant() {
  const { profil } = await exigerEtudiant();
  const [demandes, documents] = await Promise.all([
    db.demandeDocument.findMany({
      where: { etudiantId: profil.id, statut: { not: "EMISE" } },
      orderBy: { creeLe: "desc" },
    }),
    db.documentOfficiel.findMany({ where: { etudiantId: profil.id }, orderBy: { emisLe: "desc" } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-[2.25rem] leading-tight">Documents officiels</h1>
        <p className="mt-2 text-pierre-600">
          Attestations et relevés délivrés par le secrétariat académique. Chaque document porte un
          QR code : un employeur ou une autre université peut en vérifier l&apos;authenticité en
          ligne.
        </p>
      </header>
      <section className="rounded-md border border-pierre-200 bg-white p-6">
        <h2 className="text-xl">Demander un document</h2>
        <div className="mt-4">
          <FormulaireAction
            action={demanderDocument}
            libelleEnvoi="Envoyer la demande"
            viderApresSucces
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ id="type" libelle="Document">
                <Liste id="type" name="type" defaultValue="ATTESTATION_FREQUENTATION">
                  {Object.entries(LIBELLES_DOCUMENT).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Liste>
              </Champ>
              <Champ id="motif" libelle="Motif (facultatif)">
                <Saisie
                  id="motif"
                  name="motif"
                  maxLength={200}
                  placeholder="Demande de bourse, stage…"
                />
              </Champ>
            </div>
          </FormulaireAction>
        </div>
      </section>
      {demandes.length > 0 && (
        <section>
          <h2 className="text-xl">Demandes</h2>
          <ul className="mt-3 divide-y divide-pierre-200 rounded-md border border-pierre-200 bg-white text-sm">
            {demandes.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1">{LIBELLES_DOCUMENT[d.type]}</span>
                <span className="text-xs text-pierre-500">{formatJour.format(d.creeLe)}</span>
                <Etiquette ton={d.statut === "REFUSEE" ? "erreur" : "attention"}>
                  {d.statut === "REFUSEE" ? "Refusée" : "En attente"}
                </Etiquette>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="text-xl">Documents délivrés</h2>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-pierre-600">Aucun document pour le moment.</p>
        ) : (
          <ul className="mt-3 divide-y divide-pierre-200 rounded-md border border-pierre-200 bg-white text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <FileText aria-hidden className="size-4 text-pierre-500" />
                <a
                  href={`/documents/${d.id}`}
                  target="_blank"
                  rel="noopener"
                  className="flex-1 text-ispt-600 underline hover:no-underline"
                >
                  {LIBELLES_DOCUMENT[d.type]}
                </a>
                <span className="font-mono text-xs text-pierre-500">{d.code}</span>
                <span className="text-xs text-pierre-500">{formatJour.format(d.emisLe)}</span>
                {d.revoqueLe && <Etiquette ton="erreur">Révoqué</Etiquette>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
