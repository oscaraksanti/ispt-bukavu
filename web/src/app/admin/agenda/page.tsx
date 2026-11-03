import type { Metadata } from "next";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Case, Champ, Saisie, ZoneTexte } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { enregistrerEvenement, supprimerEvenement } from "@/features/actualites/actions";
import { formatHeure, formatJour, versChampDate } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Agenda" };

type Evenement = {
  id: string;
  titre: string;
  description: string | null;
  lieu: string | null;
  debut: Date;
  fin: Date | null;
  statut: string;
};

function ChampsEvenement({ e, prefixe }: { e?: Evenement; prefixe: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Champ id={`${prefixe}-titre`} libelle="Titre" obligatoire className="md:col-span-2">
        <Saisie
          id={`${prefixe}-titre`}
          name="titre"
          required
          maxLength={160}
          defaultValue={e?.titre}
        />
      </Champ>
      <Champ id={`${prefixe}-debut`} libelle="Début (heure de Bukavu)" obligatoire>
        <Saisie
          id={`${prefixe}-debut`}
          name="debut"
          type="datetime-local"
          required
          defaultValue={versChampDate(e?.debut)}
        />
      </Champ>
      <Champ id={`${prefixe}-fin`} libelle="Fin (facultative)">
        <Saisie
          id={`${prefixe}-fin`}
          name="fin"
          type="datetime-local"
          defaultValue={versChampDate(e?.fin)}
        />
      </Champ>
      <Champ id={`${prefixe}-lieu`} libelle="Lieu" className="md:col-span-2">
        <Saisie id={`${prefixe}-lieu`} name="lieu" maxLength={160} defaultValue={e?.lieu ?? ""} />
      </Champ>
      <Champ id={`${prefixe}-description`} libelle="Description" className="md:col-span-2">
        <ZoneTexte
          id={`${prefixe}-description`}
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={e?.description ?? ""}
        />
      </Champ>
      <label className="flex items-center gap-2 text-sm text-pierre-800 md:col-span-2">
        <Case name="publie" defaultChecked={e ? e.statut === "PUBLIE" : true} />
        Affiché sur le site
      </label>
    </div>
  );
}

export default async function Agenda() {
  await exigerPermission("actualites.gerer");
  const maintenant = new Date();
  const evenements = await db.evenement.findMany({ orderBy: { debut: "desc" }, take: 100 });
  const aVenir = evenements.filter((e) => (e.fin ?? e.debut) >= maintenant).reverse();
  const passes = evenements.filter((e) => (e.fin ?? e.debut) < maintenant);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Agenda" }]}
        titre="Agenda"
        description="Rentrée, examens, collation, journées portes ouvertes : les événements à venir s'affichent sur la page Actualités."
      />
      <Panneau className="mt-8" titre="Ajouter un événement">
        <FormulaireAction
          action={enregistrerEvenement.bind(null, null)}
          libelleEnvoi="Ajouter à l'agenda"
          viderApresSucces
        >
          <ChampsEvenement prefixe="nouveau" />
        </FormulaireAction>
      </Panneau>

      {[
        { titre: "À venir", liste: aVenir },
        { titre: "Passés", liste: passes },
      ].map(
        (groupe) =>
          groupe.liste.length > 0 && (
            <section key={groupe.titre} className="mt-10">
              <h2 className="font-sans text-base font-semibold text-encre">{groupe.titre}</h2>
              <ul className="mt-4 space-y-3">
                {groupe.liste.map((e) => (
                  <li key={e.id} className="rounded-md border border-pierre-200 bg-white">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                        <span className="font-mono text-xs text-pierre-600">
                          {formatJour.format(e.debut)} · {formatHeure.format(e.debut)}
                        </span>
                        <span className="flex-1 font-medium text-encre">{e.titre}</span>
                        {e.statut !== "PUBLIE" && <Etiquette ton="neutre">Masqué</Etiquette>}
                        <span className="text-sm text-ispt-600 group-open:hidden">Modifier</span>
                      </summary>
                      <div className="border-t border-pierre-200 p-5">
                        <FormulaireAction
                          action={enregistrerEvenement.bind(null, e.id)}
                          libelleEnvoi="Enregistrer"
                        >
                          <ChampsEvenement e={e} prefixe={e.id} />
                        </FormulaireAction>
                        <div className="mt-4">
                          <BoutonAction
                            action={supprimerEvenement.bind(null, e.id)}
                            confirmation="Supprimer cet événement ?"
                            variante="fantome"
                            className="text-erreur hover:bg-erreur-fond"
                          >
                            Supprimer
                          </BoutonAction>
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
    </>
  );
}
