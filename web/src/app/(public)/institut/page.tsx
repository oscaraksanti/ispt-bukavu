import { TransitionPage } from "@/components/public/transition-page";
import type { Metadata } from "next";
import { BlocPage, EntetePage } from "@/components/public/entete-page";
import { Legende, Photo } from "@/components/public/photo";
import { LienFleche } from "@/components/ui/elements";
import { lireAutorites, lireInstitut, lirePage, lirePartenaires } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";

export const metadata: Metadata = {
  title: "L'institut",
  description:
    "Présentation, historique, mission, autorités académiques et stages de l'Institut Supérieur Pédagogique et Technique de Bukavu.",
};

export default async function PageInstitut() {
  const [page, institut, autorites, partenaires] = await Promise.all([
    lirePage("institut"),
    lireInstitut(),
    lireAutorites(),
    lirePartenaires(),
  ]);
  const entete = lecteur(page.entete);
  const historique = lecteur(page.historique);
  const referentiels = lecteur(page.referentiels);
  const stages = lecteur(page.stages);
  const anciens = lecteur(page.anciens);

  // Les sections sont numérotées dans l'ordre où elles s'affichent.
  let numero = 0;
  const suivant = () => String(++numero).padStart(2, "0");

  const typesStage = [
    {
      titre: stages.texte("titreProfessionnel"),
      texte: stages.texte("texteProfessionnel"),
      lieux: partenaires.stageProfessionnel,
    },
    {
      titre: stages.texte("titrePedagogique"),
      texte: stages.texte("textePedagogique"),
      lieux: partenaires.stagePedagogique,
    },
  ];

  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "L'institut" }]}
        surtitre="L'institut"
        titre={entete.texte("titre")}
        intro={institut.mission}
        photo={entete.image("photo")}
        legende={entete.texte("legende")}
      />

      {historique.visible && (
        <BlocPage numero={suivant()} titre="Historique">
          <ol className="relative border-l border-pierre-300">
            {historique.liste("jalons").map((j, i) => (
              <li
                key={i}
                className="revele relative pb-10 pl-8 last:pb-0"
                style={{ "--i": i } as React.CSSProperties}
              >
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[5px] size-[9px] bg-chantier ring-4 ring-papier"
                />
                <p className="font-mono text-sm text-ispt-600">{j.texte("annee")}</p>
                <p className="mt-1 font-serif text-2xl text-encre">{j.texte("titre")}</p>
                <p className="mt-2 leading-relaxed text-pierre-700">{j.texte("texte")}</p>
              </li>
            ))}
          </ol>
        </BlocPage>
      )}

      {referentiels.visible && (
        <BlocPage numero={suivant()} titre="Référentiels des métiers" fond="blanc">
          <div className="space-y-8">
            {(["Technique", "Pedagogique"] as const).map((volet) => (
              <div key={volet}>
                <h3 className="font-sans text-base font-semibold text-encre">
                  {referentiels.texte(`titre${volet}`)}
                </h3>
                <p className="mt-2 leading-relaxed text-pierre-700">
                  {referentiels.texte(`texte${volet}`)}
                </p>
              </div>
            ))}
            <LienFleche href="/formations">Voir les formations</LienFleche>
          </div>
        </BlocPage>
      )}

      {autorites.length > 0 && (
        <BlocPage numero={suivant()} titre="Autorités académiques">
          <ul className="divide-y divide-pierre-200 border-y border-pierre-200">
            {autorites.map((a) => (
              <li key={a.id} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <p className="font-mono text-xs leading-7 tracking-wide text-pierre-500 uppercase">
                  {a.fonction}
                </p>
                <p className="font-serif text-2xl text-encre">{a.nom}</p>
              </li>
            ))}
          </ul>
        </BlocPage>
      )}

      {stages.visible && (
        <section className="trame-claire bg-encre text-white">
          <div className="conteneur grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
            <div className="revele lg:col-span-4">
              <p className="surtitre text-chantier">{suivant()}</p>
              <h2 className="mt-3 text-3xl text-white lg:text-[2.25rem]">
                {stages.texte("titre")}
              </h2>
              <p className="mt-4 text-white/70">{stages.texte("intro")}</p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
              {typesStage.map((s, i) => (
                <div key={i} className="revele" style={{ "--i": i } as React.CSSProperties}>
                  <h3 className="text-2xl text-white">{s.titre}</h3>
                  <p className="mt-2 text-sm text-white/65">{s.texte}</p>
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
      )}

      {anciens.visible && (
        <BlocPage numero={suivant()} titre="Nos anciens">
          <p className="leading-relaxed text-pierre-700">{anciens.texte("texte")}</p>
          <div className="mt-8 grid gap-10 sm:grid-cols-2">
            {[
              { titre: "Parcours professionnel", liste: partenaires.employeurs },
              { titre: "Parcours pédagogique", liste: partenaires.institutionnels },
            ]
              .filter((c) => c.liste.length > 0)
              .map((c) => (
                <div key={c.titre}>
                  <h3 className="surtitre !font-mono">{c.titre}</h3>
                  <p className="mt-3 leading-loose text-pierre-800">{c.liste.join(" · ")}</p>
                </div>
              ))}
          </div>
          <figure className="revele-image relative mt-10 aspect-[16/9] overflow-hidden rounded-md">
            <Photo
              image={anciens.image("photo")}
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-[50%_30%]"
            />
            <Legende>{anciens.texte("legende")}</Legende>
          </figure>
        </BlocPage>
      )}
    </TransitionPage>
  );
}
