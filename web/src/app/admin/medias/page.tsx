import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FicheMedia } from "@/components/admin/fiche-media";
import { Televerseur } from "@/components/admin/televerseur";
import { exigerPermission } from "@/features/auth/acces";
import { DOSSIERS_MEDIAS } from "@/features/medias/regles";
import { urlMedia } from "@/features/medias/url";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Médiathèque" };

export default async function Mediatheque({ searchParams }: PageProps<"/admin/medias">) {
  await exigerPermission("medias.gerer");
  const { dossier: d } = await searchParams;
  const dossier = typeof d === "string" && d in DOSSIERS_MEDIAS ? d : null;

  const [medias, parDossier] = await Promise.all([
    db.media.findMany({
      where: {
        typeMime: { startsWith: "image/" },
        NOT: { cle: { startsWith: "prive/" } },
        ...(dossier ? { dossier } : {}),
      },
      orderBy: [{ creeLe: "desc" }, { nomFichier: "asc" }],
    }),
    db.media.groupBy({
      by: ["dossier"],
      where: { typeMime: { startsWith: "image/" }, NOT: { cle: { startsWith: "prive/" } } },
      _count: true,
    }),
  ]);
  const total = parDossier.reduce((n, g) => n + g._count, 0);
  const sansDescription = medias.filter((m) => !m.texteAlternatif.trim()).length;

  const filtres = [
    { cle: null, libelle: "Toutes", nombre: total },
    ...parDossier
      .map((g) => ({
        cle: g.dossier,
        libelle: DOSSIERS_MEDIAS[g.dossier] ?? g.dossier,
        nombre: g._count,
      }))
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
  ];

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Médiathèque" }]}
        titre="Médiathèque"
        description="Photos utilisées sur le site. Chaque image est allégée et débarrassée de ses métadonnées (dont la position GPS) à l'envoi."
      />

      <Panneau className="mt-8" titre="Ajouter des photos">
        <Televerseur />
      </Panneau>

      <nav aria-label="Dossiers" className="mt-8 flex flex-wrap gap-2">
        {filtres.map((f) => {
          const actif = f.cle === dossier;
          return (
            <Link
              key={f.cle ?? "toutes"}
              href={f.cle ? `/admin/medias?dossier=${f.cle}` : "/admin/medias"}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                actif
                  ? "border-encre bg-encre text-white"
                  : "border-pierre-300 bg-white text-pierre-700 hover:border-encre",
              )}
            >
              {f.libelle} <span className="font-mono text-xs">{f.nombre}</span>
            </Link>
          );
        })}
      </nav>

      {sansDescription > 0 && (
        <p className="mt-4 text-sm text-attention">
          {sansDescription} image{sansDescription > 1 ? "s n'ont" : " n'a"} pas encore de
          description : cliquez sur une image pour la rédiger.
        </p>
      )}

      {medias.length === 0 ? (
        <p className="mt-10 text-center text-pierre-600">Aucune image dans ce dossier.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {medias.map((m) => (
            <FicheMedia
              key={m.id}
              media={{
                id: m.id,
                url: urlMedia(m.cle),
                nomFichier: m.nomFichier,
                texteAlternatif: m.texteAlternatif,
                legende: m.legende,
                dossier: m.dossier,
                taille: m.taille,
                largeur: m.largeur,
                hauteur: m.hauteur,
                officielle: m.cle.startsWith("public/"),
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}
