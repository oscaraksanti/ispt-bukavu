import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditeurBloc } from "@/components/admin/editeur-bloc";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { exigerPermission } from "@/features/auth/acces";
import { enregistrerBloc } from "@/features/contenu/actions";
import { definitionPage } from "@/features/contenu/definitions";
import { fusionnerBloc } from "@/features/contenu/donnees";
import { mediasPourSelecteur, remplacerJetonsPhotos } from "@/features/medias/requetes";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/admin/site/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: definitionPage(slug)?.titre ?? "Page" };
}

export default async function EditionPage({ params }: PageProps<"/admin/site/pages/[slug]">) {
  await exigerPermission("contenu.modifier");
  const { slug } = await params;
  const definition = definitionPage(slug);
  if (!definition) notFound();

  const [page, medias] = await Promise.all([
    db.page.findUnique({ where: { slug }, include: { blocs: true } }),
    mediasPourSelecteur(),
  ]);

  const blocs = await Promise.all(
    definition.blocs.map(async (bloc) => {
      const enregistre = page?.blocs.find((b) => b.cle === bloc.cle);
      return {
        bloc,
        visible: enregistre?.visible ?? true,
        valeurs: await remplacerJetonsPhotos(
          fusionnerBloc(bloc, enregistre?.donnees ?? bloc.defaut),
        ),
      };
    }),
  );

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Pages", href: "/admin/site/pages" },
          { libelle: definition.titre },
        ]}
        titre={definition.titre}
        description="Chaque section s'enregistre séparément et apparaît aussitôt sur le site."
        actions={
          <a
            href={definition.chemin}
            target="_blank"
            rel="noopener"
            className="inline-flex h-11 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-5 text-[0.9375rem] font-medium text-encre hover:border-encre"
          >
            <ExternalLink aria-hidden className="size-4" /> Voir la page
          </a>
        }
      />

      <nav aria-label="Sections de la page" className="mt-6 flex flex-wrap gap-2">
        {definition.blocs.map((b) => (
          <a
            key={b.cle}
            href={`#${b.cle}`}
            className="rounded-full border border-pierre-300 bg-white px-3 py-1 text-sm text-pierre-700 hover:border-encre hover:text-encre"
          >
            {b.titre}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-8">
        {blocs.map(({ bloc, visible, valeurs }) => (
          <div key={bloc.cle} id={bloc.cle} className="scroll-mt-6">
            <Panneau titre={bloc.titre} description={bloc.description}>
              <EditeurBloc
                definition={bloc}
                valeursInitiales={valeurs}
                visibleInitial={visible}
                avecVisibilite
                medias={medias}
                action={enregistrerBloc.bind(null, slug, bloc.cle)}
              />
            </Panneau>
          </div>
        ))}
      </div>
    </>
  );
}
