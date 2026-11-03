import type { Metadata } from "next";
import Link from "next/link";
import { EtatVide } from "@/components/ui/elements";
import { exigerEtudiant } from "@/features/espaces/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Mes cours" };

export default async function CoursEtudiant() {
  const { profil } = await exigerEtudiant();
  const inscription = profil.inscriptions[0];
  const cours = inscription
    ? await db.coursOffert.findMany({
        where: { promotionId: inscription.promotionId },
        include: {
          cours: { include: { ue: true } },
          enseignants: { include: { enseignant: { include: { utilisateur: true } } } },
        },
        orderBy: [{ cours: { ue: { semestre: "asc" } } }, { cours: { intitule: "asc" } }],
      })
    : [];
  const parSemestre = Map.groupBy(cours, (c) => c.cours.ue.semestre);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[2.25rem] leading-tight">Mes cours</h1>
      {cours.length === 0 ? (
        <div className="mt-8">
          <EtatVide
            titre="Aucun cours pour le moment"
            description="Les cours de votre promotion apparaîtront ici dès leur ouverture par le secrétariat."
          />
        </div>
      ) : (
        [...parSemestre.entries()].map(([semestre, liste]) => (
          <section key={semestre} className="mt-8">
            <h2 className="font-sans text-sm font-semibold tracking-wide text-pierre-600 uppercase">
              Semestre {semestre}
            </h2>
            <ul className="mt-3 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
              {liste.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/etudiant/cours/${c.id}`}
                      className="font-medium text-encre hover:text-ispt-600"
                    >
                      {c.cours.intitule}
                    </Link>
                    <p className="text-sm text-pierre-600">
                      {c.cours.ue.code} · {c.cours.credits} crédit(s) · {c.cours.volumeHoraire} h
                    </p>
                  </div>
                  <p className="text-sm text-pierre-700">
                    {c.enseignants
                      .map((e) =>
                        [
                          e.enseignant.titre,
                          e.enseignant.utilisateur.prenom,
                          e.enseignant.utilisateur.nom,
                        ]
                          .filter(Boolean)
                          .join(" "),
                      )
                      .join(", ") || "Enseignant à confirmer"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
