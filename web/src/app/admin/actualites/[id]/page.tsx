import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { Etiquette } from "@/components/ui/elements";
import {
  enregistrerActualite,
  publierActualite,
  supprimerActualite,
} from "@/features/actualites/actions";
import { formatJour } from "@/features/actualites/dates";
import { FORMULAIRE_ACTUALITE } from "@/features/actualites/definitions";
import { exigerPermission } from "@/features/auth/acces";
import { mediasPourSelecteur } from "@/features/medias/requetes";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Modifier un article" };

export default async function EditionArticle({ params }: PageProps<"/admin/actualites/[id]">) {
  await exigerPermission("actualites.gerer");
  const { id } = await params;
  const [a, medias] = await Promise.all([
    db.actualite.findUnique({ where: { id } }),
    mediasPourSelecteur(),
  ]);
  if (!a) notFound();
  const publie = a.statut === "PUBLIE";

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Actualités", href: "/admin/actualites" },
          { libelle: a.titre },
        ]}
        titre={a.titre}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {publie ? (
              <Etiquette ton="succes">Publié</Etiquette>
            ) : (
              <Etiquette ton="attention">Brouillon</Etiquette>
            )}
            {a.publieLe && publie && <span>le {formatJour.format(a.publieLe)}</span>}
          </span>
        }
        actions={
          <>
            {publie && (
              <a
                href={`/actualites/${a.slug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center rounded-xs border border-pierre-300 bg-white px-5 text-corps font-medium text-encre hover:border-encre"
              >
                Voir l&apos;article
              </a>
            )}
            <BoutonAction
              action={publierActualite.bind(null, a.id, !publie)}
              variante={publie ? "contour" : "institutionnel"}
              taille="md"
            >
              {publie ? "Retirer du site" : "Publier"}
            </BoutonAction>
          </>
        }
      />
      <Panneau className="mt-8">
        <EditeurBloc
          definition={FORMULAIRE_ACTUALITE}
          valeursInitiales={{
            titre: a.titre,
            slug: a.slug,
            couverture: a.couvertureId,
            resume: a.resume,
            contenu: a.contenu,
          }}
          medias={medias}
          action={enregistrerActualite.bind(null, a.id)}
          libelleEnvoi={publie ? "Enregistrer et publier" : "Enregistrer le brouillon"}
        />
      </Panneau>
      <Panneau className="mt-8" titre="Supprimer l'article">
        <BoutonAction
          action={supprimerActualite.bind(null, a.id)}
          confirmation="Supprimer définitivement cet article ?"
          variante="fantome"
          className="text-erreur hover:bg-erreur-fond"
        >
          Supprimer l&apos;article
        </BoutonAction>
      </Panneau>
    </>
  );
}
