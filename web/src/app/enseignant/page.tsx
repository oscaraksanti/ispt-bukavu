import type { Metadata } from "next";
import Link from "next/link";
import { LienBouton } from "@/components/ui/bouton";
import { EtatVide } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { exigerEnseignant } from "@/features/espaces/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Mes cours" };

export default async function AccueilEnseignant() {
  const { u, profil } = await exigerEnseignant();
  const affectations = await db.coursEnseignant.findMany({
    where: { enseignantId: profil.id, coursOffert: { promotion: { annee: { courante: true } } } },
    include: {
      coursOffert: {
        include: {
          cours: { include: { ue: true } },
          promotion: {
            include: { filiere: true, niveau: true, _count: { select: { inscriptions: true } } },
          },
        },
      },
    },
  });
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="surtitre">Espace enseignant</p>
          <h1 className="mt-3 text-[2.25rem] leading-tight sm:text-5xl">
            Bonjour, {u.prenom ?? u.nom}
          </h1>
        </div>
        {affectations.length > 0 && (
          <LienBouton href="/enseignant/valve/nouveau" variante="institutionnel">
            Écrire à mes étudiants
          </LienBouton>
        )}
      </header>
      <section>
        <h2 className="text-2xl">Cours de l&apos;année</h2>
        {affectations.length === 0 ? (
          <div className="mt-4">
            <EtatVide
              titre="Aucun cours confié pour le moment"
              description="Le secrétariat académique vous affecte vos cours ; ils apparaîtront ici."
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {affectations.map(({ coursOffert: co, titulaire }) => (
              <li key={co.id}>
                <Link
                  href={`/enseignant/cours/${co.id}`}
                  className="group block h-full rounded-md border border-pierre-200 bg-white p-5 transition-colors hover:border-ispt-600"
                >
                  <p className="font-mono text-xs text-ispt-600">
                    {co.cours.ue.code} · S{co.cours.ue.semestre}
                    {!titulaire && " · assistant"}
                  </p>
                  <p className="mt-2 font-serif text-xl text-encre">{co.cours.intitule}</p>
                  <p className="mt-1 text-sm text-pierre-600">
                    {libellePromotion(co.promotion)} · {co.promotion._count.inscriptions}{" "}
                    étudiant(s) · {co.cours.volumeHoraire} h
                  </p>
                  <p className="mt-3 text-sm font-medium text-ispt-600 group-hover:underline">
                    Notes et supports →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
