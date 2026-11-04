import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { TexteArticle } from "@/components/public/texte-article";
import { Champ, Saisie } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { deposerRemise } from "@/features/devoirs/actions";
import { depotOuvert, etatRemise, LIBELLES_ETAT } from "@/features/devoirs/regles";
import { exigerEtudiant } from "@/features/espaces/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Devoir" };

const quand = (d: Date) => `${formatJour.format(d)} à ${formatHeure.format(d)}`;

export default async function DevoirEtudiant({
  params,
}: PageProps<"/etudiant/cours/[id]/devoirs/[devoirId]">) {
  const { profil } = await exigerEtudiant();
  const { id, devoirId } = await params;
  // Le devoir doit appartenir à un cours de l'une des promotions de l'étudiant.
  const devoir = await db.devoir.findFirst({
    where: {
      id: devoirId,
      coursOffertId: id,
      coursOffert: { promotionId: { in: profil.inscriptions.map((i) => i.promotionId) } },
    },
    include: {
      enonce: true,
      coursOffert: { include: { cours: true } },
      remises: { where: { etudiantId: profil.id }, include: { fichier: true } },
    },
  });
  if (!devoir) notFound();
  const remise = devoir.remises[0] ?? null;
  const maintenant = new Date();
  const etat = etatRemise(devoir, remise, maintenant);
  const ouvert = depotOuvert(devoir, remise, maintenant);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/etudiant/cours/${id}`}
        className="text-sm text-ispt-600 underline hover:no-underline"
      >
        ← {devoir.coursOffert.cours.intitule}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[2.25rem] leading-tight">{devoir.titre}</h1>
        <Etiquette ton={etat === "corrige" ? "succes" : etat === "non_rendu" ? "erreur" : "ispt"}>
          {LIBELLES_ETAT[etat]}
        </Etiquette>
      </div>
      <p className="mt-2 text-pierre-700">
        À rendre au plus tard le {quand(devoir.echeance)}
        {devoir.accepteRetard ? " · les retards sont acceptés mais signalés" : ""}
      </p>

      <section className="mt-8 rounded-md border border-pierre-200 bg-white p-5 sm:p-6">
        <h2 className="font-sans text-base font-semibold text-encre">Consignes</h2>
        <div className="mt-3 text-pierre-800">
          <TexteArticle texte={devoir.consignes} />
        </div>
        {devoir.enonce && (
          <a
            href={`/devoirs/enonce/${devoir.id}`}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center gap-2 text-sm text-ispt-600 underline hover:no-underline"
          >
            <FileText aria-hidden className="size-4" /> Télécharger l&apos;énoncé
          </a>
        )}
      </section>

      {remise?.corrigeLe && (
        <section className="mt-6 rounded-md border border-succes/30 bg-succes-fond p-5 sm:p-6">
          <h2 className="font-sans text-base font-semibold text-encre">Correction</h2>
          {remise.note != null && (
            <p className="mt-2 font-mono text-3xl text-encre">{Number(remise.note)}/20</p>
          )}
          {remise.appreciation && <p className="mt-2 text-pierre-800">{remise.appreciation}</p>}
        </section>
      )}

      <section className="mt-6 rounded-md border border-pierre-200 bg-white p-5 sm:p-6">
        <h2 className="font-sans text-base font-semibold text-encre">Ma copie</h2>
        {remise ? (
          <p className="mt-2 text-sm text-pierre-700">
            <a
              href={`/devoirs/copie/${remise.id}`}
              target="_blank"
              rel="noopener"
              className="text-ispt-600 underline hover:no-underline"
            >
              {remise.fichier.nomFichier}
            </a>{" "}
            · déposée le {quand(remise.deposeLe)}
            {remise.enRetard ? " (en retard)" : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-pierre-700">Aucune copie déposée.</p>
        )}
        {ouvert ? (
          <div className="mt-5">
            <FormulaireAction
              action={deposerRemise.bind(null, devoir.id)}
              libelleEnvoi={remise ? "Remplacer ma copie" : "Déposer ma copie"}
              viderApresSucces
            >
              <Champ
                id="copie"
                libelle="Fichier"
                aide="PDF, photo ou document Word ; 4 Mo au plus. Une photo nette prise au téléphone suffit."
              >
                <input
                  id="copie"
                  name="copie"
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                  className="block w-full text-sm file:mr-3 file:rounded-xs file:border file:border-pierre-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
                  aria-describedby="copie-aide"
                />
              </Champ>
              <Champ id="commentaire" libelle="Message à l'enseignant (facultatif)">
                <Saisie id="commentaire" name="commentaire" maxLength={500} />
              </Champ>
            </FormulaireAction>
          </div>
        ) : (
          !remise?.corrigeLe && (
            <p className="mt-4 text-sm font-medium text-erreur">
              L&apos;échéance est passée : le dépôt est fermé.
            </p>
          )
        )}
      </section>
    </div>
  );
}
