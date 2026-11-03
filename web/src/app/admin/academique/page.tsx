import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Saisie } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import {
  creerPromotions,
  definirAnneeCourante,
  enregistrerAnnee,
} from "@/features/academique/actions";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Années et promotions" };

export default async function Structure() {
  await exigerPermission("academique.structure");
  const annees = await db.anneeAcademique.findMany({ orderBy: { debut: "desc" } });
  const courante = annees.find((a) => a.courante) ?? null;
  const promotions = courante
    ? await db.promotion.findMany({
        where: { anneeId: courante.id },
        include: {
          filiere: true,
          niveau: true,
          _count: { select: { inscriptions: true, cours: true } },
        },
        orderBy: [{ filiere: { ordre: "asc" } }, { niveau: { ordre: "asc" } }],
      })
    : [];
  const parFiliere = Map.groupBy(promotions, (p) => p.filiere.nom);

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Années et promotions" },
        ]}
        titre="Années et promotions"
        description="Une promotion réunit les étudiants d'une filière et d'un niveau pour une année : elle porte leurs cours, leur horaire et les communiqués qui les concernent."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panneau titre="Années académiques" className="lg:col-span-3">
          <ul className="-my-3 divide-y divide-pierre-200">
            {annees.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="font-serif text-xl text-encre">{a.libelle}</span>
                {a.courante && <Etiquette ton="succes">Année courante</Etiquette>}
                <span className="text-sm text-pierre-600">
                  {formatJour.format(a.debut)} → {formatJour.format(a.fin)} · seuil{" "}
                  {a.seuilReussite.toString()}/20
                </span>
                <span className="flex-1" />
                {!a.courante && (
                  <BoutonAction
                    action={definirAnneeCourante.bind(null, a.id)}
                    confirmation="Changer d'année courante ?"
                  >
                    Définir comme courante
                  </BoutonAction>
                )}
              </li>
            ))}
          </ul>
        </Panneau>
        <Panneau titre="Nouvelle année" className="lg:col-span-2">
          <FormulaireAction
            action={enregistrerAnnee.bind(null, null)}
            libelleEnvoi="Créer l'année"
            viderApresSucces
          >
            <Champ id="libelle" libelle="Intitulé" obligatoire>
              <Saisie id="libelle" name="libelle" placeholder="2027-2028" required />
            </Champ>
            <div className="grid grid-cols-2 gap-3">
              <Champ id="debut" libelle="Début" obligatoire>
                <Saisie id="debut" name="debut" type="date" required />
              </Champ>
              <Champ id="fin" libelle="Fin" obligatoire>
                <Saisie id="fin" name="fin" type="date" required />
              </Champ>
            </div>
            <Champ id="seuil" libelle="Seuil de réussite (sur 20)">
              <Saisie id="seuil" name="seuil" inputMode="decimal" defaultValue="10" />
            </Champ>
          </FormulaireAction>
        </Panneau>
      </div>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl">Promotions {courante ? courante.libelle : ""}</h2>
            <p className="mt-1 text-sm text-pierre-600">
              Ouvrez chaque promotion pour lui attribuer ses cours et ses enseignants.
            </p>
          </div>
          {courante && (
            <BoutonAction
              action={creerPromotions.bind(null, courante.id)}
              variante="institutionnel"
              taille="md"
            >
              Créer les promotions de l&apos;année
            </BoutonAction>
          )}
        </div>
        {promotions.length === 0 ? (
          <div className="mt-6">
            <EtatVide
              titre="Aucune promotion pour l'année courante"
              description="Créez-les en un clic : une par filière ouverte et par niveau (BAC 1 à BAC 4)."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[...parFiliere.entries()].map(([filiere, liste]) => (
              <div key={filiere} className="rounded-md border border-pierre-200 bg-white">
                <h3 className="border-b border-pierre-200 px-5 py-3 font-sans text-base font-semibold text-encre">
                  {filiere}
                </h3>
                <ul className="divide-y divide-pierre-200">
                  {liste.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/academique/promotions/${p.id}`}
                        className="group flex items-center gap-4 px-5 py-3 hover:bg-pierre-50"
                      >
                        <span className="w-10 font-mono text-sm text-ispt-600">
                          {p.niveau.code}
                        </span>
                        <span className="flex-1 text-sm text-pierre-700">
                          {p._count.inscriptions} étudiant(s) · {p._count.cours} cours
                        </span>
                        <ArrowRight
                          aria-hidden
                          className="size-4 text-pierre-400 transition-transform group-hover:translate-x-0.5"
                        />
                        <span className="sr-only">
                          Ouvrir la promotion {p.niveau.code} {filiere}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
