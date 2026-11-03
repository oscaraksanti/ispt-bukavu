import { ArrowRight, Check, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LienBouton } from "@/components/ui/bouton";
import { EnteteSection, FiletCote, LienFleche } from "@/components/ui/elements";
import {
  admission,
  autorites,
  debouchesAnciens,
  filieres,
  institut,
  stages,
} from "@/contenu/institut";
import { lienCandidature } from "@/components/public/navigation";

function Legende({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="absolute bottom-0 left-0 bg-encre/85 px-2.5 py-1 font-mono text-[0.625rem] tracking-wide text-white uppercase">
      {children}
    </figcaption>
  );
}

function Accroche() {
  return (
    <section className="trame relative overflow-hidden border-b border-pierre-200">
      <div className="conteneur grid gap-12 py-12 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="surtitre entree flex items-center gap-3">
            <span>Bukavu · Sud-Kivu</span>
            <FiletCote className="w-8" />
            <span>Depuis {institut.creation.operationnel}</span>
          </p>
          <h1
            className="entree mt-6 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.5rem]"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Ingénieurs de terrain.
            <br />
            <span className="relative">
              Enseignants
              <span
                aria-hidden
                className="entree-trait absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.28em] bg-chantier"
              />
            </span>{" "}
            de métier.
          </h1>
          <p
            className="entree mt-6 max-w-xl text-lg leading-relaxed text-pierre-700"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            L&apos;ISPT-Bukavu forme des ingénieurs en techniques appliquées, prêts pour
            l&apos;industrie comme pour l&apos;enseignement technique, en quatre ans et deux stages
            obligatoires.
          </p>
          <div
            className="entree mt-8 flex flex-wrap gap-3"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <LienBouton href="/formations" taille="lg" className="w-full sm:w-auto">
              Découvrir les formations
            </LienBouton>
            <LienBouton
              href="/admissions"
              variante="contour"
              taille="lg"
              className="w-full sm:w-auto"
            >
              Conditions d&apos;admission
            </LienBouton>
          </div>
          <dl
            className="entree mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-pierre-300 pt-6"
            style={{ "--i": 4 } as React.CSSProperties}
          >
            {[
              ["4", "filières LMD"],
              ["8", "semestres"],
              ["2", "stages obligatoires"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="block font-serif text-4xl text-encre">{v}</span>
                  <span className="mt-1 block text-sm text-pierre-600">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:col-span-6">
          <div
            className="grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4"
            style={{ aspectRatio: "1 / 1" }}
          >
            <figure
              className="entree-image relative col-span-4 row-span-4 overflow-hidden rounded-md"
              style={{ "--i": 0, "--parallaxe": "-24px" } as React.CSSProperties}
            >
              <Image
                src="/photos/tp-topographie-2.jpg"
                alt="Travaux pratiques de topographie : un étudiant règle un niveau sur trépied en plein air."
                fill
                sizes="(min-width: 1024px) 400px, 66vw"
                className="parallaxe object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <Legende>TP de topographie · Génie Civil</Legende>
            </figure>
            <figure
              className="entree-image relative col-span-2 row-span-3 overflow-hidden rounded-md"
              style={{ "--i": 1, "--parallaxe": "-56px" } as React.CSSProperties}
            >
              <Image
                src="/photos/collation-2026-remise-casque-1.jpg"
                alt="Remise du casque à un lauréat lors de la collation des grades 2026."
                fill
                sizes="(min-width: 1024px) 200px, 33vw"
                className="parallaxe object-cover"
              />
              <Legende>Collation 2026</Legende>
            </figure>
            <figure
              className="entree-image relative col-span-2 row-span-3 overflow-hidden rounded-md"
              style={{ "--i": 2, "--parallaxe": "-40px" } as React.CSSProperties}
            >
              <Image
                src="/photos/stage-centrale-electrique.jpg"
                alt="Étudiants en tenue de travail lors d'un stage dans une centrale électrique."
                fill
                sizes="(min-width: 1024px) 200px, 33vw"
                className="parallaxe object-cover"
              />
              <Legende>Stage</Legende>
            </figure>
            <figure
              className="entree-image relative col-span-4 row-span-2 overflow-hidden rounded-md"
              style={{ "--i": 3, "--parallaxe": "-16px" } as React.CSSProperties}
            >
              <Image
                src="/photos/salle-informatique-cours.jpg"
                alt="Étudiants travaillant sur ordinateur en salle de cours."
                fill
                sizes="(min-width: 1024px) 400px, 66vw"
                className="parallaxe object-cover object-[50%_35%]"
              />
              <Legende>Génie Informatique</Legende>
            </figure>
          </div>
          <p className="mt-4 text-right font-mono text-[0.6875rem] tracking-wide text-pierre-500 uppercase">
            {institut.coordonnees.libelle}
          </p>
        </div>
      </div>
    </section>
  );
}

function Institut() {
  const fiche = [
    ["Statut", "Établissement public"],
    ["Création", `${institut.creation.date}`],
    ["Acte", "Arrêté n°219/MINESU/CAB.MIN/MML/KOB/2010"],
    ["Ouverture", String(institut.creation.operationnel)],
    ["Études", `${institut.etudes.systeme} · ${institut.etudes.semestres} semestres`],
    ["Diplôme", institut.etudes.diplome],
    ["Siège", `${institut.adresse.rue}, Bukavu`],
  ];
  return (
    <section className="conteneur py-20 lg:py-28">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 self-start lg:sticky lg:top-36 lg:col-span-6">
          <EnteteSection
            numero="01"
            surtitre="L'institut"
            titre="Une double vocation, technique et pédagogique"
          />
          <p className="mt-8 text-lg leading-relaxed text-pierre-700">{institut.mission}</p>
          <div className="mt-8">
            <LienFleche href="/institut">Présentation de l&apos;institut</LienFleche>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-5 lg:col-start-8">
          <figure className="revele-image relative aspect-[4/3] overflow-hidden rounded-md">
            <Image
              src="/photos/campus-batiment-facade.jpg"
              alt="Façade d'un bâtiment du campus, entouré de végétation, avenue de l'Hippodrome."
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover object-[50%_30%]"
            />
            <Legende>Campus · Avenue de l&apos;Hippodrome</Legende>
          </figure>
          <p className="surtitre mt-8 border-t border-encre py-3 !font-mono text-pierre-500">
            Fiche signalétique
          </p>
          <dl>
            {fiche.map(([cle, valeur]) => (
              <div
                key={cle}
                className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-pierre-200 py-2.5 text-[0.9375rem]"
              >
                <dt className="font-mono text-xs leading-6 tracking-wide text-pierre-500 uppercase">
                  {cle}
                </dt>
                <dd className="min-w-0 [overflow-wrap:anywhere] text-pierre-900">{valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function EnImages() {
  const photos = [
    {
      src: "/photos/collation-2026-laureats-salle.jpg",
      alt: "Lauréats et membres du corps académique réunis en salle lors de la collation 2026.",
      legende: "Collation 2026",
      classe: "col-span-2 row-span-2",
    },
    {
      src: "/photos/tp-topographie-1.jpg",
      alt: "Étudiant en gilet réfléchissant manipulant un niveau topographique.",
      legende: "Topographie",
      classe: "",
    },
    {
      src: "/photos/collation-2026-remise-casque-2.jpg",
      alt: "Un professeur remet le casque à un lauréat.",
      legende: "Remise du casque",
      classe: "",
    },
    {
      src: "/photos/campus-jardin-etudiants.jpg",
      alt: "Étudiants échangeant devant un bâtiment du campus.",
      legende: "Campus",
      classe: "",
    },
    {
      src: "/photos/salle-cours-examen.jpg",
      alt: "Étudiants composant en salle de cours.",
      legende: "Évaluation",
      classe: "",
    },
  ];
  return (
    <section aria-label="L'institut en images" className="bg-encre py-3">
      <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 px-3 sm:auto-rows-[13rem] md:grid-cols-4 lg:auto-rows-[15rem]">
        {photos.map((p, i) => (
          <figure
            key={p.src}
            className={`revele-image relative overflow-hidden ${p.classe}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <Legende>{p.legende}</Legende>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Formations() {
  return (
    <section className="border-y border-pierre-200 bg-white">
      <div className="conteneur py-20 lg:py-28">
        <EnteteSection
          numero="02"
          surtitre="Formations"
          titre="Quatre filières, un même niveau d'exigence"
          intro={`Chaque filière conduit à la Licence en ${institut.etudes.semestres} semestres, avec des travaux pratiques, un stage pédagogique et un stage professionnel.`}
          action={<LienFleche href="/formations">Toutes les formations</LienFleche>}
        />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2 lg:grid-cols-4">
          {filieres.map((f, i) => (
            <li
              key={f.slug}
              className="revele bg-white"
              style={{ "--i": i } as React.CSSProperties}
            >
              <Link href={`/formations/${f.slug}`} className="group flex h-full flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={f.photo.src}
                    alt={f.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 ease-doux group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-mono text-xs text-pierre-500">0{i + 1}</p>
                  <h3 className="mt-2 text-2xl">{f.nomCourt}</h3>
                  <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-pierre-600">
                    {f.accroche}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ispt-600">
                    {f.metiers.length} métiers visés
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stages() {
  const blocs = [stages.pedagogique, stages.professionnel];
  return (
    <section className="trame-claire bg-encre text-white">
      <div className="conteneur grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <EnteteSection
            clair
            numero="03"
            surtitre="Sur le terrain"
            titre="Apprendre au contact du métier"
            intro="Deux stages structurent le parcours : l'un dans les écoles techniques, l'autre en entreprise. Le stage professionnel est obligatoire pour chaque promotion."
          />
          <figure className="revele-image relative mt-10 aspect-[4/3] overflow-hidden rounded-md">
            <Image
              src="/photos/stage-genie-civil-chantier.jpg"
              alt="Étudiants en casque et gilet de sécurité sur un chantier routier."
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
            <Legende>Stage sur chantier routier</Legende>
          </figure>
        </div>
        <div className="grid gap-px self-start bg-white/15 lg:col-span-6 lg:col-start-7">
          {blocs.map((b) => (
            <div key={b.titre} className="revele bg-encre py-8 first:pt-0">
              <h3 className="text-3xl text-white">{b.titre}</h3>
              <p className="mt-3 max-w-md text-white/70">{b.description}</p>
              <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {b.lieux.map((l) => (
                  <li key={l} className="flex items-start gap-3 text-[0.9375rem]">
                    <span aria-hidden className="mt-2 h-2 w-2 shrink-0 bg-chantier" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Admissions() {
  const etapes = [
    ["Créer un compte", "Une adresse email suffit. Le dossier se remplit depuis un téléphone."],
    ["Constituer le dossier", "Pièces numérisées ou photographiées, à déposer en ligne."],
    [
      "Régler les frais",
      `Frais d'inscription : ${admission.fraisInscription}. La référence du paiement est jointe au dossier.`,
    ],
    ["Suivre la décision", "L'état du dossier et les demandes de complément sont notifiés."],
  ];
  return (
    <section className="conteneur py-20 lg:py-28">
      <EnteteSection
        numero="04"
        surtitre="Admissions"
        titre="Candidater sans se déplacer"
        intro="Le dossier de candidature se constitue en ligne. Chaque étape est suivie et chaque décision notifiée."
      />
      <div className="mt-14 grid gap-12 lg:grid-cols-12">
        <ol className="grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2 lg:col-span-7">
          {etapes.map(([titre, texte], i) => (
            <li
              key={titre}
              className="revele bg-papier p-6"
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className="font-mono text-xs text-ispt-600">Étape {i + 1}</span>
              <p className="mt-3 font-serif text-xl text-encre">{titre}</p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-pierre-600">{texte}</p>
            </li>
          ))}
        </ol>
        <div className="revele lg:col-span-5">
          <h3 className="font-sans text-sm font-medium tracking-wide text-pierre-500 uppercase">
            Pièces du dossier
          </h3>
          <ul className="mt-4 divide-y divide-pierre-200 border-y border-pierre-200">
            {admission.pieces.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 py-2.5 text-[0.9375rem] text-pierre-800"
              >
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ispt-600" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <LienBouton href={lienCandidature}>Déposer ma candidature</LienBouton>
            <LienBouton href="/admissions" variante="contour">
              En savoir plus
            </LienBouton>
          </div>
        </div>
      </div>
    </section>
  );
}

function Anciens() {
  return (
    <section className="border-y border-pierre-200 bg-white">
      <div className="conteneur grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <EnteteSection
            numero="05"
            surtitre="Débouchés"
            titre="Où exercent nos diplômés"
            intro="Les anciens de l'institut travaillent dans l'énergie, l'eau, les télécommunications, la finance et l'industrie, ou enseignent dans les écoles techniques de la région."
          />
          <figure className="revele-image relative mt-10 aspect-[3/2] overflow-hidden rounded-md">
            <Image
              src="/photos/collation-2026-laureats-exterieur.jpg"
              alt="Cinq lauréats en costume, casque et gilet, lors de la collation des grades 2026."
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
            <Legende>Lauréats 2026</Legende>
          </figure>
        </div>
        <div className="revele grid gap-12 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
          <div>
            <h3 className="surtitre !font-mono">Parcours professionnel</h3>
            <ul className="mt-5 space-y-3">
              {debouchesAnciens.professionnels.map((d) => (
                <li
                  key={d}
                  className="border-b border-pierre-200 pb-3 font-serif text-xl text-encre"
                >
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="surtitre !font-mono">Parcours pédagogique</h3>
            <ul className="mt-5 space-y-3">
              {debouchesAnciens.enseignement.map((d) => (
                <li
                  key={d}
                  className="border-b border-pierre-200 pb-3 font-serif text-xl text-encre"
                >
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Autorites() {
  return (
    <section className="conteneur py-20 lg:py-28">
      <EnteteSection numero="06" surtitre="Gouvernance" titre="Autorités académiques" />
      <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 md:grid-cols-3">
        {autorites.map((a, i) => (
          <li
            key={a.fonction}
            className="revele bg-papier p-8"
            style={{ "--i": i } as React.CSSProperties}
          >
            <p className="surtitre !font-mono text-pierre-500">{a.fonction}</p>
            <p className="mt-4 font-serif text-2xl leading-snug text-encre">{a.nom}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact() {
  return (
    <section className="border-t border-pierre-200 bg-pierre-100">
      <div className="conteneur grid gap-10 py-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p className="surtitre">Nous rendre visite</p>
          <p className="mt-4 font-serif text-3xl leading-snug text-encre sm:text-4xl">
            {institut.adresse.rue}, {institut.adresse.quartier}, {institut.adresse.commune} —{" "}
            {institut.adresse.ville}.
          </p>
          <p className="mt-3 text-pierre-600">{institut.adresse.reperes}.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
          <LienBouton
            href={`https://www.openstreetmap.org/?mlat=${institut.coordonnees.latitude}&mlon=${institut.coordonnees.longitude}#map=18/${institut.coordonnees.latitude}/${institut.coordonnees.longitude}`}
            variante="institutionnel"
            target="_blank"
            rel="noopener"
          >
            <MapPin aria-hidden /> Itinéraire
          </LienBouton>
          <LienBouton href={institut.contacts.telephone.lien} variante="contour">
            <Phone aria-hidden /> {institut.contacts.telephone.affichage}
          </LienBouton>
        </div>
      </div>
    </section>
  );
}

export default function Accueil() {
  return (
    <>
      <Accroche />
      <Institut />
      <Formations />
      <Stages />
      <Admissions />
      <EnImages />
      <Anciens />
      <Autorites />
      <Contact />
    </>
  );
}
