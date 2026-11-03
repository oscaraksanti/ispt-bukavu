import { ArrowRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { exigerPermission } from "@/features/auth/acces";
import { PAGES } from "@/features/contenu/definitions";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Pages du site" };

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "Africa/Lubumbashi",
});

export default async function PagesDuSite() {
  await exigerPermission("contenu.modifier");
  const enregistrees = await db.page.findMany({ select: { slug: true, majLe: true } });
  const majPar = new Map(enregistrees.map((p) => [p.slug, p.majLe]));

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Pages" }]}
        titre="Pages du site"
        description="Textes et photos de chaque page publique, section par section. Les modifications sont publiées dès l'enregistrement."
      />
      <ul className="mt-8 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
        {PAGES.map((p) => {
          const maj = majPar.get(p.slug);
          return (
            <li key={p.slug} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/site/pages/${p.slug}`}
                  className="font-serif text-2xl text-encre hover:text-ispt-600"
                >
                  {p.titre}
                </Link>
                <p className="mt-1 text-sm text-pierre-600">
                  {p.blocs.length} section{p.blocs.length > 1 ? "s" : ""} ·{" "}
                  {p.blocs.map((b) => b.titre).join(", ")}
                </p>
                {maj && (
                  <p className="mt-1 font-mono text-xs text-pierre-500">
                    Modifiée le {formatDate.format(maj)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={p.chemin}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-8 items-center gap-1.5 rounded-xs px-3 text-sm text-pierre-700 hover:bg-pierre-100"
                >
                  <ExternalLink aria-hidden className="size-4" />
                  Voir<span className="sr-only"> la page {p.titre}</span>
                </a>
                <Link
                  href={`/admin/site/pages/${p.slug}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-pierre-300 px-3 text-sm font-medium text-encre hover:border-encre"
                >
                  Modifier<span className="sr-only"> la page {p.titre}</span>
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
