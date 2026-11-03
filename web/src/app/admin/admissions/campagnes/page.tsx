import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { LienBouton } from "@/components/ui/bouton";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { changerStatutCampagne } from "@/features/admissions/actions-admin";
import { campagneOuverte } from "@/features/admissions/regles";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Campagnes d'admission" };

export default async function Campagnes() {
  await exigerPermission("admissions.campagnes");
  const campagnes = await db.campagneAdmission.findMany({
    orderBy: { ouverture: "desc" },
    include: { annee: true, _count: { select: { candidatures: true } } },
  });
  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Campagnes" }]}
        titre="Campagnes d'admission"
        description="Une campagne fixe la période de dépôt, les filières ouvertes, les frais et les pièces demandées. Publiée, elle ouvre le dépôt en ligne sur le site."
        actions={
          <LienBouton href="/admin/admissions/campagnes/nouvelle" variante="institutionnel">
            <Plus aria-hidden /> Nouvelle campagne
          </LienBouton>
        }
      />
      {campagnes.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucune campagne"
            description="Créez la campagne de la prochaine rentrée."
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
          {campagnes.map((c) => {
            const enCours = campagneOuverte(c);
            return (
              <li key={c.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/admissions/campagnes/${c.id}`}
                    className="font-serif text-xl text-encre hover:text-ispt-600"
                  >
                    {c.libelle}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-pierre-600">
                    {c.statut === "OUVERTE" ? (
                      <Etiquette ton={enCours ? "succes" : "attention"}>
                        {enCours ? "Dépôt ouvert" : "Publiée, hors période"}
                      </Etiquette>
                    ) : c.statut === "FERMEE" ? (
                      <Etiquette ton="neutre">Fermée</Etiquette>
                    ) : (
                      <Etiquette ton="attention">Brouillon</Etiquette>
                    )}
                    <span>
                      {formatJour.format(c.ouverture)} → {formatJour.format(c.cloture)}
                    </span>
                    <span className="text-pierre-500">· {c._count.candidatures} dossier(s)</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {c.statut === "OUVERTE" ? (
                    <BoutonAction
                      action={changerStatutCampagne.bind(null, c.id, "FERMEE")}
                      confirmation="Fermer le dépôt ?"
                    >
                      Fermer
                    </BoutonAction>
                  ) : (
                    <BoutonAction
                      action={changerStatutCampagne.bind(null, c.id, "OUVERTE")}
                      variante="institutionnel"
                    >
                      Publier
                    </BoutonAction>
                  )}
                  <LienBouton
                    href={`/admin/admissions?campagne=${c.id}`}
                    variante="contour"
                    taille="sm"
                  >
                    Dossiers
                  </LienBouton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
