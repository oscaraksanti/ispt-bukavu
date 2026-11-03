import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BlocPage, EntetePage } from "@/components/public/entete-page";
import { Photo } from "@/components/public/photo";
import { lireFilieres, lireInstitut, lirePage } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";

export const metadata: Metadata = {
  title: "Formations",
  description:
    "Électromécanique, Génie Informatique, Électronique et Télécommunications, Génie Civil : les filières LMD de l'ISPT-Bukavu.",
};

export default async function PageFormations() {
  const [page, institut, filieres] = await Promise.all([
    lirePage("formations"),
    lireInstitut(),
    lireFilieres(),
  ]);
  const entete = lecteur(page.entete);
  return (
    <>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Formations" }]}
        surtitre="Formations"
        titre={entete.texte("titre")}
        intro={entete.texte("intro")}
      />

      <section className="conteneur py-16 lg:py-20">
        <ul className="divide-y divide-pierre-200 border-y border-pierre-200">
          {filieres.map((f, i) => (
            <li key={f.slug} className="revele">
              <Link
                href={`/formations/${f.slug}`}
                className="group grid gap-6 py-8 md:grid-cols-12 md:items-center md:gap-8"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-md md:col-span-4 lg:col-span-3">
                  <Photo
                    image={f.photo}
                    sizes="(min-width: 768px) 320px, 100vw"
                    className="transition-transform duration-300 ease-doux group-hover:scale-[1.03]"
                  />
                </div>
                <div className="md:col-span-8 lg:col-span-9 lg:grid lg:grid-cols-9 lg:gap-8">
                  <div className="lg:col-span-5">
                    <p className="font-mono text-xs text-pierre-500">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-2 text-3xl group-hover:text-ispt-600">{f.nom}</h2>
                    <p className="mt-3 leading-relaxed text-pierre-700">{f.presentation}</p>
                  </div>
                  <div className="mt-5 lg:col-span-4 lg:mt-0">
                    <p className="font-mono text-xs tracking-wide text-pierre-500 uppercase">
                      Domaines
                    </p>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-pierre-800">
                      {f.domaines.join(" · ")}
                    </p>
                    <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ispt-600">
                      Fiche de la filière
                      <ArrowRight
                        aria-hidden
                        className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                      />
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <BlocPage numero="Organisation" titre="Le parcours en quatre ans" fond="blanc">
        <dl className="grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2">
          {[
            [
              "Système",
              institut.systemeEtudes === "LMD"
                ? "Licence-Maîtrise-Doctorat (LMD)"
                : institut.systemeEtudes,
            ],
            ["Durée", `${institut.dureeEtudes}, ${institut.semestres} semestres`],
            ["Diplôme", `${institut.diplome}, après validation des enseignements et des crédits`],
            ["Stages", "Stage pédagogique et stage professionnel obligatoire"],
          ].map(([cle, valeur]) => (
            <div key={cle} className="bg-white p-6">
              <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">{cle}</dt>
              <dd className="mt-2 font-serif text-xl text-encre">{valeur}</dd>
            </div>
          ))}
        </dl>
      </BlocPage>
    </>
  );
}
