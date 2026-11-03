import type { Metadata } from "next";
import Image from "next/image";
import { BlocPage, EntetePage } from "@/components/public/entete-page";
import { LienFleche } from "@/components/ui/elements";
import { autorites, debouchesAnciens, institut, stages } from "@/contenu/institut";

export const metadata: Metadata = {
  title: "L'institut",
  description:
    "Présentation, historique, mission, autorités académiques et stages de l'Institut Supérieur Pédagogique et Technique de Bukavu.",
};

const jalons = [
  {
    annee: "2010",
    titre: "Création",
    texte:
      "Arrêté ministériel n°219/MINESU/CAB.MIN/MML/KOB/2010 du 8 novembre 2010, entériné par le ministre de l'Enseignement supérieur et universitaire, le Professeur Mashako Mamba, à la demande de Monseigneur François-Xavier Maroyi Rusengo, archevêque de Bukavu.",
  },
  {
    annee: "2011",
    titre: "Ouverture",
    texte: "L'institut accueille ses premiers étudiants, avenue de l'Hippodrome à Bukavu.",
  },
  {
    annee: "LMD",
    titre: "Réforme des études",
    texte:
      "La formation est organisée en système Licence-Maîtrise-Doctorat : quatre ans, huit semestres, jusqu'au diplôme de Licence.",
  },
  {
    annee: "2026",
    titre: "Collation des grades",
    texte:
      "Une nouvelle promotion d'ingénieurs reçoit le casque, symbole de l'entrée dans le métier.",
  },
];

export default function PageInstitut() {
  return (
    <>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "L'institut" }]}
        surtitre="L'institut"
        titre="Former des ingénieurs pour l'industrie et pour l'école"
        intro={institut.mission}
        photo={{
          src: "/photos/campus-batiment-allee.jpg",
          alt: "Étudiants marchant le long d'un bâtiment du campus.",
          legende: "Campus · Bukavu",
        }}
      />

      <BlocPage numero="01" titre="Historique">
        <ol className="relative border-l border-pierre-300">
          {jalons.map((j, i) => (
            <li
              key={j.annee}
              className="revele relative pb-10 pl-8 last:pb-0"
              style={{ "--i": i } as React.CSSProperties}
            >
              <span
                aria-hidden
                className="absolute top-1.5 -left-[5px] size-[9px] bg-chantier ring-4 ring-papier"
              />
              <p className="font-mono text-sm text-ispt-600">{j.annee}</p>
              <p className="mt-1 font-serif text-2xl text-encre">{j.titre}</p>
              <p className="mt-2 leading-relaxed text-pierre-700">{j.texte}</p>
            </li>
          ))}
        </ol>
      </BlocPage>

      <BlocPage numero="02" titre="Référentiels des métiers" fond="blanc">
        <div className="space-y-8">
          <div>
            <h3 className="font-sans text-base font-semibold text-encre">
              Ingénieurs et techniciens
            </h3>
            <p className="mt-2 leading-relaxed text-pierre-700">
              L&apos;institut forme des ingénieurs et techniciens qualifiés, capables
              d&apos;intégrer les usines, les entreprises de télécommunication, les centrales
              hydroélectriques, les hôpitaux, les bureaux d&apos;études, les laboratoires
              informatiques et électroniques ainsi que les ateliers mécaniques, où ils assurent la
              conception, la maintenance, la réparation et les installations techniques.
            </p>
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-encre">Enseignants techniques</h3>
            <p className="mt-2 leading-relaxed text-pierre-700">
              Il prépare également des ingénieurs disposant des compétences pédagogiques nécessaires
              pour enseigner dans les établissements d&apos;enseignement technique, notamment en
              électricité, mécanique, électronique, informatique et construction.
            </p>
          </div>
          <LienFleche href="/formations">Voir les formations</LienFleche>
        </div>
      </BlocPage>

      <BlocPage numero="03" titre="Autorités académiques">
        <ul className="divide-y divide-pierre-200 border-y border-pierre-200">
          {autorites.map((a) => (
            <li key={a.fonction} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <p className="font-mono text-xs leading-7 tracking-wide text-pierre-500 uppercase">
                {a.fonction}
              </p>
              <p className="font-serif text-2xl text-encre">{a.nom}</p>
            </li>
          ))}
        </ul>
      </BlocPage>

      <section className="trame-claire bg-encre text-white">
        <div className="conteneur grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-4">
            <p className="surtitre text-chantier">04</p>
            <h2 className="mt-3 text-3xl text-white lg:text-[2.25rem]">Stages et partenaires</h2>
            <p className="mt-4 text-white/70">
              L&apos;institut conclut des contrats de partenariat avec les entreprises, les usines
              et les ateliers pour le stage professionnel, et avec les établissements
              d&apos;enseignement technique pour le stage pédagogique.
            </p>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {[stages.professionnel, stages.pedagogique].map((s) => (
              <div key={s.titre}>
                <h3 className="text-2xl text-white">{s.titre}</h3>
                <p className="mt-2 text-sm text-white/65">{s.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {s.lieux.map((l) => (
                    <li key={l} className="flex items-start gap-3 text-[0.9375rem]">
                      <span aria-hidden className="mt-2 size-2 shrink-0 bg-chantier" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BlocPage numero="05" titre="Nos anciens">
        <p className="leading-relaxed text-pierre-700">
          Les diplômés exercent dans des secteurs variés et contribuent aussi à l&apos;enseignement,
          dans les humanités techniques comme dans l&apos;enseignement supérieur.
        </p>
        <div className="mt-8 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="surtitre !font-mono">Parcours professionnel</h3>
            <p className="mt-3 leading-loose text-pierre-800">
              {debouchesAnciens.professionnels.join(" · ")}
            </p>
          </div>
          <div>
            <h3 className="surtitre !font-mono">Parcours pédagogique</h3>
            <p className="mt-3 leading-loose text-pierre-800">
              {debouchesAnciens.enseignement.join(" · ")}
            </p>
          </div>
        </div>
        <figure className="revele-image relative mt-10 aspect-[16/9] overflow-hidden rounded-md">
          <Image
            src="/photos/collation-2026-corps-academique.jpg"
            alt="Membres du corps académique lors de la collation des grades 2026."
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover object-[50%_30%]"
          />
          <figcaption className="absolute bottom-0 left-0 bg-encre/85 px-2.5 py-1 font-mono text-[0.625rem] tracking-wide text-white uppercase">
            Corps académique · Collation 2026
          </figcaption>
        </figure>
      </BlocPage>
    </>
  );
}
