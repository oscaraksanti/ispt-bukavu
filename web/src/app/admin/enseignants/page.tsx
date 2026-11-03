import type { Metadata } from "next";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { LienBouton } from "@/components/ui/bouton";
import { Champ, Saisie } from "@/components/ui/champs";
import { EtatVide } from "@/components/ui/elements";
import { enregistrerProfilEnseignant } from "@/features/academique/actions";
import { libellePromotion } from "@/features/academique/regles";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Enseignants" };

export default async function Enseignants() {
  await exigerPermission("academique.structure");
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  const enseignants = await db.profilEnseignant.findMany({
    include: {
      utilisateur: true,
      cours: {
        where: annee ? { coursOffert: { promotion: { anneeId: annee.id } } } : undefined,
        include: {
          coursOffert: {
            include: { cours: true, promotion: { include: { filiere: true, niveau: true } } },
          },
        },
      },
    },
    orderBy: { utilisateur: { nom: "asc" } },
  });

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Enseignants" }]}
        titre="Enseignants"
        description="Corps enseignant et cours confiés pour l'année courante. Les comptes se créent depuis « Comptes » avec le rôle Enseignant."
        actions={
          <LienBouton href="/admin/utilisateurs" variante="institutionnel">
            Inviter un enseignant
          </LienBouton>
        }
      />
      {enseignants.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucun enseignant"
            description="Invitez les enseignants avec le rôle Enseignant ; ils apparaîtront ici."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {enseignants.map((e) => {
            const u = e.utilisateur;
            return (
              <li key={e.id} className="rounded-md border border-pierre-200 bg-white">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">
                      <span className="block font-medium text-encre">
                        {[e.titre, u.prenom, u.nom, u.postnom].filter(Boolean).join(" ")}
                      </span>
                      <span className="block text-sm text-pierre-600">
                        {e.domaine ?? "Domaine à préciser"}
                      </span>
                    </span>
                    <span className="text-sm text-pierre-600">
                      {e.cours.length} cours cette année
                    </span>
                  </summary>
                  <div className="grid gap-6 border-t border-pierre-200 p-5 md:grid-cols-2">
                    <div>
                      <h3 className="font-sans text-sm font-semibold text-encre">Cours confiés</h3>
                      {e.cours.length === 0 ? (
                        <p className="mt-2 text-sm text-pierre-600">
                          Aucun cours pour l&apos;année courante.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5 text-sm">
                          {e.cours.map((c) => (
                            <li key={c.coursOffertId} className="text-pierre-800">
                              {c.coursOffert.cours.intitule}{" "}
                              <span className="text-pierre-500">
                                · {libellePromotion(c.coursOffert.promotion)}
                                {!c.titulaire && " (assistant)"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <FormulaireAction
                      action={enregistrerProfilEnseignant.bind(null, u.id)}
                      libelleEnvoi="Enregistrer"
                    >
                      <div className="grid grid-cols-[8rem_1fr] gap-3">
                        <Champ id={`titre-${e.id}`} libelle="Titre">
                          <Saisie
                            id={`titre-${e.id}`}
                            name="titre"
                            defaultValue={e.titre ?? ""}
                            placeholder="Prof., CT, Ass."
                            maxLength={40}
                          />
                        </Champ>
                        <Champ id={`domaine-${e.id}`} libelle="Domaine d'enseignement">
                          <Saisie
                            id={`domaine-${e.id}`}
                            name="domaine"
                            defaultValue={e.domaine ?? ""}
                            maxLength={160}
                          />
                        </Champ>
                      </div>
                    </FormulaireAction>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
