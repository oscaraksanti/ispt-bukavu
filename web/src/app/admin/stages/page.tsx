import type { Metadata } from "next";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Case, Champ, Liste, Saisie } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import {
  affecterStage,
  changerStatutStage,
  enregistrerLieu,
  importerLieuxPartenaires,
} from "@/features/stages/actions";
import { STATUTS_STAGE, TYPES_STAGE } from "@/features/stages/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Stages" };

export default async function Stages() {
  await exigerPermission("stages.gerer");
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  const [lieux, stages, encadreurs] = await Promise.all([
    db.lieuStage.findMany({
      include: { _count: { select: { stages: true } } },
      orderBy: [{ type: "asc" }, { nom: "asc" }],
    }),
    db.stage.findMany({
      where: annee ? { anneeId: annee.id } : undefined,
      include: {
        lieu: true,
        encadreur: true,
        etudiant: { include: { utilisateur: true } },
        rapport: true,
      },
      orderBy: [{ statut: "asc" }, { debut: "asc" }],
    }),
    db.utilisateur.findMany({
      where: { profilEnseignant: { isNot: null }, statut: { not: "SUSPENDU" } },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Stages" }]}
        titre="Stages"
        description="Lieux de stage (entreprises et écoles partenaires), affectation des étudiants, encadrement, rapports et évaluations."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panneau titre={`Stages ${annee?.libelle ?? ""}`} className="lg:col-span-3">
          {stages.length === 0 ? (
            <EtatVide titre="Aucun stage enregistré pour l'année" />
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200 text-sm">
              {stages.map((s) => (
                <li key={s.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex-1 font-medium text-encre">
                      {[s.etudiant.utilisateur.nom, s.etudiant.utilisateur.prenom].join(" ")}{" "}
                      <span className="font-mono text-xs font-normal text-pierre-500">
                        {s.etudiant.matricule}
                      </span>
                    </span>
                    <Etiquette
                      ton={
                        s.statut === "TERMINE"
                          ? "succes"
                          : s.statut === "EN_COURS"
                            ? "ispt"
                            : "neutre"
                      }
                    >
                      {STATUTS_STAGE[s.statut]}
                    </Etiquette>
                  </div>
                  <p className="mt-0.5 text-xs text-pierre-600">
                    {TYPES_STAGE[s.type]} · {s.lieu.nom}
                    {s.debut && ` · du ${formatJour.format(s.debut)}`}
                    {s.fin && ` au ${formatJour.format(s.fin)}`}
                    {s.encadreur && ` · encadreur ${s.encadreur.nom}`}
                    {s.note !== null && ` · note ${Number(s.note)}/20`}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                    {s.rapport && (
                      <a
                        href={`/stages/rapport/${s.id}`}
                        target="_blank"
                        rel="noopener"
                        className="text-ispt-600 underline"
                      >
                        Rapport
                      </a>
                    )}
                    {s.statut !== "TERMINE" && (
                      <BoutonAction
                        action={changerStatutStage.bind(
                          null,
                          s.id,
                          s.statut === "PREVU" ? "EN_COURS" : "TERMINE",
                        )}
                        variante="fantome"
                      >
                        {s.statut === "PREVU" ? "Marquer en cours" : "Marquer terminé"}
                      </BoutonAction>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
        <Panneau titre="Affecter un étudiant" className="lg:col-span-2">
          {lieux.length === 0 ? (
            <p className="text-sm text-pierre-600">Ajoutez d&apos;abord les lieux de stage.</p>
          ) : (
            <FormulaireAction
              action={affecterStage}
              libelleEnvoi="Enregistrer le stage"
              viderApresSucces
            >
              <Champ id="matricule" libelle="Matricule">
                <Saisie id="matricule" name="matricule" autoCapitalize="characters" required />
              </Champ>
              <div className="grid grid-cols-2 gap-3">
                <Champ id="type" libelle="Type">
                  <Liste id="type" name="type" defaultValue="PROFESSIONNEL">
                    {Object.entries(TYPES_STAGE).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Liste>
                </Champ>
                <Champ id="lieuId" libelle="Lieu">
                  <Liste id="lieuId" name="lieuId" defaultValue="">
                    <option value="" disabled>
                      Choisir…
                    </option>
                    {lieux
                      .filter((l) => l.actif)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nom}
                        </option>
                      ))}
                  </Liste>
                </Champ>
                <Champ id="debut" libelle="Début">
                  <Saisie id="debut" name="debut" type="date" />
                </Champ>
                <Champ id="fin" libelle="Fin">
                  <Saisie id="fin" name="fin" type="date" />
                </Champ>
              </div>
              <Champ id="encadreurId" libelle="Encadreur (enseignant)">
                <Liste id="encadreurId" name="encadreurId" defaultValue="">
                  <option value="">À désigner</option>
                  {encadreurs.map((e) => (
                    <option key={e.id} value={e.id}>
                      {[e.prenom, e.nom].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </Liste>
              </Champ>
            </FormulaireAction>
          )}
        </Panneau>
      </div>

      <Panneau
        className="mt-8"
        titre="Lieux de stage"
        actions={
          <BoutonAction action={importerLieuxPartenaires}>
            Reprendre les partenaires du site
          </BoutonAction>
        }
      >
        {lieux.length > 0 && (
          <ul className="-mt-2 mb-5 divide-y divide-pierre-200 text-sm">
            {lieux.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="flex-1 text-pierre-900">{l.nom}</span>
                <span className="text-xs text-pierre-500">{TYPES_STAGE[l.type]}</span>
                {l.convention && <Etiquette ton="succes">Convention</Etiquette>}
                <span className="text-xs text-pierre-500">{l._count.stages} stage(s)</span>
              </li>
            ))}
          </ul>
        )}
        <details className="rounded-xs bg-pierre-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-ispt-600">
            Ajouter un lieu
          </summary>
          <div className="mt-4">
            <FormulaireAction
              action={enregistrerLieu.bind(null, null)}
              libelleEnvoi="Ajouter"
              viderApresSucces
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Champ id="nom" libelle="Nom">
                  <Saisie id="nom" name="nom" maxLength={160} required />
                </Champ>
                <Champ id="type-lieu" libelle="Type">
                  <Liste id="type-lieu" name="type" defaultValue="PROFESSIONNEL">
                    {Object.entries(TYPES_STAGE).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Liste>
                </Champ>
                <Champ id="adresse" libelle="Adresse">
                  <Saisie id="adresse" name="adresse" maxLength={200} />
                </Champ>
                <Champ id="contact" libelle="Personne de contact">
                  <Saisie id="contact" name="contact" maxLength={120} />
                </Champ>
                <Champ id="telephone" libelle="Téléphone">
                  <Saisie id="telephone" name="telephone" type="tel" maxLength={30} />
                </Champ>
                <Champ id="email-lieu" libelle="Email">
                  <Saisie id="email-lieu" name="email" type="email" maxLength={160} />
                </Champ>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Case name="convention" /> Convention de stage signée
              </label>
            </FormulaireAction>
          </div>
        </details>
      </Panneau>
    </>
  );
}
