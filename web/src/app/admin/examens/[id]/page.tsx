import { CircleAlert, Printer } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ChampsEpreuve, type CoursProposes } from "@/components/examens/champs-epreuve";
import { ChampsSession } from "@/components/examens/champs-session";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import {
  ajouterEpreuve,
  modifierEpreuve,
  modifierSession,
  publierSession,
  retirerPublication,
  supprimerEpreuve,
  supprimerSession,
} from "@/features/examens/actions";
import {
  conflits,
  enHeureBukavu,
  libelleSalle,
  MODALITES,
  parJour,
  TYPES_SESSION,
} from "@/features/examens/regles";
import { nomComplet, planningDeLaSession, sessionDetaillee } from "@/features/examens/requetes";
import { libelleJour } from "@/features/horaires/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Session d'examens" };

export default async function SessionExamens({ params }: PageProps<"/admin/examens/[id]">) {
  await exigerPermission("academique.horaires");
  const { id } = await params;
  const s = await sessionDetaillee(id);
  if (!s) notFound();
  const [promotions, profs, planning] = await Promise.all([
    db.promotion.findMany({
      where: { anneeId: s.anneeId },
      include: {
        niveau: true,
        filiere: true,
        cours: { include: { cours: true }, orderBy: { cours: { intitule: "asc" } } },
      },
      orderBy: [{ niveau: { ordre: "asc" } }, { filiere: { ordre: "asc" } }],
    }),
    db.profilEnseignant.findMany({
      where: { utilisateur: { statut: { not: "SUSPENDU" } } },
      include: { utilisateur: true },
      orderBy: { utilisateur: { nom: "asc" } },
    }),
    planningDeLaSession(id),
  ]);
  const cours: CoursProposes = promotions
    .filter((p) => p.cours.length > 0)
    .map((p) => ({
      promotion: libellePromotion(p),
      cours: p.cours.map((c) => ({ id: c.id, intitule: c.cours.intitule })),
    }));
  const enseignants = profs.map((p) => ({
    id: p.id,
    nom: [p.titre, nomComplet(p.utilisateur)].filter(Boolean).join(" "),
  }));
  const bornes = { min: enHeureBukavu(s.debut).jour, max: enHeureBukavu(s.fin).jour };
  const listeConflits = conflits(planning);
  const enConflit = new Set(listeConflits.flatMap((c) => c.epreuves));
  const publiee = s.statut === "PUBLIEE";

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Examens", href: "/admin/examens" },
          { libelle: s.libelle },
        ]}
        titre={s.libelle}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Etiquette ton={publiee ? "succes" : "neutre"}>
              {publiee ? "Publiée" : "Brouillon"}
            </Etiquette>
            <span>
              {TYPES_SESSION[s.type]} · {s.annee.libelle} · du {formatJour.format(s.debut)} au{" "}
              {formatJour.format(s.fin)}
            </span>
          </span>
        }
        actions={
          <div className="flex flex-wrap items-start gap-2">
            {s.epreuves.length > 0 && (
              <a
                href={`/examens/${s.id}/imprimer`}
                className="inline-flex h-9 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm font-medium text-encre hover:border-encre"
              >
                <Printer aria-hidden className="size-4" /> Imprimer
              </a>
            )}
            {publiee ? (
              <BoutonAction
                action={retirerPublication.bind(null, s.id)}
                confirmation="Masquer aux étudiants ?"
              >
                Retirer la publication
              </BoutonAction>
            ) : (
              <BoutonAction
                action={publierSession.bind(null, s.id)}
                variante="institutionnel"
                confirmation="Publier et prévenir étudiants et enseignants ?"
              >
                Publier le calendrier
              </BoutonAction>
            )}
          </div>
        }
      />

      {listeConflits.length > 0 && (
        <section
          aria-labelledby="conflits"
          className="mt-8 rounded-md border border-erreur/40 bg-erreur-fond p-5"
        >
          <h2
            id="conflits"
            className="flex items-center gap-2 font-sans text-base font-semibold text-erreur"
          >
            <CircleAlert aria-hidden className="size-5" />
            {listeConflits.length} conflit{listeConflits.length > 1 ? "s" : ""} à résoudre avant la
            publication
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-pierre-900">
            {listeConflits.map((c, i) => (
              <li key={i}>{c.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="planning" className="mt-8">
        <h2 id="planning" className="text-2xl">
          Planning · {s.epreuves.length} épreuve{s.epreuves.length > 1 ? "s" : ""}
        </h2>
        {s.epreuves.length === 0 ? (
          <div className="mt-4">
            <EtatVide
              titre="Aucune épreuve"
              description="Ajoutez les épreuves de chaque promotion ci-dessous."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {parJour(s.epreuves).map(({ jour, epreuves }) => (
              <div key={jour}>
                <h3 className="font-sans text-sm font-semibold text-encre first-letter:uppercase">
                  {libelleJour(jour)}
                </h3>
                <ul className="mt-2 divide-y divide-pierre-200 rounded-md border border-pierre-200 bg-white">
                  {epreuves.map((e) => (
                    <li
                      key={e.id}
                      className={`p-4 ${enConflit.has(e.id) ? "border-l-4 border-l-erreur" : ""}`}
                    >
                      <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                        <p className="w-28 shrink-0 font-mono text-sm text-encre">
                          {formatHeure.format(e.debut)}–{formatHeure.format(e.fin)}
                        </p>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-pierre-900">
                            {e.coursOffert.cours.intitule}
                          </p>
                          <p className="text-sm text-pierre-600">
                            {libellePromotion(e.coursOffert.promotion)} · {MODALITES[e.modalite]}
                            {` · ${libelleSalle(e.salle)}`}
                          </p>
                          {e.surveillants.length > 0 && (
                            <p className="text-sm text-pierre-600">
                              Surveillance :{" "}
                              {e.surveillants
                                .map((x) => nomComplet(x.enseignant.utilisateur))
                                .join(", ")}
                            </p>
                          )}
                          {e.remarque && (
                            <p className="mt-1 text-sm text-pierre-700">{e.remarque}</p>
                          )}
                        </div>
                        <BoutonAction
                          action={supprimerEpreuve.bind(null, e.id)}
                          variante="fantome"
                          confirmation="Supprimer ?"
                          libelleAccessible={`Supprimer l'épreuve ${e.coursOffert.cours.intitule}`}
                        >
                          Supprimer
                        </BoutonAction>
                      </div>
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-ispt-700">
                          Modifier<span className="sr-only"> : {e.coursOffert.cours.intitule}</span>
                        </summary>
                        <div className="mt-4">
                          <FormulaireAction
                            action={modifierEpreuve.bind(null, e.id)}
                            libelleEnvoi="Enregistrer"
                          >
                            <ChampsEpreuve
                              prefixe={`e-${e.id}`}
                              cours={cours}
                              enseignants={enseignants}
                              bornes={bornes}
                              epreuve={e}
                            />
                          </FormulaireAction>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <Panneau
        className="mt-8"
        titre="Ajouter une épreuve"
        description={
          cours.length === 0
            ? "Aucun cours n'est programmé pour les promotions de cette année : complétez d'abord le programme."
            : "Plusieurs promotions peuvent composer en même temps dans des salles différentes."
        }
      >
        {cours.length > 0 && (
          <FormulaireAction action={ajouterEpreuve.bind(null, s.id)} libelleEnvoi="Ajouter">
            <ChampsEpreuve
              prefixe="nouvelle"
              cours={cours}
              enseignants={enseignants}
              bornes={bornes}
            />
          </FormulaireAction>
        )}
      </Panneau>

      <Panneau className="mt-8" titre="Session">
        <FormulaireAction action={modifierSession.bind(null, s.id)} libelleEnvoi="Enregistrer">
          <ChampsSession session={s} />
        </FormulaireAction>
        {!publiee && (
          <div className="mt-6 border-t border-pierre-200 pt-4">
            <BoutonAction
              action={supprimerSession.bind(null, s.id)}
              variante="danger"
              confirmation="Supprimer la session et ses épreuves ?"
            >
              Supprimer la session
            </BoutonAction>
          </div>
        )}
      </Panneau>
    </>
  );
}
