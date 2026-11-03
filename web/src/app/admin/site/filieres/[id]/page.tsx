import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { Encadre } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import { enregistrerFiliere, supprimerFiliere } from "@/features/contenu/actions-collections";
import { FORMULAIRE_FILIERE } from "@/features/contenu/collections";
import { mediasPourSelecteur } from "@/features/medias/requetes";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Modifier une filière" };

export default async function EditionFiliere({
  params,
  searchParams,
}: PageProps<"/admin/site/filieres/[id]">) {
  await exigerPermission("contenu.modifier");
  const { id } = await params;
  const { creee } = await searchParams;
  const [f, medias] = await Promise.all([
    db.filiere.findUnique({ where: { id } }),
    mediasPourSelecteur(),
  ]);
  if (!f) notFound();

  const valeurs = {
    nom: f.nom,
    nomCourt: f.nomCourt,
    slug: f.slug,
    photo: f.photoId,
    accroche: f.accroche,
    presentation: f.presentation,
    domaines: f.domaines.map((libelle) => ({ libelle })),
    metiers: f.metiers.map((libelle) => ({ libelle })),
    debouches: f.debouches,
    entreprendre: f.entreprendre,
  };

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Filières", href: "/admin/site/filieres" },
          { libelle: f.nomCourt },
        ]}
        titre={f.nom}
        description={
          f.ouverte
            ? "Filière publiée : les modifications apparaissent aussitôt sur le site."
            : "Filière masquée : publiez-la depuis la liste des filières quand la fiche est prête."
        }
        actions={
          f.ouverte ? (
            <a
              href={`/formations/${f.slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center rounded-xs border border-pierre-300 bg-white px-5 text-[0.9375rem] font-medium text-encre hover:border-encre"
            >
              Voir la fiche
            </a>
          ) : undefined
        }
      />
      {creee === "1" && (
        <Encadre titre="Filière créée" className="mt-6">
          Elle reste masquée tant que vous ne l&apos;avez pas publiée depuis la liste des filières.
        </Encadre>
      )}
      <Panneau className="mt-8" titre={FORMULAIRE_FILIERE.titre}>
        <EditeurBloc
          definition={FORMULAIRE_FILIERE}
          valeursInitiales={valeurs}
          medias={medias}
          action={enregistrerFiliere.bind(null, f.id)}
        />
      </Panneau>
      <Panneau
        className="mt-8"
        titre="Supprimer la filière"
        description="Possible uniquement tant qu'aucune promotion, aucun cours ni aucune candidature n'y est rattaché."
      >
        <BoutonAction
          action={supprimerFiliere.bind(null, f.id)}
          confirmation="Supprimer définitivement cette filière ?"
          variante="fantome"
          className="text-erreur hover:bg-erreur-fond"
        >
          Supprimer la filière
        </BoutonAction>
      </Panneau>
    </>
  );
}
