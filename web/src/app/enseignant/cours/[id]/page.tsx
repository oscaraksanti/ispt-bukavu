import { ExternalLink, FileText, Link2, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { formatJour } from "@/features/actualites/dates";
import { exigerEnseignant } from "@/features/espaces/acces";
import { creerEvaluation } from "@/features/notes/actions";
import { etudiantsDuCours, peutGererCours } from "@/features/notes/acces";
import {
  LIBELLES_EVALUATION,
  type StatutEvaluation,
  TYPES_EVALUATION,
} from "@/features/notes/regles";
import { ajouterSupport, supprimerSupport } from "@/features/supports/actions";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Cours" };

const TON: Record<StatutEvaluation, "neutre" | "attention" | "ispt" | "succes"> = {
  BROUILLON: "neutre",
  SOUMISE: "attention",
  VALIDEE: "ispt",
  PUBLIEE: "succes",
};

export default async function CoursEnseignant({ params }: PageProps<"/enseignant/cours/[id]">) {
  const { u } = await exigerEnseignant();
  const { id } = await params;
  if (!(await peutGererCours(u, id))) notFound();
  const [co, etudiants] = await Promise.all([
    db.coursOffert.findUnique({
      where: { id },
      include: {
        cours: { include: { ue: true } },
        promotion: { include: { filiere: true, niveau: true } },
        supports: { include: { media: true }, orderBy: [{ chapitre: "asc" }, { ordre: "asc" }] },
        evaluations: { include: { _count: { select: { notes: true } } }, orderBy: { date: "asc" } },
      },
    }),
    etudiantsDuCours(id),
  ]);
  if (!co) notFound();
  const poids = co.evaluations.reduce((t, e) => t + Number(e.ponderation), 0);

  return (
    <div className="space-y-8">
      <header>
        <Link href="/enseignant" className="text-sm text-ispt-600 underline hover:no-underline">
          ← Mes cours
        </Link>
        <p className="mt-4 font-mono text-xs text-ispt-600">
          {co.cours.ue.code} · S{co.cours.ue.semestre} · {co.cours.credits} crédit(s) ·{" "}
          {co.cours.volumeHoraire} h
        </p>
        <h1 className="mt-2 text-[2.25rem] leading-tight">{co.cours.intitule}</h1>
        <p className="mt-2 text-pierre-700">
          {libellePromotion(co.promotion)} · {etudiants.length} étudiant(s)
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panneau titre="Évaluations" description={`Poids total : ${poids} % sur 100 %.`}>
          {co.evaluations.length === 0 ? (
            <p className="text-sm text-pierre-600">Aucune évaluation pour le moment.</p>
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200">
              {co.evaluations.map((e) => (
                <li key={e.id} className="py-3">
                  <Link
                    href={`/enseignant/cours/${co.id}/evaluations/${e.id}`}
                    className="group flex flex-wrap items-center gap-2"
                  >
                    <span className="flex-1 font-medium text-encre group-hover:text-ispt-600">
                      {e.intitule}
                    </span>
                    <Etiquette ton={TON[e.statut]}>{LIBELLES_EVALUATION[e.statut]}</Etiquette>
                  </Link>
                  <p className="mt-0.5 text-xs text-pierre-600">
                    {TYPES_EVALUATION[e.type]} · {Number(e.ponderation)} % · {e._count.notes}/
                    {etudiants.length} note(s)
                    {e.date && ` · ${formatJour.format(e.date)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <details className="mt-5 rounded-xs bg-pierre-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-ispt-600">
              Nouvelle évaluation
            </summary>
            <div className="mt-4">
              <FormulaireAction
                action={creerEvaluation.bind(null, co.id)}
                libelleEnvoi="Créer"
                viderApresSucces
              >
                <Champ id="intitule" libelle="Intitulé">
                  <Saisie
                    id="intitule"
                    name="intitule"
                    placeholder="Interrogation 1"
                    maxLength={120}
                  />
                </Champ>
                <div className="grid grid-cols-3 gap-3">
                  <Champ id="type" libelle="Type">
                    <Liste id="type" name="type" defaultValue="INTERROGATION">
                      {Object.entries(TYPES_EVALUATION).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Liste>
                  </Champ>
                  <Champ id="ponderation" libelle="Poids (%)">
                    <Saisie
                      id="ponderation"
                      name="ponderation"
                      inputMode="decimal"
                      defaultValue={String(Math.max(0, 100 - poids) || "")}
                    />
                  </Champ>
                  <Champ id="date" libelle="Date">
                    <Saisie id="date" name="date" type="date" />
                  </Champ>
                </div>
              </FormulaireAction>
            </div>
          </details>
        </Panneau>

        <Panneau
          titre="Supports de cours"
          description="Notes de cours, exercices, présentations : visibles des étudiants inscrits."
        >
          {co.supports.length === 0 ? (
            <EtatVide titre="Aucun support" />
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200">
              {co.supports.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                  {s.type === "LIEN" ? (
                    <Link2 aria-hidden className="size-4 shrink-0 text-pierre-500" />
                  ) : (
                    <FileText aria-hidden className="size-4 shrink-0 text-pierre-500" />
                  )}
                  <a
                    href={s.type === "LIEN" ? (s.url ?? "#") : `/supports/${s.id}`}
                    target="_blank"
                    rel="noopener"
                    className="min-w-0 flex-1 truncate text-ispt-600 underline hover:no-underline"
                  >
                    {s.chapitre && <span className="text-pierre-500">{s.chapitre} · </span>}
                    {s.titre}
                  </a>
                  {s.type === "LIEN" && (
                    <ExternalLink aria-hidden className="size-3.5 text-pierre-400" />
                  )}
                  <BoutonAction
                    action={supprimerSupport.bind(null, s.id)}
                    variante="fantome"
                    confirmation="Retirer ?"
                    className="size-8 px-0"
                    libelleAccessible={`Retirer ${s.titre}`}
                  >
                    <X aria-hidden />
                  </BoutonAction>
                </li>
              ))}
            </ul>
          )}
          <details className="mt-5 rounded-xs bg-pierre-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-ispt-600">
              Ajouter un support
            </summary>
            <div className="mt-4">
              <FormulaireAction
                action={ajouterSupport.bind(null, co.id)}
                libelleEnvoi="Ajouter"
                viderApresSucces
              >
                <div className="grid grid-cols-2 gap-3">
                  <Champ id="titre" libelle="Titre">
                    <Saisie id="titre" name="titre" maxLength={160} />
                  </Champ>
                  <Champ id="chapitre" libelle="Chapitre (facultatif)">
                    <Saisie id="chapitre" name="chapitre" maxLength={120} />
                  </Champ>
                </div>
                <Champ
                  id="fichier"
                  libelle="Fichier"
                  aide="PDF, image, Word, PowerPoint ou Excel ; 4 Mo au plus."
                >
                  <input
                    id="fichier"
                    name="fichier"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx,.xlsx"
                    className="block w-full text-sm file:mr-3 file:rounded-xs file:border file:border-pierre-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
                    aria-describedby="fichier-aide"
                  />
                </Champ>
                <Champ id="url" libelle="ou un lien (Google Drive, vidéo…)">
                  <Saisie id="url" name="url" type="url" placeholder="https://" />
                </Champ>
              </FormulaireAction>
            </div>
          </details>
        </Panneau>
      </div>
    </div>
  );
}
