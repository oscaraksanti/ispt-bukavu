import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { CelluleHoraire } from "@/components/horaires/cellule-horaire";
import { Blason } from "@/components/marque/blason";
import { Liste } from "@/components/ui/champs";
import { EtatVide } from "@/components/ui/elements";
import { semestresDuNiveau } from "@/features/academique/regles";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { copierSemainePrecedente, definirCreneau } from "@/features/horaires/actions";
import {
  ajouterJours,
  aujourdhuiBukavu,
  JOURS,
  libelleJour,
  libelleSemaine,
  libelleSemestre,
  lundiDe,
  PLAGES,
  situerSeance,
} from "@/features/horaires/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Horaires" };

export default async function Horaires({ searchParams }: PageProps<"/admin/horaires">) {
  await exigerPermission("academique.horaires");
  const { niveau: n, semaine: sm, semestre: se } = await searchParams;
  const [niveaux, annee, institut] = await Promise.all([
    db.niveau.findMany({ orderBy: { ordre: "asc" } }),
    db.anneeAcademique.findFirst({ where: { courante: true } }),
    lireInstitut(),
  ]);
  const niveau = niveaux.find((x) => x.id === n) ?? niveaux[0];
  const lundi =
    lundiDe(typeof sm === "string" ? sm : aujourdhuiBukavu()) ?? lundiDe(aujourdhuiBukavu())!;
  const semestres = niveau ? semestresDuNiveau(niveau.ordre) : [1];
  const semestre = semestres.includes(Number(se)) ? Number(se) : semestres[0];

  const promotions =
    annee && niveau
      ? await db.promotion.findMany({
          where: { anneeId: annee.id, niveauId: niveau.id },
          include: {
            filiere: true,
            cours: {
              where: { cours: { ue: { semestre } } },
              include: { cours: true },
              orderBy: { cours: { intitule: "asc" } },
            },
          },
          orderBy: { filiere: { ordre: "asc" } },
        })
      : [];
  const seances = await db.seance.findMany({
    where: {
      debut: {
        gte: new Date(`${lundi}T00:00:00+02:00`),
        lt: new Date(`${ajouterJours(lundi, 7)}T00:00:00+02:00`),
      },
      coursOffert: { promotionId: { in: promotions.map((p) => p.id) } },
    },
    include: { coursOffert: true },
  });
  const jours = JOURS.map((_, i) => ajouterJours(lundi, i));
  const lien = (params: Record<string, string>) =>
    `/admin/horaires?${new URLSearchParams({ niveau: niveau?.id ?? "", semaine: lundi, semestre: String(semestre), ...params })}`;

  return (
    <>
      <div className="print:hidden">
        <EnteteAdmin
          ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Horaires" }]}
          titre="Horaires"
          description="Horaire de la semaine par niveau, comme le document affiché aux valves : une ligne par promotion, deux plages par jour. Cliquez sur une case pour y placer un cours."
          actions={<BoutonImprimer />}
        />
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <nav aria-label="Niveau" className="flex flex-wrap gap-2">
            {niveaux.map((x) => (
              <Link
                key={x.id}
                href={`/admin/horaires?niveau=${x.id}&semaine=${lundi}`}
                aria-current={x.id === niveau?.id ? "page" : undefined}
                className={
                  x.id === niveau?.id
                    ? "rounded-full border border-encre bg-encre px-3 py-1 text-sm text-white"
                    : "rounded-full border border-pierre-300 bg-white px-3 py-1 text-sm text-pierre-700 hover:border-encre"
                }
              >
                {x.libelle}
              </Link>
            ))}
          </nav>
          <form className="ml-auto flex items-end gap-2">
            <input type="hidden" name="niveau" value={niveau?.id ?? ""} />
            <input type="hidden" name="semaine" value={lundi} />
            <Liste
              name="semestre"
              defaultValue={String(semestre)}
              aria-label="Semestre"
              className="h-9 w-40"
            >
              {semestres.map((s) => (
                <option key={s} value={s}>
                  {libelleSemestre(s)}
                </option>
              ))}
            </Liste>
            <button type="submit" className="h-9 rounded-xs bg-encre px-3 text-sm text-white">
              Afficher
            </button>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={lien({ semaine: ajouterJours(lundi, -7) })}
              className="inline-flex size-9 items-center justify-center rounded-xs border border-pierre-300 bg-white hover:border-encre"
            >
              <ChevronLeft aria-hidden className="size-4" />
              <span className="sr-only">Semaine précédente</span>
            </Link>
            <p className="font-medium text-encre">Semaine {libelleSemaine(lundi)}</p>
            <Link
              href={lien({ semaine: ajouterJours(lundi, 7) })}
              className="inline-flex size-9 items-center justify-center rounded-xs border border-pierre-300 bg-white hover:border-encre"
            >
              <ChevronRight aria-hidden className="size-4" />
              <span className="sr-only">Semaine suivante</span>
            </Link>
          </div>
          {niveau && promotions.length > 0 && (
            <BoutonAction
              action={copierSemainePrecedente.bind(null, niveau.id, lundi)}
              confirmation="Reprendre la semaine précédente dans les cases vides ?"
            >
              Reprendre la semaine précédente
            </BoutonAction>
          )}
        </div>
      </div>

      {promotions.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucune promotion à ce niveau"
            description="Créez les promotions de l'année et ouvrez leurs cours."
          />
        </div>
      ) : (
        <div className="horaire-imprimable mt-6">
          {/* En-tête du document affiché aux valves, visible à l'impression */}
          <div className="hidden items-center gap-6 pb-4 print:flex">
            <Blason hauteur={84} decoratif />
            <div className="flex-1 text-center leading-tight">
              <p className="font-sans text-base font-bold uppercase">
                Enseignement supérieur et universitaire
              </p>
              <p className="font-sans text-base font-bold">{institut.nom}</p>
              <p className="font-sans text-sm font-bold">{institut.sigle.toUpperCase()}</p>
              {institut.boitePostale && (
                <p className="font-sans text-sm font-bold">{institut.boitePostale.toUpperCase()}</p>
              )}
              <p className="mt-1 font-sans text-sm font-bold uppercase underline">
                Horaire de la semaine {libelleSemaine(lundi)} / {libelleSemestre(semestre)}{" "}
                {annee?.libelle}
              </p>
            </div>
          </div>
          <div
            className="overflow-x-auto rounded-md border border-pierre-300 bg-white print:overflow-visible print:rounded-none print:border-black"
            tabIndex={0}
            role="region"
            aria-label="Horaire de la semaine"
          >
            <table className="w-full min-w-[60rem] border-collapse text-sm print:min-w-0 print:text-[11px]">
              <thead>
                <tr className="bg-pierre-50 print:bg-white">
                  <th
                    scope="col"
                    className="border border-pierre-200 px-2 py-2 font-semibold print:border-black"
                  >
                    Promotion
                  </th>
                  <th
                    scope="col"
                    className="border border-pierre-200 px-2 py-2 font-semibold print:border-black"
                  >
                    Heure
                  </th>
                  {jours.map((j) => (
                    <th
                      key={j}
                      scope="col"
                      className="border border-pierre-200 px-2 py-2 font-semibold first-letter:uppercase print:border-black"
                    >
                      {libelleJour(j)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {promotions.flatMap((p) =>
                  PLAGES.map((plage, k) => (
                    <tr key={`${p.id}-${plage.cle}`}>
                      {k === 0 && (
                        <th
                          scope="rowgroup"
                          rowSpan={PLAGES.length}
                          className="w-36 border border-pierre-200 px-2 py-2 text-center font-semibold print:border-black"
                        >
                          {niveau?.code}
                          <span className="block font-normal">{p.filiere.nomCourt}</span>
                        </th>
                      )}
                      <td className="w-16 border border-pierre-200 px-2 text-center font-mono text-xs print:border-black">
                        {plage.libelle}
                      </td>
                      {jours.map((jour) => {
                        const s = seances.find((x) => {
                          const pos = situerSeance(x.debut);
                          return (
                            x.coursOffert.promotionId === p.id &&
                            pos.jour === jour &&
                            pos.plage === plage.cle
                          );
                        });
                        return (
                          <td
                            key={jour}
                            className="border border-pierre-200 p-0 align-middle print:border-black"
                          >
                            <CelluleHoraire
                              action={definirCreneau.bind(null, p.id, jour, plage.cle)}
                              cours={p.cours.map((c) => ({ id: c.id, intitule: c.cours.intitule }))}
                              coursActuel={s?.coursOffertId ?? null}
                              salleActuelle={s?.salle ?? null}
                              statut={s?.statut ?? null}
                              libelle={`${niveau?.code} ${p.filiere.nomCourt}, ${libelleJour(jour)} ${plage.libelle}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-6 hidden text-center text-sm print:block">
            Fait à {institut.ville}, le {formatJour.format(new Date())}
          </p>
          {promotions.some((p) => p.cours.length === 0) && (
            <p className="mt-3 text-sm text-attention print:hidden">
              Certaines promotions n&apos;ont aucun cours ouvert pour ce semestre : ouvrez leurs
              cours dans « Années et promotions ».
            </p>
          )}
        </div>
      )}
    </>
  );
}
