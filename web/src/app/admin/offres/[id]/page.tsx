import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ChampsOffre } from "@/components/offres/champs-offre";
import { Etiquette } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import {
  archiverOffre,
  modifierOffre,
  publierOffre,
  supprimerOffre,
} from "@/features/offres/actions";
import { TYPES_OFFRE } from "@/features/offres/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Offre d'insertion" };

export default async function OffreAdmin({ params }: PageProps<"/admin/offres/[id]">) {
  await exigerPermission("stages.gerer");
  const { id } = await params;
  const [o, filieres] = await Promise.all([
    db.offreInsertion.findUnique({ where: { id }, include: { filieres: true } }),
    db.filiere.findMany({ orderBy: { ordre: "asc" }, select: { id: true, nom: true } }),
  ]);
  if (!o) notFound();
  const publiee = o.statut === "PUBLIEE";
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Offres d'insertion", href: "/admin/offres" },
          { libelle: o.titre },
        ]}
        titre={o.titre}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Etiquette ton={publiee ? "succes" : o.statut === "ARCHIVEE" ? "attention" : "neutre"}>
              {publiee ? "Publiée" : o.statut === "ARCHIVEE" ? "Retirée" : "Brouillon"}
            </Etiquette>
            {TYPES_OFFRE[o.type]} · {o.organisation}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-start gap-2">
            {publiee && (
              <a
                href={`/offres/${o.id}`}
                target="_blank"
                rel="noopener"
                className="inline-flex h-9 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm font-medium text-encre hover:border-encre"
              >
                <ArrowUpRight aria-hidden className="size-4" /> Voir sur le site
              </a>
            )}
            {publiee ? (
              <BoutonAction
                action={archiverOffre.bind(null, o.id)}
                confirmation="Retirer du site ?"
              >
                Retirer du site
              </BoutonAction>
            ) : (
              <BoutonAction
                action={publierOffre.bind(null, o.id)}
                variante="institutionnel"
                confirmation="Publier et prévenir les étudiants ?"
              >
                Publier
              </BoutonAction>
            )}
          </div>
        }
      />
      <Panneau className="mt-8" titre="Offre">
        <FormulaireAction action={modifierOffre.bind(null, o.id)} libelleEnvoi="Enregistrer">
          <ChampsOffre filieres={filieres} offre={o} />
        </FormulaireAction>
        {!publiee && (
          <div className="mt-6 border-t border-pierre-200 pt-4">
            <BoutonAction
              action={supprimerOffre.bind(null, o.id)}
              variante="danger"
              confirmation="Supprimer définitivement ?"
            >
              Supprimer l&apos;offre
            </BoutonAction>
          </div>
        )}
      </Panneau>
    </>
  );
}
