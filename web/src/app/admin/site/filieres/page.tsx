import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { LienBouton } from "@/components/ui/bouton";
import { Etiquette } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import { deplacerFiliere, publierFiliere } from "@/features/contenu/actions-collections";
import { urlMedia } from "@/features/medias/url";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Filières" };

export default async function Filieres() {
  await exigerPermission("contenu.modifier");
  const filieres = await db.filiere.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    include: { photo: true },
  });

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Filières" }]}
        titre="Filières"
        description="Les filières publiées apparaissent sur l'accueil, la page Formations, le pied de page et les admissions, dans l'ordre ci-dessous."
        actions={
          <LienBouton href="/admin/site/filieres/nouvelle" variante="institutionnel">
            <Plus aria-hidden /> Nouvelle filière
          </LienBouton>
        }
      />
      <ol className="mt-8 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
        {filieres.map((f) => (
          <li key={f.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xs bg-pierre-100">
                {f.photo && (
                  <Image
                    src={urlMedia(f.photo.cle)}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/site/filieres/${f.id}`}
                  className="font-serif text-xl text-encre hover:text-ispt-600"
                >
                  {f.nom}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-pierre-600">
                  {f.ouverte ? (
                    <Etiquette ton="succes">Publiée</Etiquette>
                  ) : (
                    <Etiquette ton="neutre">Masquée</Etiquette>
                  )}
                  <span className="font-mono text-xs">/formations/{f.slug}</span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1">
              <BoutonAction
                action={deplacerFiliere.bind(null, f.id, -1)}
                variante="fantome"
                className="size-8 px-0"
                libelleAccessible={`Monter ${f.nom}`}
              >
                <ArrowUp aria-hidden />
              </BoutonAction>
              <BoutonAction
                action={deplacerFiliere.bind(null, f.id, 1)}
                variante="fantome"
                className="size-8 px-0"
                libelleAccessible={`Descendre ${f.nom}`}
              >
                <ArrowDown aria-hidden />
              </BoutonAction>
              <BoutonAction action={publierFiliere.bind(null, f.id, !f.ouverte)}>
                {f.ouverte ? "Masquer" : "Publier"}
              </BoutonAction>
              <LienBouton href={`/admin/site/filieres/${f.id}`} variante="contour" taille="sm">
                Modifier<span className="sr-only"> {f.nom}</span>
              </LienBouton>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
