import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { exigerPermission } from "@/features/auth/acces";
import { libelleAction } from "@/features/journal/libelles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Journal d'activité" };

const PAR_PAGE = 50;
const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lubumbashi",
});

export default async function Journal({ searchParams }: PageProps<"/admin/journal">) {
  await exigerPermission("journal.consulter");
  const { page: p } = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof p === "string" ? p : "1", 10) || 1);

  const [total, entrees] = await Promise.all([
    db.journalActivite.count(),
    db.journalActivite.findMany({
      orderBy: { creeLe: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
      include: { auteur: { select: { prenom: true, nom: true, email: true } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Journal" }]}
        titre="Journal d'activité"
        description="Toute modification sensible est enregistrée avec son auteur et sa date. Le journal ne peut pas être modifié depuis l'administration."
      />
      <div className="mt-8 overflow-x-auto rounded-md border border-pierre-200 bg-white">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-pierre-200 bg-pierre-50 font-mono text-xs tracking-wide text-pierre-600 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Action
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Auteur
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pierre-200">
            {entrees.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-pierre-600">
                  {formatDate.format(e.creeLe)}
                </td>
                <td className="px-4 py-2.5 text-pierre-900">{libelleAction(e.action)}</td>
                <td className="px-4 py-2.5 text-pierre-700">
                  {e.auteur ? [e.auteur.prenom, e.auteur.nom].filter(Boolean).join(" ") : "Système"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entrees.length === 0 && (
          <p className="p-8 text-center text-sm text-pierre-600">Aucune activité enregistrée.</p>
        )}
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={`/admin/journal?page=${page - 1}`}
              className="text-ispt-600 underline hover:no-underline"
            >
              Plus récentes
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-pierre-500">
            Page {page} / {pages}
          </span>
          {page < pages ? (
            <Link
              href={`/admin/journal?page=${page + 1}`}
              className="text-ispt-600 underline hover:no-underline"
            >
              Plus anciennes
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
