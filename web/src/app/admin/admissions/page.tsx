import { Download, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { Liste, Saisie } from "@/components/ui/champs";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import {
  etatPaiement,
  fraisExiges,
  LIBELLES_STATUT,
  type Statut,
  statistiquesCampagne,
  TON_STATUT,
} from "@/features/admissions/regles";
import { exigerPermission } from "@/features/auth/acces";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Candidatures" };

const ORDRE: Statut[] = [
  "SOUMISE",
  "EN_EXAMEN",
  "COMPLEMENT",
  "ADMISE",
  "REFUSEE",
  "INSCRITE",
  "BROUILLON",
];

export default async function Candidatures({ searchParams }: PageProps<"/admin/admissions">) {
  await exigerPermission("admissions.consulter");
  const { statut: st, filiere: fi, q: qq, campagne: ca } = await searchParams;
  const campagnes = await db.campagneAdmission.findMany({
    orderBy: { ouverture: "desc" },
    include: { filieres: { orderBy: { ordre: "asc" } } },
  });
  if (campagnes.length === 0)
    return (
      <>
        <EnteteAdmin
          ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Candidatures" }]}
          titre="Candidatures"
        />
        <div className="mt-8">
          <EtatVide
            titre="Aucune campagne d'admission"
            description="Créez une campagne pour ouvrir le dépôt des candidatures en ligne."
            action={
              <Link
                href="/admin/admissions/campagnes/nouvelle"
                className="font-medium text-ispt-600 underline"
              >
                Créer une campagne
              </Link>
            }
          />
        </div>
      </>
    );

  const campagne = campagnes.find((c) => c.id === ca) ?? campagnes[0];
  const statut = typeof st === "string" && st in LIBELLES_STATUT ? (st as Statut) : null;
  const filiere = typeof fi === "string" ? fi : "";
  const q = typeof qq === "string" ? qq.trim() : "";

  const where: Prisma.CandidatureWhereInput = {
    campagneId: campagne.id,
    ...(statut ? { statut } : { statut: { not: "BROUILLON" } }),
    ...(filiere ? { filiereId: filiere } : {}),
    ...(q
      ? {
          OR: [
            { numero: { contains: q, mode: "insensitive" } },
            { nom: { contains: q, mode: "insensitive" } },
            { prenom: { contains: q, mode: "insensitive" } },
            { candidat: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [dossiers, parStatut, tous] = await Promise.all([
    db.candidature.findMany({
      where,
      orderBy: [{ soumiseLe: "asc" }, { creeLe: "asc" }],
      include: { filiere: true, candidat: { select: { email: true } } },
      take: 300,
    }),
    db.candidature.groupBy({ by: ["statut"], where: { campagneId: campagne.id }, _count: true }),
    db.candidature.findMany({
      where: { campagneId: campagne.id },
      select: {
        statut: true,
        soumiseLe: true,
        decideLe: true,
        referencePaiement: true,
        paiementVerifieLe: true,
        paiementMotifRefus: true,
        filiere: { select: { nomCourt: true } },
      },
    }),
  ]);
  const avecFrais = fraisExiges(campagne);
  const stats = statistiquesCampagne(
    tous.map((d) => ({
      statut: d.statut as Statut,
      filiere: d.filiere?.nomCourt ?? null,
      soumiseLe: d.soumiseLe,
      decideLe: d.decideLe,
      etatPaiement: etatPaiement(d, avecFrais),
    })),
  );
  const maxFiliere = Math.max(1, ...stats.parFiliere.map((f) => f.deposes));
  const compte = (s: Statut) => parStatut.find((g) => g.statut === s)?._count ?? 0;
  const lien = (params: Record<string, string | null>) => {
    const u = new URLSearchParams();
    const base = {
      campagne: campagne.id,
      statut,
      filiere: filiere || null,
      q: q || null,
      ...params,
    };
    for (const [k, v] of Object.entries(base)) if (v) u.set(k, v);
    return `/admin/admissions?${u}`;
  };

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Candidatures" }]}
        titre="Candidatures"
        description={`${campagne.libelle} · dépôt du ${formatJour.format(campagne.ouverture)} au ${formatJour.format(campagne.cloture)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/affiche/${campagne.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-5 text-[0.9375rem] font-medium text-encre hover:border-encre"
            >
              <QrCode aria-hidden className="size-4" /> Affiche
            </a>
            <a
              href={`/admin/admissions/export?campagne=${campagne.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-xs border border-pierre-300 bg-white px-5 text-[0.9375rem] font-medium text-encre hover:border-encre"
            >
              <Download aria-hidden className="size-4" /> Exporter (CSV)
            </a>
          </div>
        }
      />

      <nav
        aria-label="Filtrer par état"
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
      >
        {ORDRE.map((s) => (
          <Link
            key={s}
            href={lien({ statut: statut === s ? null : s })}
            aria-current={statut === s ? "page" : undefined}
            className={cn(
              "rounded-md border bg-white p-3 transition-colors",
              statut === s
                ? "border-encre ring-1 ring-encre"
                : "border-pierre-200 hover:border-pierre-400",
            )}
          >
            <span className="block font-serif text-3xl text-encre">{compte(s)}</span>
            <span className="mt-1 block text-xs text-pierre-600">{LIBELLES_STATUT[s]}</span>
          </Link>
        ))}
      </nav>

      <section aria-labelledby="suivi" className="mt-6 grid gap-4 lg:grid-cols-5">
        <h2 id="suivi" className="sr-only">
          Suivi de la campagne
        </h2>
        <dl className="grid grid-cols-2 gap-3 lg:col-span-3">
          {[
            ["Comptes ouverts", String(stats.comptesOuverts)],
            ["Dossiers déposés", String(stats.deposes)],
            [
              "Délai médian de décision",
              stats.delaiMedianJours === null ? "—" : `${stats.delaiMedianJours} j`,
            ],
            ["Taux d'admission", stats.tauxAdmission === null ? "—" : `${stats.tauxAdmission} %`],
            ...(avecFrais ? [["Frais à vérifier (caisse)", String(stats.paiementsAVerifier)]] : []),
          ].map(([libelle, valeur]) => (
            <div key={libelle} className="rounded-md border border-pierre-200 bg-white p-4">
              <dt className="text-xs text-pierre-600">{libelle}</dt>
              <dd className="mt-1 font-serif text-2xl text-encre">{valeur}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-md border border-pierre-200 bg-white p-4 lg:col-span-2">
          <p className="text-xs text-pierre-600">Dossiers déposés par filière (dont admis)</p>
          {stats.parFiliere.length === 0 ? (
            <p className="mt-3 text-sm text-pierre-600">Aucun dossier déposé.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {stats.parFiliere.map((f) => (
                <li key={f.nom} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-pierre-800">{f.nom}</span>
                    <span className="font-mono text-xs text-pierre-700">
                      {f.deposes} · {f.admis} admis
                    </span>
                  </div>
                  <div aria-hidden className="mt-1 h-1.5 rounded-full bg-pierre-100">
                    <div
                      className="h-full rounded-full bg-ispt-600"
                      style={{ width: `${(100 * f.deposes) / maxFiliere}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" role="search">
        <input type="hidden" name="campagne" value={campagne.id} />
        {statut && <input type="hidden" name="statut" value={statut} />}
        <label htmlFor="q" className="sr-only">
          Rechercher
        </label>
        <Saisie
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Numéro, nom ou email"
          className="h-10 sm:max-w-xs"
        />
        <label htmlFor="filiere" className="sr-only">
          Filière
        </label>
        <Liste id="filiere" name="filiere" defaultValue={filiere} className="h-10 sm:w-64">
          <option value="">Toutes les filières</option>
          {campagne.filieres.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </Liste>
        <button
          type="submit"
          className="h-10 rounded-xs bg-encre px-4 text-sm font-medium text-white hover:bg-ispt-700"
        >
          Filtrer
        </button>
        {campagnes.length > 1 && (
          <Liste
            name="campagne"
            defaultValue={campagne.id}
            className="h-10 sm:ml-auto sm:w-56"
            aria-label="Campagne"
          >
            {campagnes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
            ))}
          </Liste>
        )}
      </form>

      {dossiers.length === 0 ? (
        <div className="mt-6">
          <EtatVide titre="Aucun dossier ne correspond" />
        </div>
      ) : (
        <div
          className="mt-6 overflow-x-auto rounded-md border border-pierre-200 bg-white"
          tabIndex={0}
          role="region"
          aria-label="Liste des candidatures"
        >
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-pierre-200 bg-pierre-50 font-mono text-xs tracking-wide text-pierre-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Dossier
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Candidat
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Filière
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  État
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Déposé le
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pierre-200">
              {dossiers.map((d) => (
                <tr key={d.id} className="hover:bg-pierre-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/admissions/${d.id}`}
                      className="text-ispt-600 underline hover:no-underline"
                    >
                      {d.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-pierre-900">
                      {[d.prenom, d.nom, d.postnom].filter(Boolean).join(" ")}
                    </span>
                    <span className="block text-xs text-pierre-500">{d.candidat.email}</span>
                  </td>
                  <td className="px-4 py-3 text-pierre-700">{d.filiere?.nomCourt ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Etiquette ton={TON_STATUT[d.statut as Statut]}>
                      {LIBELLES_STATUT[d.statut as Statut]}
                    </Etiquette>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-pierre-600">
                    {d.soumiseLe ? formatJour.format(d.soumiseLe) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
