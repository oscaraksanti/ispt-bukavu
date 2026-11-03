import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { LienBouton } from "@/components/ui/bouton";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { urlMedia } from "@/features/medias/url";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Actualités" };

export default async function Actualites() {
  await exigerPermission("actualites.gerer");
  const articles = await db.actualite.findMany({
    orderBy: [{ statut: "asc" }, { publieLe: "desc" }, { creeLe: "desc" }],
    include: { couverture: true, auteur: { select: { prenom: true, nom: true } } },
    take: 200,
  });
  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Actualités" }]}
        titre="Actualités"
        description="Rédigez en brouillon, relisez, puis publiez : l'article apparaît aussitôt sur le site et sur l'accueil."
        actions={
          <LienBouton href="/admin/actualites/nouvelle" variante="institutionnel">
            <Plus aria-hidden /> Nouvel article
          </LienBouton>
        }
      />
      {articles.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucun article"
            description="Le premier article publié fera apparaître la rubrique Actualités sur l'accueil."
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
          {articles.map((a) => (
            <li key={a.id} className="flex items-center gap-4 p-4">
              <div className="relative aspect-[3/2] w-24 shrink-0 overflow-hidden rounded-xs bg-pierre-100">
                {a.couverture && (
                  <Image
                    src={urlMedia(a.couverture.cle)}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/actualites/${a.id}`}
                  className="font-serif text-xl text-encre hover:text-ispt-600"
                >
                  {a.titre}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-pierre-600">
                  {a.statut === "PUBLIE" ? (
                    <Etiquette ton="succes">Publié</Etiquette>
                  ) : (
                    <Etiquette ton="attention">Brouillon</Etiquette>
                  )}
                  {a.publieLe && <span>{formatJour.format(a.publieLe)}</span>}
                  {a.auteur && (
                    <span className="text-pierre-500">
                      · {[a.auteur.prenom, a.auteur.nom].filter(Boolean).join(" ")}
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
