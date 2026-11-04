import { ArrowRight, ImageOff } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ChampsAlbum } from "@/components/galerie/champs-album";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { creerAlbum } from "@/features/galerie/actions";
import { urlMedia } from "@/features/medias/url";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Galerie" };

export default async function Galerie() {
  await exigerPermission("medias.gerer");
  const albums = await db.album.findMany({
    orderBy: [{ date: { sort: "desc", nulls: "last" } }, { titre: "asc" }],
    include: {
      medias: { orderBy: { ordre: "asc" }, take: 1, include: { media: true } },
      _count: { select: { medias: true } },
    },
  });
  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Galerie" }]}
        titre="Galerie"
        description="Albums photo du site public. Les photos viennent de la médiathèque ; un album n'est visible qu'une fois publié."
      />
      <section className="mt-8">
        {albums.length === 0 ? (
          <EtatVide titre="Aucun album" description="Créez le premier album ci-dessous." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/galerie/${a.id}`}
                  className="group block overflow-hidden rounded-md border border-pierre-200 bg-white hover:border-encre"
                >
                  <span className="relative block aspect-[16/10] bg-pierre-100">
                    {a.medias[0] ? (
                      <Image
                        src={urlMedia(a.medias[0].media.cle)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, 90vw"
                        className="object-cover"
                      />
                    ) : (
                      <ImageOff
                        aria-hidden
                        className="absolute inset-0 m-auto size-6 text-pierre-400"
                      />
                    )}
                  </span>
                  <span className="flex items-start gap-3 p-4">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-encre">{a.titre}</span>
                      <span className="block text-sm text-pierre-600">
                        {a._count.medias} photo{a._count.medias > 1 ? "s" : ""}
                        {a.date ? ` · ${formatJour.format(a.date)}` : ""}
                      </span>
                    </span>
                    <Etiquette ton={a.publie ? "succes" : "neutre"}>
                      {a.publie ? "Publié" : "Brouillon"}
                    </Etiquette>
                    <ArrowRight aria-hidden className="mt-1 size-4 text-pierre-500" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Panneau className="mt-8" titre="Nouvel album">
        <FormulaireAction action={creerAlbum} libelleEnvoi="Créer l'album">
          <ChampsAlbum />
        </FormulaireAction>
      </Panneau>
    </>
  );
}
