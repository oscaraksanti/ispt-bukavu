import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EtatVide } from "@/components/ui/elements";
import { ListeCommuniques } from "@/components/valve/liste-communiques";
import { libellePromotion } from "@/features/academique/regles";
import { exigerEtudiant } from "@/features/espaces/acces";
import { valveEtudiant } from "@/features/espaces/valve-etudiant";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Accueil" };

export default async function AccueilEtudiant() {
  const { u, profil } = await exigerEtudiant();
  const inscription = profil.inscriptions[0];
  const [communiques, nbCours] = await Promise.all([
    valveEtudiant(u.id, 50),
    inscription ? db.coursOffert.count({ where: { promotionId: inscription.promotionId } }) : 0,
  ]);
  const nonLus = communiques.filter((c) => !c.lu).length;

  return (
    <div className="space-y-10">
      <header>
        <p className="surtitre">
          {inscription ? `Année ${inscription.promotion.annee.libelle}` : "Espace étudiant"}
        </p>
        <h1 className="mt-3 text-titre-page leading-tight sm:text-5xl">
          Bonjour, {u.prenom ?? u.nom}
        </h1>
        {inscription ? (
          <p className="mt-3 text-lg text-pierre-700">
            {inscription.promotion.niveau.libelle} · {inscription.promotion.filiere.nom}
          </p>
        ) : (
          <p className="mt-3 text-pierre-700">
            Vous n&apos;êtes inscrit dans aucune promotion pour l&apos;année en cours.
          </p>
        )}
      </header>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { valeur: nonLus, libelle: "communiqué(s) non lu(s)", href: "/etudiant/valve" },
          { valeur: nbCours, libelle: "cours cette année", href: "/etudiant/cours" },
          { valeur: profil.matricule, libelle: "matricule", href: null },
        ].map((s) => (
          <div key={s.libelle} className="rounded-md border border-pierre-200 bg-white p-5">
            <dt className="sr-only">{s.libelle}</dt>
            <dd>
              <span className="block font-serif text-3xl text-encre">{s.valeur}</span>
              {s.href ? (
                <Link
                  href={s.href}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-ispt-600 hover:underline"
                >
                  {s.libelle} <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              ) : (
                <span className="mt-1 block text-sm text-pierre-600">{s.libelle}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl">Valve</h2>
          <Link
            href="/etudiant/valve"
            className="text-sm font-medium text-ispt-600 underline hover:no-underline"
          >
            Tous les communiqués
          </Link>
        </div>
        <div className="mt-4">
          {inscription || communiques.length ? (
            <ListeCommuniques
              communiques={communiques.slice(0, 5)}
              base="/etudiant/valve"
              vide="Aucun communiqué pour le moment."
            />
          ) : (
            <EtatVide titre="Aucun communiqué" />
          )}
        </div>
      </section>
      {inscription && (
        <p className="text-sm text-pierre-500">
          Promotion : {libellePromotion(inscription.promotion)}
        </p>
      )}
    </div>
  );
}
