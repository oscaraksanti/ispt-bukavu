import { ArrowRight, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { exigerPermission } from "@/features/auth/acces";
import { ouvrirDeliberation } from "@/features/deliberations/actions";
import { periodesDe, reglementDeLAnnee } from "@/features/deliberations/donnees";
import { LIBELLES_STATUT, type StatutDeliberation } from "@/features/deliberations/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Délibérations" };

const TON: Record<StatutDeliberation, "neutre" | "attention" | "succes"> = {
  PREPARATION: "attention",
  CLOTUREE: "neutre",
  PROCLAMEE: "succes",
};

export default async function Deliberations({ searchParams }: PageProps<"/admin/deliberations">) {
  await exigerPermission("academique.notes.valider");
  const { annee: a } = await searchParams;
  const annees = await db.anneeAcademique.findMany({ orderBy: { debut: "desc" } });
  const annee = annees.find((x) => x.id === a) ?? annees.find((x) => x.courante) ?? annees[0];
  if (!annee)
    return <EtatVide titre="Aucune année académique" description="Créez d'abord une année." />;
  const [promotions, { defini }] = await Promise.all([
    db.promotion.findMany({
      where: { anneeId: annee.id },
      include: {
        filiere: true,
        niveau: true,
        deliberations: { include: { _count: { select: { resultats: true } } } },
        _count: { select: { inscriptions: true } },
      },
      orderBy: [{ niveau: { ordre: "asc" } }, { filiere: { ordre: "asc" } }],
    }),
    reglementDeLAnnee(annee.id),
  ]);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Délibérations" }]}
        titre="Délibérations"
        description="Calcul des résultats à partir des notes publiées, décisions du jury, procès-verbal, puis proclamation : chaque étudiant reçoit alors un bulletin vérifiable par QR code."
        actions={
          <Link
            href={`/admin/deliberations/reglement?annee=${annee.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm text-encre hover:border-encre"
          >
            <Settings2 aria-hidden className="size-4" /> Règlement {annee.libelle}
          </Link>
        }
      />

      <nav aria-label="Année académique" className="mt-6 flex flex-wrap gap-2">
        {annees.map((x) => (
          <Link
            key={x.id}
            href={`/admin/deliberations?annee=${x.id}`}
            aria-current={x.id === annee.id ? "page" : undefined}
            className={
              x.id === annee.id
                ? "rounded-full border border-encre bg-encre px-3 py-1 text-sm text-white"
                : "rounded-full border border-pierre-300 bg-white px-3 py-1 text-sm text-pierre-700 hover:border-encre"
            }
          >
            {x.libelle}
            {x.courante ? " · en cours" : ""}
          </Link>
        ))}
      </nav>

      {!defini && (
        <p className="mt-6 rounded-md border border-attention/30 bg-attention-fond px-4 py-3 text-sm text-attention">
          Le règlement {annee.libelle} n&apos;a pas encore été confirmé : les calculs utilisent les
          règles par défaut, reprises du fichier de délibération de l&apos;institut.{" "}
          <Link
            href={`/admin/deliberations/reglement?annee=${annee.id}`}
            className="font-medium underline"
          >
            Vérifier le règlement
          </Link>
        </p>
      )}

      {promotions.length === 0 ? (
        <div className="mt-8">
          <EtatVide titre="Aucune promotion pour cette année" />
        </div>
      ) : (
        <div
          className="mt-8 overflow-x-auto rounded-md border border-pierre-200 bg-white"
          tabIndex={0}
          role="region"
          aria-label="Délibérations par promotion"
        >
          <table className="w-full text-sm">
            <thead className="bg-pierre-50 text-left font-mono text-xs text-pierre-600 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Promotion
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Premier semestre
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Second semestre
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Année
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pierre-200">
              {promotions.map((p) => (
                <tr key={p.id}>
                  <th scope="row" className="px-5 py-4 text-left font-normal">
                    <span className="block font-medium text-encre">{libellePromotion(p)}</span>
                    <span className="text-xs text-pierre-600">
                      {p._count.inscriptions} étudiant(s)
                    </span>
                  </th>
                  {periodesDe(p.niveau.ordre).map((per) => {
                    const d = p.deliberations.find(
                      (x) => x.periode === per.periode && x.semestre === per.semestre,
                    );
                    const nom = per.periode === "ANNUELLE" ? "Année" : `Semestre ${per.semestre}`;
                    return (
                      <td key={`${per.periode}-${per.semestre}`} className="px-4 py-4 align-middle">
                        {d ? (
                          <Link
                            href={`/admin/deliberations/${d.id}`}
                            className="group inline-flex flex-col gap-1"
                          >
                            <span className="inline-flex items-center gap-1.5 font-medium text-ispt-600 group-hover:underline">
                              {nom} <ArrowRight aria-hidden className="size-3.5" />
                            </span>
                            <Etiquette ton={TON[d.statut]}>
                              {LIBELLES_STATUT[d.statut]} · {d._count.resultats}
                            </Etiquette>
                          </Link>
                        ) : (
                          <form
                            action={ouvrirDeliberation.bind(null, p.id, per.periode, per.semestre)}
                          >
                            <button
                              type="submit"
                              className="rounded-xs border border-dashed border-pierre-300 px-3 py-1.5 text-pierre-700 hover:border-encre hover:text-encre"
                            >
                              Préparer : {nom.toLowerCase()}
                            </button>
                          </form>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
