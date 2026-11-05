import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ChampsAlbum } from "@/components/galerie/champs-album";
import { ChoixPhotos } from "@/components/galerie/choix-photos";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import {
  ajouterPhotos,
  changerPublicationAlbum,
  deplacerPhoto,
  modifierAlbum,
  retirerPhoto,
  supprimerAlbum,
} from "@/features/galerie/actions";
import { mediasPourSelecteur } from "@/features/medias/requetes";
import { urlMedia } from "@/features/medias/url";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Album" };

export default async function Album({ params }: PageProps<"/admin/galerie/[id]">) {
  await exigerPermission("medias.gerer");
  const { id } = await params;
  const [album, medias] = await Promise.all([
    db.album.findUnique({
      where: { id },
      include: { medias: { orderBy: { ordre: "asc" }, include: { media: true } } },
    }),
    mediasPourSelecteur(),
  ]);
  if (!album) notFound();
  const sansDescription = album.medias.filter((m) => !m.media.texteAlternatif.trim()).length;

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Galerie", href: "/admin/galerie" },
          { libelle: album.titre },
        ]}
        titre={album.titre}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Etiquette ton={album.publie ? "succes" : "neutre"}>
              {album.publie ? "Publié" : "Brouillon"}
            </Etiquette>
            {album.medias.length} photo{album.medias.length > 1 ? "s" : ""}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-start gap-2">
            {album.publie && (
              <a
                href={`/galerie/${album.slug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex h-9 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-4 text-sm font-medium text-encre hover:border-encre"
              >
                <ArrowUpRight aria-hidden className="size-4" /> Voir sur le site
              </a>
            )}
            <BoutonAction
              action={changerPublicationAlbum.bind(null, album.id, !album.publie)}
              variante={album.publie ? "contour" : "institutionnel"}
            >
              {album.publie ? "Retirer du site" : "Publier l'album"}
            </BoutonAction>
          </div>
        }
      />

      {sansDescription > 0 && (
        <p className="mt-6 rounded-md border border-attention/40 bg-attention-fond p-3 text-sm text-pierre-800">
          {sansDescription} photo{sansDescription > 1 ? "s n'ont" : " n'a"} pas de description :
          complétez-la dans la{" "}
          <Link href="/admin/medias" className="underline hover:no-underline">
            médiathèque
          </Link>{" "}
          (elle est lue aux personnes aveugles et s&apos;affiche si l&apos;image ne charge pas).
        </p>
      )}

      <section aria-labelledby="photos" className="mt-8">
        <h2 id="photos" className="text-2xl">
          Photos de l&apos;album
        </h2>
        {album.medias.length === 0 ? (
          <div className="mt-4">
            <EtatVide titre="Album vide" description="Ajoutez des photos ci-dessous." />
          </div>
        ) : (
          <ol className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {album.medias.map((m, i) => (
              <li
                key={m.mediaId}
                className="overflow-hidden rounded-md border border-pierre-200 bg-white"
              >
                <div className="relative aspect-[4/3] bg-pierre-100">
                  <Image
                    src={urlMedia(m.media.cle)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, 45vw"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute top-2 left-2">
                      <Etiquette ton="chantier">Couverture</Etiquette>
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-xs text-pierre-700">
                    {m.media.texteAlternatif || m.media.nomFichier}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <BoutonAction
                      action={deplacerPhoto.bind(null, album.id, m.mediaId, -1)}
                      variante="fantome"
                      libelleAccessible={`Avancer la photo ${i + 1}`}
                    >
                      <ArrowUp aria-hidden className="size-4" />
                    </BoutonAction>
                    <BoutonAction
                      action={deplacerPhoto.bind(null, album.id, m.mediaId, 1)}
                      variante="fantome"
                      libelleAccessible={`Reculer la photo ${i + 1}`}
                    >
                      <ArrowDown aria-hidden className="size-4" />
                    </BoutonAction>
                    <BoutonAction
                      action={retirerPhoto.bind(null, album.id, m.mediaId)}
                      variante="fantome"
                      confirmation="Retirer ?"
                      libelleAccessible={`Retirer la photo ${i + 1} de l'album`}
                    >
                      Retirer
                    </BoutonAction>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Panneau
        className="mt-8"
        titre="Ajouter des photos"
        description="Cochez les photos de la médiathèque à ajouter. Pour de nouvelles photos, téléversez-les d'abord dans la médiathèque."
      >
        <FormulaireAction
          action={ajouterPhotos.bind(null, album.id)}
          libelleEnvoi="Ajouter la sélection"
        >
          <ChoixPhotos medias={medias} deja={album.medias.map((m) => m.mediaId)} />
        </FormulaireAction>
      </Panneau>

      <Panneau className="mt-8" titre="Informations">
        <FormulaireAction action={modifierAlbum.bind(null, album.id)} libelleEnvoi="Enregistrer">
          <ChampsAlbum album={album} />
        </FormulaireAction>
        <div className="mt-6 border-t border-pierre-200 pt-4">
          <BoutonAction
            action={supprimerAlbum.bind(null, album.id)}
            variante="danger"
            confirmation="Supprimer l'album (les photos restent dans la médiathèque) ?"
          >
            Supprimer l&apos;album
          </BoutonAction>
        </div>
      </Panneau>
    </>
  );
}
