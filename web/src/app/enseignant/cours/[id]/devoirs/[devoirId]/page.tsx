import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { EnteteCours } from "@/components/cours/entete-cours";
import { TexteArticle } from "@/components/public/texte-article";
import { Champ, Saisie, ZoneTexte } from "@/components/ui/champs";
import { Etiquette, LienRetour } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { coursDeLEnseignant } from "@/features/devoirs/acces";
import { corrigerRemise, supprimerDevoir } from "@/features/devoirs/actions";
import { etatRemise, LIBELLES_ETAT, type EtatRemise } from "@/features/devoirs/regles";
import { exigerEnseignant } from "@/features/espaces/acces";
import { etudiantsDuCours } from "@/features/notes/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Devoir" };

const TON: Record<EtatRemise, "neutre" | "attention" | "ispt" | "succes" | "erreur"> = {
  a_rendre: "neutre",
  rendu: "ispt",
  rendu_en_retard: "attention",
  corrige: "succes",
  non_rendu: "erreur",
};

const quand = (d: Date) => `${formatJour.format(d)} à ${formatHeure.format(d)}`;

export default async function DevoirEnseignant({
  params,
}: PageProps<"/enseignant/cours/[id]/devoirs/[devoirId]">) {
  const { u } = await exigerEnseignant();
  const { id, devoirId } = await params;
  const co = await coursDeLEnseignant(u, id);
  if (!co) notFound();
  const [devoir, etudiants] = await Promise.all([
    db.devoir.findFirst({
      where: { id: devoirId, coursOffertId: id },
      include: { enonce: true, remises: true },
    }),
    etudiantsDuCours(id),
  ]);
  if (!devoir) notFound();
  const remises = new Map(devoir.remises.map((r) => [r.etudiantId, r]));
  const maintenant = new Date();

  return (
    <div className="space-y-8">
      <EnteteCours
        coursOffertId={id}
        code={`${co.cours.ue.code} · S${co.cours.ue.semestre}`}
        intitule={co.cours.intitule}
        promotion={libellePromotion(co.promotion)}
        actif="devoirs"
      />
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Panneau
          titre={devoir.titre}
          description={`À rendre le ${quand(devoir.echeance)}${devoir.accepteRetard ? " · retards acceptés" : ""}`}
        >
          <div className="text-sm text-pierre-800">
            <TexteArticle texte={devoir.consignes} />
          </div>
          {devoir.enonce && (
            <a
              href={`/devoirs/enonce/${devoir.id}`}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-flex items-center gap-2 text-sm text-ispt-600 underline hover:no-underline"
            >
              <FileText aria-hidden className="size-4" /> Énoncé : {devoir.enonce.nomFichier}
            </a>
          )}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-pierre-200 pt-4">
            <LienRetour href={`/enseignant/cours/${id}/devoirs`}>Tous les devoirs</LienRetour>
            {devoir.remises.length === 0 && (
              <BoutonAction
                action={supprimerDevoir.bind(null, devoir.id)}
                confirmation="Supprimer ce devoir ?"
                variante="fantome"
                className="ml-auto text-erreur hover:bg-erreur-fond"
              >
                Supprimer
              </BoutonAction>
            )}
          </div>
        </Panneau>

        <section aria-labelledby="titre-copies">
          <h2 id="titre-copies" className="font-sans text-base font-semibold text-encre">
            Copies · {devoir.remises.length}/{etudiants.length}
          </h2>
          <ul className="mt-3 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
            {etudiants.map((e) => {
              const r = remises.get(e.id) ?? null;
              const etat = etatRemise(devoir, r, maintenant);
              return (
                <li key={e.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-encre">{e.nom}</span>
                      <span className="font-mono text-xs text-pierre-600">{e.matricule}</span>
                    </span>
                    {r && (
                      <a
                        href={`/devoirs/copie/${r.id}`}
                        target="_blank"
                        rel="noopener"
                        className="text-sm text-ispt-600 underline hover:no-underline"
                      >
                        Ouvrir la copie<span className="sr-only"> de {e.nom}</span>
                      </a>
                    )}
                    <Etiquette ton={TON[etat]}>
                      {LIBELLES_ETAT[etat]}
                      {etat === "corrige" && r?.note != null ? ` · ${Number(r.note)}/20` : ""}
                    </Etiquette>
                  </div>
                  {r && (
                    <>
                      <p className="mt-1 text-xs text-pierre-600">
                        Déposée le {quand(r.deposeLe)}
                        {r.commentaire ? ` — « ${r.commentaire} »` : ""}
                      </p>
                      <details className="mt-3 rounded-xs bg-pierre-50 p-3" open={!r.corrigeLe}>
                        <summary className="cursor-pointer text-sm font-medium text-ispt-600">
                          {r.corrigeLe ? "Modifier la correction" : "Corriger"}
                          <span className="sr-only"> la copie de {e.nom}</span>
                        </summary>
                        <div className="mt-3">
                          <FormulaireAction
                            action={corrigerRemise.bind(null, r.id)}
                            libelleEnvoi="Enregistrer la correction"
                          >
                            <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                              <Champ id={`note-${r.id}`} libelle="Note / 20">
                                <Saisie
                                  id={`note-${r.id}`}
                                  name="note"
                                  inputMode="decimal"
                                  defaultValue={r.note != null ? String(Number(r.note)) : ""}
                                />
                              </Champ>
                              <Champ id={`appreciation-${r.id}`} libelle="Appréciation">
                                <ZoneTexte
                                  id={`appreciation-${r.id}`}
                                  name="appreciation"
                                  rows={2}
                                  maxLength={1000}
                                  defaultValue={r.appreciation ?? ""}
                                />
                              </Champ>
                            </div>
                          </FormulaireAction>
                        </div>
                      </details>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
