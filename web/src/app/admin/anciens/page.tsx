import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Saisie } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { publierAncien, refuserAncien, supprimerAncien } from "@/features/anciens/actions";
import { exigerPermission } from "@/features/auth/acces";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Anciens" };

const VUES = {
  EN_ATTENTE: "À vérifier",
  PUBLIE: "Publiés",
  REFUSE: "Refusés",
} as const;

export default async function AnciensAdmin({ searchParams }: PageProps<"/admin/anciens">) {
  await exigerPermission("contenu.modifier");
  const { vue: v } = await searchParams;
  const vue = typeof v === "string" && v in VUES ? (v as keyof typeof VUES) : "EN_ATTENTE";
  const [anciens, comptes] = await Promise.all([
    db.ancien.findMany({
      where: { statut: vue },
      include: { filiere: true },
      orderBy: vue === "EN_ATTENTE" ? { creeLe: "asc" } : [{ anneeSortie: "desc" }, { nom: "asc" }],
    }),
    db.ancien.groupBy({ by: ["statut"], _count: true }),
  ]);
  const compte = (s: string) => comptes.find((c) => c.statut === s)?._count ?? 0;

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Anciens" }]}
        titre="Annuaire des anciens"
        description="Les diplômés s'inscrivent eux-mêmes depuis le site. Vérifiez chaque demande (registres de l'institut) avant de la publier ; l'adresse email n'est jamais affichée."
      />
      <nav aria-label="État des inscriptions" className="mt-8 flex flex-wrap gap-2">
        {Object.entries(VUES).map(([cle, libelle]) => (
          <Link
            key={cle}
            href={`/admin/anciens?vue=${cle}`}
            aria-current={cle === vue ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              cle === vue
                ? "border-encre bg-encre text-white"
                : "border-pierre-300 bg-white text-pierre-700 hover:border-encre",
            )}
          >
            {libelle} <span className="font-mono text-xs opacity-85">{compte(cle)}</span>
          </Link>
        ))}
      </nav>
      <section className="mt-6">
        {anciens.length === 0 ? (
          <EtatVide titre="Rien à afficher" />
        ) : (
          <ul className="space-y-4">
            {anciens.map((a) => (
              <li key={a.id} className="rounded-md border border-pierre-200 bg-white p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-encre">
                      {[a.prenom, a.nom, a.postnom].filter(Boolean).join(" ")}
                    </p>
                    <p className="text-sm text-pierre-600">
                      {a.filiere?.nom ?? "Filière non précisée"} · sortie {a.anneeSortie} ·{" "}
                      {a.email}
                    </p>
                    {(a.poste || a.employeur || a.ville) && (
                      <p className="mt-2 text-sm text-pierre-800">
                        {[a.poste, a.employeur, a.ville].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {a.parcours && (
                      <p className="mt-2 text-sm whitespace-pre-line text-pierre-700">
                        {a.parcours}
                      </p>
                    )}
                    {a.lienProfessionnel && (
                      <p className="mt-2 text-sm break-all text-pierre-700">
                        {a.lienProfessionnel}
                      </p>
                    )}
                    {a.motifRefus && (
                      <p className="mt-2 text-sm text-erreur">Motif : {a.motifRefus}</p>
                    )}
                    <p className="mt-2 font-mono text-xs text-pierre-500">
                      Demande du {formatJour.format(a.creeLe)} · consentement du{" "}
                      {formatJour.format(a.consentementLe)}
                    </p>
                  </div>
                  <Etiquette
                    ton={
                      a.statut === "PUBLIE"
                        ? "succes"
                        : a.statut === "REFUSE"
                          ? "erreur"
                          : "attention"
                    }
                  >
                    {VUES[a.statut as keyof typeof VUES] ?? a.statut}
                  </Etiquette>
                </div>
                <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-pierre-200 pt-4">
                  {a.statut !== "PUBLIE" && (
                    <BoutonAction
                      action={publierAncien.bind(null, a.id)}
                      variante="institutionnel"
                      confirmation="Publier cette fiche ?"
                    >
                      Publier
                    </BoutonAction>
                  )}
                  {a.statut === "EN_ATTENTE" && (
                    <details>
                      <summary className="cursor-pointer text-sm text-ispt-700">Refuser</summary>
                      <div className="mt-3 w-80 max-w-full">
                        <FormulaireAction
                          action={refuserAncien.bind(null, a.id)}
                          libelleEnvoi="Refuser et prévenir"
                        >
                          <Champ id={`motif-${a.id}`} libelle="Motif communiqué">
                            <Saisie
                              id={`motif-${a.id}`}
                              name="motif"
                              maxLength={300}
                              placeholder="Diplôme introuvable dans nos registres…"
                            />
                          </Champ>
                        </FormulaireAction>
                      </div>
                    </details>
                  )}
                  <BoutonAction
                    action={supprimerAncien.bind(null, a.id)}
                    variante="fantome"
                    confirmation="Effacer définitivement ?"
                  >
                    Effacer
                  </BoutonAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
