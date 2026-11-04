import { X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { EtatVide } from "@/components/ui/elements";
import { PaiementDossier } from "@/components/admin/paiement-dossier";
import { fraisDossierPourLaCaisse } from "@/features/admissions/requetes";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission, aPermission } from "@/features/auth/acces";
import { enregistrerBareme, supprimerBareme } from "@/features/finances/actions";
import { formatMontant } from "@/features/finances/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Frais et paiements" };

export default async function Finances({ searchParams }: PageProps<"/admin/finances">) {
  const u = await exigerPermission("finances.consulter");
  const encaisse = aPermission(u, "finances.encaisser");
  const { q: qq } = await searchParams;
  const q = typeof qq === "string" ? qq.trim() : "";
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee)
    return (
      <EtatVide
        titre="Aucune année académique courante"
        description="Définissez-la dans « Années et promotions »."
      />
    );

  const [baremes, niveaux, filieres, totaux, recents, resultats, inscrits, enRegle] =
    await Promise.all([
      db.baremeFrais.findMany({
        where: { anneeId: annee.id },
        include: { niveau: true, filiere: true },
        orderBy: [{ echeance: "asc" }, { libelle: "asc" }],
      }),
      db.niveau.findMany({ orderBy: { ordre: "asc" } }),
      db.filiere.findMany({ where: { ouverte: true }, orderBy: { ordre: "asc" } }),
      db.paiement.groupBy({
        by: ["devise"],
        where: { anneeId: annee.id, annuleLe: null },
        _sum: { montant: true },
        _count: true,
      }),
      db.paiement.findMany({
        where: { anneeId: annee.id },
        include: { etudiant: { include: { utilisateur: true } } },
        orderBy: { creeLe: "desc" },
        take: 10,
      }),
      q
        ? db.profilEtudiant.findMany({
            where: {
              OR: [
                { matricule: { contains: q, mode: "insensitive" } },
                { utilisateur: { nom: { contains: q, mode: "insensitive" } } },
                { utilisateur: { prenom: { contains: q, mode: "insensitive" } } },
                { utilisateur: { postnom: { contains: q, mode: "insensitive" } } },
              ],
            },
            include: { utilisateur: true },
            take: 30,
          })
        : Promise.resolve([]),
      db.inscription.count({ where: { promotion: { anneeId: annee.id } } }),
      db.inscription.count({ where: { promotion: { anneeId: annee.id }, statut: "EN_REGLE" } }),
    ]);
  const fraisDossier = await fraisDossierPourLaCaisse();

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Frais et paiements" }]}
        titre="Frais et paiements"
        description={`Année ${annee.libelle}. La caisse enregistre chaque paiement reçu (banque, guichet, mobile money) ; l'étudiant voit aussitôt sa situation et son reçu.`}
      />

      {fraisDossier.length > 0 && (
        <Panneau
          id="frais-dossier"
          className="mt-8"
          titre={`Frais de dossier à vérifier (${fraisDossier.filter((c) => !c.paiementVerifieLe).length})`}
          description="Références de paiement indiquées par les candidats. Vérifiez chaque versement sur le relevé avant d'émettre le reçu."
        >
          <ul className="-my-3 divide-y divide-pierre-200">
            {fraisDossier.map((c) => (
              <li key={c.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_1.4fr]">
                <div className="text-sm">
                  <p className="font-medium text-pierre-900">
                    {[c.prenom, c.nom, c.postnom].filter(Boolean).join(" ")}
                  </p>
                  <p className="font-mono text-xs text-pierre-600">
                    Dossier n° {c.numero} ·{" "}
                    {formatMontant(Number(c.campagne.fraisInscription), c.campagne.devise)}
                  </p>
                </div>
                <PaiementDossier
                  dossier={c}
                  etat={c.paiementVerifieLe ? "VERIFIE" : "A_VERIFIER"}
                  peutEncaisser={encaisse}
                />
              </li>
            ))}
          </ul>
        </Panneau>
      )}

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {totaux.length === 0 ? (
          <div className="rounded-md border border-pierre-200 bg-white p-5">
            <dt className="text-sm text-pierre-600">Encaissé cette année</dt>
            <dd className="mt-1 font-serif text-3xl text-encre">0</dd>
          </div>
        ) : (
          totaux.map((t) => (
            <div key={t.devise} className="rounded-md border border-pierre-200 bg-white p-5">
              <dt className="text-sm text-pierre-600">Encaissé ({t._count} paiement(s))</dt>
              <dd className="mt-1 font-serif text-3xl text-encre">
                {formatMontant(Number(t._sum.montant ?? 0), t.devise)}
              </dd>
            </div>
          ))
        )}
        <div className="rounded-md border border-pierre-200 bg-white p-5">
          <dt className="text-sm text-pierre-600">Étudiants en règle</dt>
          <dd className="mt-1 font-serif text-3xl text-encre">
            {enRegle} <span className="text-lg text-pierre-500">/ {inscrits}</span>
          </dd>
        </div>
      </dl>

      <Panneau className="mt-8" titre="Trouver un étudiant">
        <form role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Matricule ou nom
          </label>
          <Saisie id="q" name="q" type="search" defaultValue={q} placeholder="Matricule ou nom" />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-xs bg-encre px-5 text-sm font-medium text-white"
          >
            Chercher
          </button>
        </form>
        {q && (
          <ul className="mt-4 divide-y divide-pierre-200 border-y border-pierre-200">
            {resultats.length === 0 && (
              <li className="py-3 text-sm text-pierre-600">Aucun étudiant trouvé.</li>
            )}
            {resultats.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/finances/etudiants/${r.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-pierre-50"
                >
                  <span className="font-mono text-xs text-pierre-600">{r.matricule}</span>
                  <span className="text-pierre-900">
                    {[r.utilisateur.nom, r.utilisateur.postnom, r.utilisateur.prenom]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panneau
          titre="Barèmes de l'année"
          className="lg:col-span-3"
          description="Frais exigés, pour tous ou pour un niveau ou une filière."
        >
          {baremes.length === 0 ? (
            <p className="text-sm text-pierre-600">
              Aucun barème : ajoutez les frais fixés par l&apos;institut.
            </p>
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200 text-sm">
              {baremes.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="flex-1">
                    <span className="block text-pierre-900">{b.libelle}</span>
                    <span className="text-xs text-pierre-500">
                      {b.niveau?.libelle ?? "Tous niveaux"} ·{" "}
                      {b.filiere?.nomCourt ?? "toutes filières"}
                      {b.echeance && ` · avant le ${formatJour.format(b.echeance)}`}
                    </span>
                  </span>
                  <span className="font-mono">{formatMontant(Number(b.montant), b.devise)}</span>
                  {encaisse && (
                    <BoutonAction
                      action={supprimerBareme.bind(null, b.id)}
                      variante="fantome"
                      confirmation="Supprimer ?"
                      className="size-8 px-0"
                      libelleAccessible={`Supprimer ${b.libelle}`}
                    >
                      <X aria-hidden />
                    </BoutonAction>
                  )}
                </li>
              ))}
            </ul>
          )}
          {encaisse && (
            <details className="mt-5 rounded-xs bg-pierre-50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-ispt-600">
                Ajouter un barème
              </summary>
              <div className="mt-4">
                <FormulaireAction
                  action={enregistrerBareme.bind(null, null)}
                  libelleEnvoi="Ajouter"
                  viderApresSucces
                >
                  <Champ id="libelle" libelle="Libellé">
                    <Saisie
                      id="libelle"
                      name="libelle"
                      placeholder="Frais académiques, 1re tranche"
                      maxLength={120}
                    />
                  </Champ>
                  <div className="grid grid-cols-[1fr_7rem] gap-3">
                    <Champ id="montant" libelle="Montant">
                      <Saisie id="montant" name="montant" inputMode="decimal" />
                    </Champ>
                    <Champ id="devise" libelle="Devise">
                      <Liste id="devise" name="devise" defaultValue="USD">
                        <option value="USD">$</option>
                        <option value="CDF">FC</option>
                      </Liste>
                    </Champ>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Champ id="niveauId" libelle="Niveau">
                      <Liste id="niveauId" name="niveauId" defaultValue="">
                        <option value="">Tous</option>
                        {niveaux.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.libelle}
                          </option>
                        ))}
                      </Liste>
                    </Champ>
                    <Champ id="filiereId" libelle="Filière">
                      <Liste id="filiereId" name="filiereId" defaultValue="">
                        <option value="">Toutes</option>
                        {filieres.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nomCourt}
                          </option>
                        ))}
                      </Liste>
                    </Champ>
                    <Champ id="echeance" libelle="Échéance">
                      <Saisie id="echeance" name="echeance" type="date" />
                    </Champ>
                  </div>
                </FormulaireAction>
              </div>
            </details>
          )}
        </Panneau>
        <Panneau titre="Derniers paiements" className="lg:col-span-2">
          {recents.length === 0 ? (
            <p className="text-sm text-pierre-600">Aucun paiement enregistré.</p>
          ) : (
            <ul className="-my-2 divide-y divide-pierre-200 text-sm">
              {recents.map((p) => (
                <li key={p.id} className="py-2.5">
                  <Link
                    href={`/admin/finances/etudiants/${p.etudiantId}`}
                    className="block hover:text-ispt-600"
                  >
                    <span className={p.annuleLe ? "line-through" : ""}>
                      {formatMontant(Number(p.montant), p.devise)}
                    </span>{" "}
                    · {p.etudiant.utilisateur.nom} {p.etudiant.utilisateur.prenom}
                  </Link>
                  <span className="text-xs text-pierre-500">
                    {p.numeroRecu} · {formatJour.format(p.payeLe)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </div>
    </>
  );
}
