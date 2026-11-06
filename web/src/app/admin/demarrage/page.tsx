import { ArrowRight, Check, CircleDashed, CircleDot, FileDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { Etiquette } from "@/components/ui/elements";
import { exigerPersonnel } from "@/features/auth/acces";
import { avancement, construireEtapes, type StatutEtape } from "@/features/demarrage/regles";
import { lireEtatPlateforme } from "@/features/demarrage/requetes";
import { PERMISSIONS } from "@/lib/permissions";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Mise en service" };

const STATUTS: Record<StatutEtape, { texte: string; ton: "succes" | "attention" | "neutre" }> = {
  fait: { texte: "Fait", ton: "succes" },
  partiel: { texte: "En cours", ton: "attention" },
  a_faire: { texte: "À faire", ton: "neutre" },
};

function IconeStatut({ statut }: { statut: StatutEtape }) {
  if (statut === "fait")
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-succes text-white">
        <Check aria-hidden className="size-4" />
      </span>
    );
  const Icone = statut === "partiel" ? CircleDot : CircleDashed;
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${statut === "partiel" ? "border-attention text-attention" : "border-pierre-300 text-pierre-500"}`}
    >
      <Icone aria-hidden className="size-4" />
    </span>
  );
}

export default async function MiseEnService() {
  const u = await exigerPersonnel();
  const groupes = construireEtapes(await lireEtatPlateforme());
  const { faites, total, pourcentage } = avancement(groupes);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Mise en service" }]}
        titre="Mise en service"
        description="Ce qui reste à saisir pour que chacun puisse utiliser la plateforme. La liste se met à jour d'elle-même : chaque étape renvoie à l'écran où compléter l'information."
        actions={
          <a
            href="/guides/Guide-creation-des-comptes.pdf"
            download
            className="inline-flex h-10 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm font-medium text-encre hover:border-encre"
          >
            <FileDown aria-hidden className="size-4" />
            Guide de création des comptes (PDF)
          </a>
        }
      />

      <section
        aria-label="Avancement"
        className="mt-8 rounded-md border border-pierre-200 bg-white p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-serif text-4xl text-encre">{pourcentage} %</p>
          <p className="text-sm text-pierre-600">
            {faites} étape{faites > 1 ? "s" : ""} terminée{faites > 1 ? "s" : ""} sur {total}
          </p>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-pierre-100"
          role="progressbar"
          aria-label="Avancement de la mise en service"
          aria-valuenow={pourcentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-ispt-600" style={{ width: `${pourcentage}%` }} />
        </div>
        <p className="mt-4 text-sm text-pierre-600">
          Les étapes marquées <Etiquette ton="ispt">Donnée de l&apos;institut</Etiquette> attendent
          une information officielle : rien n&apos;y est inventé. Dès qu&apos;elle est connue,
          l&apos;appariteur ou l&apos;administrateur concerné la saisit à l&apos;écran indiqué.
        </p>
      </section>

      <div className="mt-8 space-y-8">
        {groupes.map((g, n) => (
          <section key={g.titre} aria-labelledby={`groupe-${n}`}>
            <h2 id={`groupe-${n}`} className="text-2xl">
              {g.titre}
            </h2>
            <ol className="mt-3 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
              {g.etapes.map((e) => {
                const autorise = !e.permission || u.permissions.has(e.permission);
                return (
                  <li key={e.cle} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <IconeStatut statut={e.statut} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans text-base font-semibold text-encre">{e.titre}</h3>
                        <Etiquette ton={STATUTS[e.statut].ton}>{STATUTS[e.statut].texte}</Etiquette>
                        {e.institut && e.statut !== "fait" && (
                          <Etiquette ton="ispt">Donnée de l&apos;institut</Etiquette>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-pierre-700">{e.detail}</p>
                    </div>
                    {autorise ? (
                      <Link
                        href={e.lien}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-xs border border-pierre-300 px-3 text-sm font-medium text-encre hover:border-encre"
                      >
                        {e.statut === "fait" ? "Consulter" : "Compléter"}
                        <span className="sr-only"> : {e.titre}</span>
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    ) : (
                      <p className="shrink-0 self-start text-xs text-pierre-600 sm:max-w-48 sm:text-right">
                        Réservé à : {PERMISSIONS[e.permission!].libelle.toLowerCase()}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
