import { ArrowRight, CircleCheck, FileText, Images, type LucideIcon, UserCog } from "lucide-react";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { ICONES } from "@/components/admin/icones";
import { utilisateurConnecte } from "@/features/auth/acces";
import { tachesEnAttente } from "@/features/demarrage/a-traiter";
import { avancement, construireEtapes } from "@/features/demarrage/regles";
import { lireEtatPlateforme } from "@/features/demarrage/requetes";
import { libelleAction } from "@/features/journal/libelles";
import { db } from "@/lib/db";
import type { CodePermission } from "@/lib/permissions";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lubumbashi",
});

export default async function TableauDeBord() {
  const u = (await utilisateurConnecte())!;
  const [taches, journal, etat] = await Promise.all([
    tachesEnAttente(u.permissions),
    u.permissions.has("journal.consulter")
      ? db.journalActivite.findMany({
          orderBy: { creeLe: "desc" },
          take: 8,
          include: { auteur: { select: { nom: true, prenom: true } } },
        })
      : Promise.resolve([]),
    lireEtatPlateforme(),
  ]);
  const groupes = construireEtapes(etat);
  const { pourcentage } = avancement(groupes);
  const prochaines = groupes
    .flatMap((g) => g.etapes)
    .filter((e) => e.statut !== "fait")
    .slice(0, 3);

  const enAttente = taches.filter((t) => t.nombre > 0);
  const raccourcis: {
    libelle: string;
    href: string;
    icone: LucideIcon;
    permission: CodePermission;
  }[] = [
    {
      libelle: "Modifier la page d'accueil",
      href: "/admin/site/pages/accueil",
      icone: FileText,
      permission: "contenu.modifier",
    },
    {
      libelle: "Ajouter des photos",
      href: "/admin/medias",
      icone: Images,
      permission: "medias.gerer",
    },
    {
      libelle: "Gérer les comptes",
      href: "/admin/utilisateurs",
      icone: UserCog,
      permission: "utilisateurs.gerer",
    },
  ];
  const raccourcisVisibles = raccourcis.filter((r) => u.permissions.has(r.permission));

  return (
    <>
      <EnteteAdmin
        titre={`Bonjour, ${u.prenom ?? u.nom}`}
        description="Vue d'ensemble de la plateforme de l'ISPT-Bukavu."
      />
      {pourcentage < 100 && (
        <section
          aria-labelledby="mise-en-service"
          className="mt-8 rounded-md border border-ispt-200 bg-ispt-50/60 p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="mise-en-service" className="font-sans text-base font-semibold text-encre">
              Mise en service : {pourcentage} %
            </h2>
            <Link
              href="/admin/demarrage"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ispt-700 underline hover:no-underline"
            >
              Voir toute la liste <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-pierre-800">
            {prochaines.map((e) => (
              <li key={e.cle} className="flex gap-2">
                <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-ispt-600" />
                <span>
                  <span className="font-medium">{e.titre}</span> · {e.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {taches.length > 0 && (
        <section aria-labelledby="a-traiter" className="mt-8">
          <h2 id="a-traiter" className="font-sans text-base font-semibold text-encre">
            À traiter
          </h2>
          {enAttente.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 rounded-md border border-pierre-200 bg-white px-5 py-4 text-sm text-pierre-700">
              <CircleCheck aria-hidden className="size-4 text-succes" />
              Rien n&apos;attend votre action pour le moment.
            </p>
          ) : (
            <ul className="mt-3 grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2 lg:grid-cols-3">
              {enAttente.map((t) => {
                const Icone = ICONES[t.icone];
                return (
                  <li key={t.libelle} className="bg-white">
                    <Link
                      href={t.href}
                      className="group flex h-full items-center gap-4 px-5 py-4 transition-colors hover:bg-pierre-50"
                    >
                      <span className="font-serif text-4xl leading-none text-encre tabular-nums">
                        {t.nombre}
                      </span>
                      <span className="flex-1 text-sm text-pierre-700">{t.libelle}</span>
                      <Icone
                        aria-hidden
                        className="size-5 text-pierre-400 group-hover:text-ispt-600"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {raccourcisVisibles.length > 0 && (
          <Panneau titre="Raccourcis" className="lg:col-span-2">
            <ul className="-my-2 divide-y divide-pierre-200">
              {raccourcisVisibles.map(({ libelle, href, icone: Icone }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3 py-3 text-pierre-800">
                    <span className="flex size-9 items-center justify-center rounded-xs bg-ispt-50 text-ispt-600">
                      <Icone aria-hidden className="size-4" />
                    </span>
                    <span className="flex-1">{libelle}</span>
                    <ArrowRight
                      aria-hidden
                      className="size-4 text-pierre-500 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Panneau>
        )}
        <Panneau titre="Activité récente" className="lg:col-span-3">
          {journal.length === 0 ? (
            <p className="text-sm text-pierre-600">Aucune activité à afficher.</p>
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200">
              {journal.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span className="text-pierre-800">
                    {libelleAction(e.action)}
                    <span className="text-pierre-500">
                      {" "}
                      · {[e.auteur?.prenom, e.auteur?.nom].filter(Boolean).join(" ") || "Système"}
                    </span>
                  </span>
                  <time className="shrink-0 font-mono text-xs text-pierre-500">
                    {formatDate.format(e.creeLe)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </div>
    </>
  );
}
