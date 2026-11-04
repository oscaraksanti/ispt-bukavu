import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { EnteteCours } from "@/components/cours/entete-cours";
import { Case, Champ, Saisie, ZoneTexte } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { formatHeure, formatJour, versChampDate } from "@/features/actualites/dates";
import { coursDeLEnseignant } from "@/features/devoirs/acces";
import { creerDevoir } from "@/features/devoirs/actions";
import { devoirsDuCours } from "@/features/devoirs/requetes";
import { exigerEnseignant } from "@/features/espaces/acces";
import { etudiantsDuCours } from "@/features/notes/acces";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Devoirs" };

export default async function DevoirsEnseignant({
  params,
}: PageProps<"/enseignant/cours/[id]/devoirs">) {
  const { u } = await exigerEnseignant();
  const { id } = await params;
  const co = await coursDeLEnseignant(u, id);
  if (!co) notFound();
  const [devoirs, etudiants] = await Promise.all([devoirsDuCours(id), etudiantsDuCours(id)]);
  const maintenant = new Date();
  // Échéance proposée : dans une semaine, à 23 h 59.
  const dans7 = versChampDate(new Date(maintenant.getTime() + 7 * 86_400_000)).slice(0, 10);

  return (
    <div className="space-y-8">
      <EnteteCours
        coursOffertId={id}
        code={`${co.cours.ue.code} · S${co.cours.ue.semestre}`}
        intitule={co.cours.intitule}
        promotion={`${libellePromotion(co.promotion)} · ${etudiants.length} étudiant(s)`}
        actif="devoirs"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <section aria-labelledby="titre-devoirs">
          <h2 id="titre-devoirs" className="sr-only">
            Devoirs du cours
          </h2>
          {devoirs.length === 0 ? (
            <EtatVide
              titre="Aucun devoir pour le moment"
              description="Les devoirs sont des travaux formatifs : ils ne s'ajoutent pas aux notes officielles du bulletin."
            />
          ) : (
            <ul className="divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
              {devoirs.map((d) => {
                const ouvert = d.echeance > maintenant;
                return (
                  <li key={d.id}>
                    <Link
                      href={`/enseignant/cours/${id}/devoirs/${d.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-pierre-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-encre">{d.titre}</span>
                        <span className="mt-0.5 block text-sm text-pierre-600">
                          Échéance : {formatJour.format(d.echeance)} à{" "}
                          {formatHeure.format(d.echeance)}
                        </span>
                      </span>
                      <span className="font-mono text-sm text-pierre-700">
                        {d._count.remises}/{etudiants.length} copie(s) · {d.remises.length}{" "}
                        corrigée(s)
                      </span>
                      <Etiquette ton={ouvert ? "succes" : "neutre"}>
                        {ouvert ? "En cours" : "Clos"}
                      </Etiquette>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Panneau titre="Nouveau devoir" description="Les étudiants du cours sont prévenus.">
          <FormulaireAction action={creerDevoir.bind(null, id)} libelleEnvoi="Publier le devoir">
            <Champ id="titre" libelle="Titre" obligatoire>
              <Saisie id="titre" name="titre" maxLength={160} required />
            </Champ>
            <Champ id="consignes" libelle="Consignes" obligatoire>
              <ZoneTexte id="consignes" name="consignes" rows={6} maxLength={5000} required />
            </Champ>
            <Champ id="echeance" libelle="À rendre au plus tard le" obligatoire>
              <Saisie
                id="echeance"
                name="echeance"
                type="datetime-local"
                defaultValue={`${dans7}T23:59`}
                required
              />
            </Champ>
            <label className="flex items-center gap-2.5 text-sm text-pierre-800">
              <Case name="accepteRetard" />
              Accepter les copies en retard (signalées comme telles)
            </label>
            <Champ
              id="enonce"
              libelle="Énoncé (facultatif)"
              aide="PDF, image, Word, PowerPoint ou Excel ; 4 Mo au plus."
            >
              <input
                id="enonce"
                name="enonce"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx,.xlsx"
                className="block w-full text-sm file:mr-3 file:rounded-xs file:border file:border-pierre-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
                aria-describedby="enonce-aide"
              />
            </Champ>
          </FormulaireAction>
        </Panneau>
      </div>
    </div>
  );
}
