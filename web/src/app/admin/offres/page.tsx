import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ChampsOffre } from "@/components/offres/champs-offre";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { creerOffre } from "@/features/offres/actions";
import { TYPES_OFFRE } from "@/features/offres/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Offres d'insertion" };

const STATUTS = {
  BROUILLON: { texte: "Brouillon", ton: "neutre" },
  PUBLIEE: { texte: "Publiée", ton: "succes" },
  ARCHIVEE: { texte: "Retirée", ton: "attention" },
} as const;

export default async function OffresAdmin() {
  await exigerPermission("stages.gerer");
  const [offres, filieres] = await Promise.all([
    db.offreInsertion.findMany({ orderBy: [{ statut: "asc" }, { creeLe: "desc" }], take: 200 }),
    db.filiere.findMany({ orderBy: { ordre: "asc" }, select: { id: true, nom: true } }),
  ]);
  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Offres d'insertion" }]}
        titre="Offres d'insertion"
        description="Stages, emplois, bourses et formations relayés sur le site. À la publication, les étudiants des filières visées sont prévenus ; une offre disparaît d'elle-même après sa date limite."
      />
      <section className="mt-8">
        {offres.length === 0 ? (
          <EtatVide titre="Aucune offre" description="Créez la première offre ci-dessous." />
        ) : (
          <ul className="divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
            {offres.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/offres/${o.id}`}
                  className="group flex flex-col gap-2 p-4 hover:bg-pierre-50 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-encre">{o.titre}</p>
                    <p className="text-sm text-pierre-600">
                      {TYPES_OFFRE[o.type]} · {o.organisation}
                      {o.dateLimite ? ` · jusqu'au ${formatJour.format(o.dateLimite)}` : ""}
                    </p>
                  </div>
                  <Etiquette ton={STATUTS[o.statut].ton}>{STATUTS[o.statut].texte}</Etiquette>
                  <ArrowRight aria-hidden className="hidden size-4 text-pierre-500 sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Panneau
        className="mt-8"
        titre="Nouvelle offre"
        description="Créée en brouillon : relisez-la, puis publiez-la."
      >
        <FormulaireAction action={creerOffre} libelleEnvoi="Créer l'offre">
          <ChampsOffre filieres={filieres} />
        </FormulaireAction>
      </Panneau>
    </>
  );
}
