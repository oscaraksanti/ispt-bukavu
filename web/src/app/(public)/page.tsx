import { ArrowRight, Check, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { lienCandidature } from "@/components/public/navigation";
import { CarteActualite } from "@/components/public/carte-actualite";
import { Legende, Photo } from "@/components/public/photo";
import { LienBouton } from "@/components/ui/bouton";
import { EnteteSection, FiletCote, LienFleche } from "@/components/ui/elements";
import {
  type ActualiteResume,
  type AutoritePublique,
  type FilierePublique,
  type Institut as DonneesInstitut,
  lireActualites,
  lireAutorites,
  lireFilieres,
  lireInstitut,
  lirePage,
  lirePartenaires,
  type Partenaires,
} from "@/features/contenu/lecture";
import { type LecteurBloc, lecteur } from "@/features/contenu/lecteur";

type Style = React.CSSProperties;

const MOSAIQUE = [
  {
    classe: "col-span-4 row-span-4",
    sizes: "(min-width: 1024px) 400px, 66vw",
    parallaxe: "-24px",
    position: "",
  },
  {
    classe: "col-span-2 row-span-3",
    sizes: "(min-width: 1024px) 200px, 33vw",
    parallaxe: "-56px",
    position: "",
  },
  {
    classe: "col-span-2 row-span-3",
    sizes: "(min-width: 1024px) 200px, 33vw",
    parallaxe: "-40px",
    position: "",
  },
  {
    classe: "col-span-4 row-span-2",
    sizes: "(min-width: 1024px) 400px, 66vw",
    parallaxe: "-16px",
    position: "object-[50%_35%]",
  },
];

function Accroche({ bloc, institut }: { bloc: LecteurBloc; institut: DonneesInstitut }) {
  const chiffres = bloc.liste("chiffres");
  const photos = bloc.liste("photos");
  return (
    <section className="trame relative overflow-hidden border-b border-pierre-200">
      <div className="conteneur grid gap-12 py-12 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="surtitre entree flex items-center gap-3">
            <span>{bloc.texte("surtitre")}</span>
            <FiletCote className="w-8" />
            <span>Depuis {institut.anneeOuverture}</span>
          </p>
          <h1
            className="entree mt-6 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.5rem]"
            style={{ "--i": 1 } as Style}
          >
            {bloc.texte("titreDebut")}
            <br />
            <span className="relative">
              {bloc.texte("titreSouligne")}
              <span
                aria-hidden
                className="entree-trait absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.28em] bg-chantier"
              />
            </span>{" "}
            {bloc.texte("titreFin")}
          </h1>
          <p
            className="entree mt-6 max-w-xl text-lg leading-relaxed text-pierre-700"
            style={{ "--i": 2 } as Style}
          >
            {bloc.texte("texte")}
          </p>
          <div className="entree mt-8 flex flex-wrap gap-3" style={{ "--i": 3 } as Style}>
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
          {chiffres.length > 0 && (
            <dl
              className="entree mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-pierre-300 pt-6"
              style={{ "--i": 4 } as Style}
            >
              {chiffres.map((c, i) => (
                <div key={i}>
                  <dt className="sr-only">{c.texte("libelle")}</dt>
                  <dd>
                    <span className="block font-serif text-4xl text-encre">
                      {c.texte("valeur")}
                    </span>
                    <span className="mt-1 block text-sm text-pierre-600">{c.texte("libelle")}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="relative lg:col-span-6">
          <div
            className="grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4"
            style={{ aspectRatio: "1 / 1" }}
          >
            {MOSAIQUE.map((case_, i) => {
              const p = photos[i];
              return (
                <figure
                  key={i}
                  className={`entree-image relative overflow-hidden rounded-md ${case_.classe}`}
                  style={{ "--i": i, "--parallaxe": case_.parallaxe } as Style}
                >
                  <Photo
                    image={p?.image("image") ?? null}
                    sizes={case_.sizes}
                    className={`parallaxe ${case_.position}`}
                    prioritaire={i === 0}
                  />
                  <Legende>{p?.texte("legende")}</Legende>
                </figure>
              );
            })}
          </div>
          <p className="mt-4 text-right font-mono text-[0.6875rem] tracking-wide text-pierre-500 uppercase">
            {institut.coordonnees}
          </p>
        </div>
      </div>
    </section>
  );
}

function Institut({ bloc, institut }: { bloc: LecteurBloc; institut: DonneesInstitut }) {
  const fiche = [
    ["Statut", institut.statut],
    ["Création", institut.dateCreation],
    ["Acte", institut.acteCreation],
    ["Ouverture", institut.anneeOuverture],
    ["Études", `${institut.systemeEtudes} · ${institut.semestres} semestres`],
    ["Diplôme", institut.diplome],
    ["Siège", `${institut.rue}, ${institut.ville}`],
  ].filter(([, valeur]) => valeur);
  return (
    <section className="conteneur py-20 lg:py-28">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 self-start lg:sticky lg:top-36 lg:col-span-6">
          <EnteteSection numero="01" surtitre="L'institut" titre={bloc.texte("titre")} />
          <p className="mt-8 text-lg leading-relaxed text-pierre-700">{institut.mission}</p>
          <div className="mt-8">
            <LienFleche href="/institut">Présentation de l&apos;institut</LienFleche>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-5 lg:col-start-8">
          <figure className="revele-image relative aspect-[4/3] overflow-hidden rounded-md">
            <Photo
              image={bloc.image("photo")}
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-[50%_30%]"
            />
            <Legende>{bloc.texte("legende")}</Legende>
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

const DISPOSITION_IMAGES = ["col-span-2 row-span-2", "", "", "", ""];

function EnImages({ bloc }: { bloc: LecteurBloc }) {
  const photos = bloc.liste("photos");
  if (photos.length === 0) return null;
  return (
    <section aria-label="L'institut en images" className="bg-encre py-3">
      <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 px-3 sm:auto-rows-[13rem] md:grid-cols-4 lg:auto-rows-[15rem]">
        {photos.map((p, i) => (
          <figure
            key={i}
            className={`revele-image relative overflow-hidden ${DISPOSITION_IMAGES[i] ?? ""}`}
            style={{ "--i": i } as Style}
          >
            <Photo image={p.image("image")} sizes="(min-width: 768px) 50vw, 100vw" />
            <Legende>{p.texte("legende")}</Legende>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Formations({ bloc, filieres }: { bloc: LecteurBloc; filieres: FilierePublique[] }) {
  return (
    <section className="border-y border-pierre-200 bg-white">
      <div className="conteneur py-20 lg:py-28">
        <EnteteSection
          numero="02"
          surtitre="Formations"
          titre={bloc.texte("titre")}
          intro={bloc.texte("intro")}
          action={<LienFleche href="/formations">Toutes les formations</LienFleche>}
        />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2 lg:grid-cols-4">
          {filieres.map((f, i) => (
            <li key={f.slug} className="revele bg-white" style={{ "--i": i } as Style}>
              <Link href={`/formations/${f.slug}`} className="group flex h-full flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Photo
                    image={f.photo}
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                    className="transition-transform duration-300 ease-doux group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-mono text-xs text-pierre-500">
                    {String(i + 1).padStart(2, "0")}
                  </p>
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

function Stages({
  bloc,
  textes,
  partenaires,
}: {
  bloc: LecteurBloc;
  textes: LecteurBloc;
  partenaires: Partenaires;
}) {
  const blocs = [
    {
      titre: textes.texte("titrePedagogique"),
      description: textes.texte("textePedagogique"),
      lieux: partenaires.stagePedagogique,
    },
    {
      titre: textes.texte("titreProfessionnel"),
      description: textes.texte("texteProfessionnel"),
      lieux: partenaires.stageProfessionnel,
    },
  ];
  return (
    <section className="trame-claire bg-encre text-white">
      <div className="conteneur grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <EnteteSection
            clair
            numero="03"
            surtitre="Sur le terrain"
            titre={bloc.texte("titre")}
            intro={bloc.texte("intro")}
          />
          <figure className="revele-image relative mt-10 aspect-[4/3] overflow-hidden rounded-md">
            <Photo image={bloc.image("photo")} sizes="(min-width: 1024px) 480px, 100vw" />
            <Legende>{bloc.texte("legende")}</Legende>
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

function Admissions({ bloc, pieces }: { bloc: LecteurBloc; pieces: LecteurBloc }) {
  return (
    <section className="conteneur py-20 lg:py-28">
      <EnteteSection
        numero="04"
        surtitre="Admissions"
        titre={bloc.texte("titre")}
        intro={bloc.texte("intro")}
      />
      <div className="mt-14 grid gap-12 lg:grid-cols-12">
        <ol className="grid gap-px self-start overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 sm:grid-cols-2 lg:col-span-7">
          {bloc.liste("etapes").map((e, i) => (
            <li key={i} className="revele bg-papier p-6" style={{ "--i": i } as Style}>
              <span className="font-mono text-xs text-ispt-600">Étape {i + 1}</span>
              <p className="mt-3 font-serif text-xl text-encre">{e.texte("titre")}</p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-pierre-600">
                {e.texte("texte")}
              </p>
            </li>
          ))}
        </ol>
        <div className="revele lg:col-span-5">
          <h3 className="font-sans text-sm font-medium tracking-wide text-pierre-500 uppercase">
            Pièces du dossier
          </h3>
          <ul className="mt-4 divide-y divide-pierre-200 border-y border-pierre-200">
            {pieces.liste("liste").map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-3 py-2.5 text-[0.9375rem] text-pierre-800"
              >
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ispt-600" />
                {p.texte("libelle")}
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

function Anciens({ bloc, partenaires }: { bloc: LecteurBloc; partenaires: Partenaires }) {
  const colonnes = [
    { titre: "Parcours professionnel", liste: partenaires.employeurs },
    { titre: "Parcours pédagogique", liste: partenaires.institutionnels },
  ].filter((c) => c.liste.length > 0);
  return (
    <section className="border-y border-pierre-200 bg-white">
      <div className="conteneur grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <EnteteSection
            numero="05"
            surtitre="Débouchés"
            titre={bloc.texte("titre")}
            intro={bloc.texte("intro")}
          />
          <figure className="revele-image relative mt-10 aspect-[3/2] overflow-hidden rounded-md">
            <Photo image={bloc.image("photo")} sizes="(min-width: 1024px) 480px, 100vw" />
            <Legende>{bloc.texte("legende")}</Legende>
          </figure>
        </div>
        <div className="revele grid gap-12 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
          {colonnes.map((c) => (
            <div key={c.titre}>
              <h3 className="surtitre !font-mono">{c.titre}</h3>
              <ul className="mt-5 space-y-3">
                {c.liste.map((d) => (
                  <li
                    key={d}
                    className="border-b border-pierre-200 pb-3 font-serif text-xl text-encre"
                  >
                    {d}
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

function Actualites({ actualites }: { actualites: ActualiteResume[] }) {
  if (actualites.length === 0) return null;
  return (
    <section className="conteneur py-20 lg:py-28">
      <EnteteSection
        numero="06"
        surtitre="Actualités"
        titre="Dernières nouvelles de l'institut"
        action={<LienFleche href="/actualites">Toutes les actualités</LienFleche>}
      />
      <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {actualites.map((a, i) => (
          <CarteActualite key={a.slug} actualite={a} index={i} />
        ))}
      </div>
    </section>
  );
}

function Autorites({ autorites, numero }: { autorites: AutoritePublique[]; numero: string }) {
  if (autorites.length === 0) return null;
  return (
    <section className="conteneur py-20 lg:py-28">
      <EnteteSection numero={numero} surtitre="Gouvernance" titre="Autorités académiques" />
      <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-pierre-200 bg-pierre-200 md:grid-cols-3">
        {autorites.map((a, i) => (
          <li key={a.id} className="revele bg-papier p-8" style={{ "--i": i } as Style}>
            <p className="surtitre !font-mono text-pierre-500">{a.fonction}</p>
            <p className="mt-4 font-serif text-2xl leading-snug text-encre">{a.nom}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact({ institut }: { institut: DonneesInstitut }) {
  const { latitudeNombre: lat, longitudeNombre: lon } = institut;
  return (
    <section className="border-t border-pierre-200 bg-pierre-100">
      <div className="conteneur grid gap-10 py-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p className="surtitre">Nous rendre visite</p>
          <p className="mt-4 font-serif text-3xl leading-snug text-encre sm:text-4xl">
            {institut.rue}, {institut.quartier}, {institut.commune} — {institut.ville}.
          </p>
          {institut.reperes && <p className="mt-3 text-pierre-600">{institut.reperes}.</p>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
          <LienBouton
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`}
            variante="institutionnel"
            target="_blank"
            rel="noopener"
          >
            <MapPin aria-hidden /> Itinéraire
          </LienBouton>
          {institut.telephone && (
            <LienBouton href={institut.telephoneLien} variante="contour">
              <Phone aria-hidden /> {institut.telephone}
            </LienBouton>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function Accueil() {
  const [page, pageInstitut, institut, filieres, autorites, partenaires, actualites] =
    await Promise.all([
      lirePage("accueil"),
      lirePage("institut"),
      lireInstitut(),
      lireFilieres(),
      lireAutorites(),
      lirePartenaires(),
      lireActualites(1),
    ]);
  const bloc = (cle: string) => lecteur(page[cle]);
  const visible = (cle: string) => bloc(cle).visible;
  const pieces = lecteur((await lirePage("admissions")).pieces);

  return (
    <>
      {visible("accroche") && <Accroche bloc={bloc("accroche")} institut={institut} />}
      {visible("institut") && <Institut bloc={bloc("institut")} institut={institut} />}
      {visible("formations") && <Formations bloc={bloc("formations")} filieres={filieres} />}
      {visible("stages") && (
        <Stages
          bloc={bloc("stages")}
          textes={lecteur(pageInstitut.stages)}
          partenaires={partenaires}
        />
      )}
      {visible("admissions") && <Admissions bloc={bloc("admissions")} pieces={pieces} />}
      {visible("images") && <EnImages bloc={bloc("images")} />}
      {visible("debouches") && <Anciens bloc={bloc("debouches")} partenaires={partenaires} />}
      <Actualites actualites={actualites.actualites.slice(0, 3)} />
      <Autorites autorites={autorites} numero={actualites.actualites.length > 0 ? "07" : "06"} />
      <Contact institut={institut} />
    </>
  );
}
