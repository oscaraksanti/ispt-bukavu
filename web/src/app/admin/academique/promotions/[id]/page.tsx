import { X } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { LienBouton } from "@/components/ui/bouton";
import { Liste } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import {
  affecterEnseignant,
  ouvrirCoursPromotion,
  retirerEnseignant,
} from "@/features/academique/actions";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Promotion" };

export default async function Promotion({
  params,
}: PageProps<"/admin/academique/promotions/[id]">) {
  await exigerPermission("academique.structure");
  const { id } = await params;
  const p = await db.promotion.findUnique({
    where: { id },
    include: {
      filiere: true,
      niveau: true,
      annee: true,
      _count: { select: { inscriptions: true } },
      cours: {
        include: {
          cours: { include: { ue: true } },
          enseignants: { include: { enseignant: { include: { utilisateur: true } } } },
        },
        orderBy: [{ cours: { ue: { semestre: "asc" } } }, { cours: { intitule: "asc" } }],
      },
    },
  });
  if (!p) notFound();
  const enseignants = await db.profilEnseignant.findMany({
    where: { utilisateur: { statut: { not: "SUSPENDU" } } },
    include: { utilisateur: true },
    orderBy: { utilisateur: { nom: "asc" } },
  });
  const nomEns = (e: (typeof enseignants)[number]) =>
    [e.titre, e.utilisateur.prenom, e.utilisateur.nom].filter(Boolean).join(" ");
  const titre = `${p.niveau.libelle} · ${p.filiere.nom}`;

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Années et promotions", href: "/admin/academique" },
          { libelle: `${p.niveau.code} ${p.filiere.nomCourt}` },
        ]}
        titre={titre}
        description={`Année ${p.annee.libelle} · ${p._count.inscriptions} étudiant(s) inscrit(s)`}
        actions={
          <>
            <LienBouton href={`/admin/etudiants?promotion=${p.id}`} variante="contour">
              Étudiants
            </LienBouton>
            <BoutonAction
              action={ouvrirCoursPromotion.bind(null, p.id)}
              variante="institutionnel"
              taille="md"
            >
              Ouvrir les cours du programme
            </BoutonAction>
          </>
        }
      />

      {p.cours.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucun cours ouvert pour cette promotion"
            description="Saisissez le programme de la filière pour ce niveau, puis ouvrez ses cours ici en un clic."
            action={
              <LienBouton
                href={`/admin/academique/programme?filiere=${p.filiereId}&niveau=${p.niveauId}`}
                variante="contour"
                taille="sm"
              >
                Voir le programme
              </LienBouton>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
          {p.cours.map((co) => (
            <li key={co.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_22rem]">
              <div className="min-w-0">
                <p className="font-mono text-xs text-ispt-600">
                  {co.cours.ue.code} · S{co.cours.ue.semestre}
                </p>
                <p className="mt-1 font-medium text-encre">{co.cours.intitule}</p>
                <p className="text-sm text-pierre-600">
                  {co.cours.credits} crédit(s) · {co.cours.volumeHoraire} h
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {co.enseignants.length === 0 && (
                    <li>
                      <Etiquette ton="attention">Sans enseignant</Etiquette>
                    </li>
                  )}
                  {co.enseignants.map((ce) => (
                    <li
                      key={ce.enseignantId}
                      className="inline-flex items-center gap-1 rounded-xs bg-ispt-50 py-0.5 pr-1 pl-2 text-xs text-ispt-700"
                    >
                      {nomEns(ce.enseignant)}
                      {!ce.titulaire && <span className="text-pierre-500">(assistant)</span>}
                      <BoutonAction
                        action={retirerEnseignant.bind(null, co.id, ce.enseignantId)}
                        variante="fantome"
                        className="size-6 px-0"
                        libelleAccessible={`Retirer ${nomEns(ce.enseignant)}`}
                      >
                        <X aria-hidden />
                      </BoutonAction>
                    </li>
                  ))}
                </ul>
              </div>
              {enseignants.length > 0 ? (
                <FormulaireAction
                  action={affecterEnseignant.bind(null, co.id)}
                  libelleEnvoi="Affecter"
                  className="space-y-3 lg:border-l lg:border-pierre-200 lg:pl-5"
                >
                  <div className="grid grid-cols-[1fr_8rem] gap-2">
                    <Liste
                      name="enseignantId"
                      aria-label={`Enseignant pour ${co.cours.intitule}`}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Enseignant…
                      </option>
                      {enseignants.map((e) => (
                        <option key={e.id} value={e.id}>
                          {nomEns(e)}
                        </option>
                      ))}
                    </Liste>
                    <Liste name="titulaire" aria-label="Rôle" defaultValue="titulaire">
                      <option value="titulaire">Titulaire</option>
                      <option value="assistant">Assistant</option>
                    </Liste>
                  </div>
                </FormulaireAction>
              ) : (
                <p className="text-sm text-pierre-600 lg:border-l lg:border-pierre-200 lg:pl-5">
                  Aucun enseignant : invitez-les depuis « Comptes » avec le rôle Enseignant.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
