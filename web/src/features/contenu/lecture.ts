import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import {
  autorites as autoritesInitiales,
  debouchesAnciens,
  filieres as filieresInitiales,
  stages as stagesInitiaux,
} from "@/contenu/institut";
import { PHOTOS_OFFICIELLES } from "@/features/medias/photos-officielles";
import { type ImageResolue, urlMedia } from "@/features/medias/url";
import { definitionPage } from "./definitions";
import { type DonneesBloc, fusionnerBloc, imagesDuBloc, remplacerImages } from "./donnees";
import { lienTelephone, lienWhatsapp, REGLAGES_INSTITUT, type ReglagesInstitut } from "./reglages";

/**
 * Lecture des contenus publics, mise en cache et invalidée à chaque
 * modification dans l'administration (étiquettes ci-dessous).
 *
 * En cas d'indisponibilité de la base, le site affiche les contenus officiels
 * de référence plutôt qu'une erreur, et retente rapidement.
 */
export const ETIQUETTES = {
  contenu: "contenu",
  page: (slug: string) => `page:${slug}`,
  reglages: "reglages",
  filieres: "filieres",
  autorites: "autorites",
  partenaires: "partenaires",
  medias: "medias",
  actualites: "actualites",
  agenda: "agenda",
  faq: "faq",
} as const;

function signalerPanne(origine: string, erreur: unknown) {
  const detail = erreur instanceof Error ? erreur.message.split("\n")[0] : String(erreur);
  console.error(
    `[contenu] ${origine} : base indisponible, contenu de référence affiché (${detail}).`,
  );
}

/* ---------- Images ---------- */

const PREFIXE_PHOTO = "photo:";

function versImage(m: {
  id: string;
  cle: string;
  texteAlternatif: string;
  largeur: number | null;
  hauteur: number | null;
}): ImageResolue {
  return {
    id: m.id,
    url: urlMedia(m.cle),
    alt: m.texteAlternatif,
    largeur: m.largeur,
    hauteur: m.hauteur,
  };
}

function photoDeSecours(reference: string): ImageResolue | null {
  if (!reference.startsWith(PREFIXE_PHOTO)) return null;
  const fichier = reference.slice(PREFIXE_PHOTO.length);
  if (!(fichier in PHOTOS_OFFICIELLES)) return null;
  return {
    id: reference,
    url: `/photos/${fichier}`,
    alt: PHOTOS_OFFICIELLES[fichier],
    largeur: null,
    hauteur: null,
  };
}

/** Résout des identifiants de médias (ou jetons « photo:fichier ») en images. */
async function resoudreImages(references: string[]) {
  const ids = references.filter((r) => !r.startsWith(PREFIXE_PHOTO));
  const cles = references
    .filter((r) => r.startsWith(PREFIXE_PHOTO))
    .map((r) => `public/photos/${r.slice(PREFIXE_PHOTO.length)}`);
  const resultat = new Map<string, ImageResolue>();
  if (ids.length + cles.length === 0) return resultat;
  const medias = await db.media.findMany({
    where: { OR: [{ id: { in: ids } }, { cle: { in: cles } }] },
  });
  for (const m of medias) {
    const image = versImage(m);
    resultat.set(m.id, image);
    if (m.cle.startsWith("public/photos/"))
      resultat.set(PREFIXE_PHOTO + m.cle.slice("public/photos/".length), image);
  }
  return resultat;
}

/* ---------- Pages ---------- */

export type ContenuPage = Record<string, DonneesBloc & { visible: boolean }>;

function pageDeSecours(slug: string): ContenuPage {
  const definition = definitionPage(slug);
  if (!definition) return {};
  return Object.fromEntries(
    definition.blocs.map((bloc) => [
      bloc.cle,
      {
        ...remplacerImages(bloc, fusionnerBloc(bloc, bloc.defaut), photoDeSecours),
        visible: true,
      },
    ]),
  );
}

export async function lirePage(slug: string): Promise<ContenuPage> {
  "use cache";
  cacheTag(ETIQUETTES.contenu, ETIQUETTES.page(slug), ETIQUETTES.medias);
  const definition = definitionPage(slug);
  if (!definition) {
    cacheLife("max");
    return {};
  }
  try {
    const page = await db.page.findUnique({ where: { slug }, include: { blocs: true } });
    const blocs = definition.blocs.map((bloc) => {
      const enregistre = page?.blocs.find((b) => b.cle === bloc.cle);
      return {
        bloc,
        visible: enregistre?.visible ?? true,
        donnees: fusionnerBloc(bloc, enregistre?.donnees ?? bloc.defaut),
      };
    });
    const images = await resoudreImages(
      blocs.flatMap(({ bloc, donnees }) => imagesDuBloc(bloc, donnees)),
    );
    cacheLife("max");
    return Object.fromEntries(
      blocs.map(({ bloc, visible, donnees }) => [
        bloc.cle,
        {
          ...remplacerImages(bloc, donnees, (r) => images.get(r) ?? photoDeSecours(r)),
          visible,
        },
      ]),
    );
  } catch (erreur) {
    signalerPanne(`page ${slug}`, erreur);
    cacheLife("minutes");
    return pageDeSecours(slug);
  }
}

/* ---------- Réglages de l'institut ---------- */

export type Institut = ReglagesInstitut & {
  telephoneLien: string;
  whatsappLien: string;
  latitudeNombre: number;
  longitudeNombre: number;
};

function completerInstitut(valeurs: unknown): Institut {
  const fusion = fusionnerBloc(REGLAGES_INSTITUT, valeurs) as ReglagesInstitut;
  return {
    ...fusion,
    telephoneLien: lienTelephone(fusion.telephone),
    whatsappLien: lienWhatsapp(fusion.whatsapp),
    latitudeNombre: Number.parseFloat(fusion.latitude) || 0,
    longitudeNombre: Number.parseFloat(fusion.longitude) || 0,
  };
}

export async function lireInstitut(): Promise<Institut> {
  "use cache";
  cacheTag(ETIQUETTES.reglages);
  try {
    const reglage = await db.reglage.findUnique({ where: { cle: REGLAGES_INSTITUT.cle } });
    cacheLife("max");
    return completerInstitut(reglage?.valeur ?? REGLAGES_INSTITUT.defaut);
  } catch (erreur) {
    signalerPanne("réglages", erreur);
    cacheLife("minutes");
    return completerInstitut(REGLAGES_INSTITUT.defaut);
  }
}

/* ---------- Filières ---------- */

export type FilierePublique = {
  slug: string;
  nom: string;
  nomCourt: string;
  accroche: string;
  presentation: string;
  domaines: string[];
  metiers: string[];
  debouches: string;
  entreprendre: string;
  photo: ImageResolue | null;
};

function filieresDeSecours(): FilierePublique[] {
  return filieresInitiales.map((f) => ({
    slug: f.slug,
    nom: f.nom,
    nomCourt: f.nomCourt,
    accroche: f.accroche,
    presentation: f.presentation,
    domaines: [...f.domaines],
    metiers: [...f.metiers],
    debouches: f.debouches,
    entreprendre: f.entreprendre,
    photo: photoDeSecours(PREFIXE_PHOTO + f.photo.src.split("/").pop()),
  }));
}

/** Filières publiées (ouvertes), dans l'ordre défini par l'administration. */
export async function lireFilieres(): Promise<FilierePublique[]> {
  "use cache";
  cacheTag(ETIQUETTES.filieres, ETIQUETTES.medias);
  try {
    const lignes = await db.filiere.findMany({
      where: { ouverte: true },
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
      include: { photo: true },
    });
    cacheLife("max");
    return lignes.map((f) => ({
      slug: f.slug,
      nom: f.nom,
      nomCourt: f.nomCourt,
      accroche: f.accroche,
      presentation: f.presentation,
      domaines: f.domaines,
      metiers: f.metiers,
      debouches: f.debouches,
      entreprendre: f.entreprendre,
      photo: f.photo ? versImage(f.photo) : null,
    }));
  } catch (erreur) {
    signalerPanne("filières", erreur);
    cacheLife("minutes");
    return filieresDeSecours();
  }
}

/* ---------- Autorités ---------- */

export type AutoritePublique = { id: string; fonction: string; nom: string };

export async function lireAutorites(): Promise<AutoritePublique[]> {
  "use cache";
  cacheTag(ETIQUETTES.autorites);
  try {
    const lignes = await db.autorite.findMany({
      where: { visible: true },
      orderBy: { ordre: "asc" },
    });
    cacheLife("max");
    return lignes.map(({ id, fonction, nom }) => ({ id, fonction, nom }));
  } catch (erreur) {
    signalerPanne("autorités", erreur);
    cacheLife("minutes");
    return autoritesInitiales.map((a, i) => ({ id: String(i), fonction: a.fonction, nom: a.nom }));
  }
}

/* ---------- Partenaires ---------- */

export type Partenaires = {
  stageProfessionnel: string[];
  stagePedagogique: string[];
  employeurs: string[];
  institutionnels: string[];
};

export async function lirePartenaires(): Promise<Partenaires> {
  "use cache";
  cacheTag(ETIQUETTES.partenaires);
  try {
    const lignes = await db.partenaire.findMany({
      where: { visible: true },
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    });
    const de = (categorie: string) =>
      lignes.filter((p) => p.categorie === categorie).map((p) => p.nom);
    cacheLife("max");
    return {
      stageProfessionnel: de("STAGE_PROFESSIONNEL"),
      stagePedagogique: de("STAGE_PEDAGOGIQUE"),
      employeurs: de("EMPLOYEUR"),
      institutionnels: de("INSTITUTIONNEL"),
    };
  } catch (erreur) {
    signalerPanne("partenaires", erreur);
    cacheLife("minutes");
    return {
      stageProfessionnel: [...stagesInitiaux.professionnel.lieux],
      stagePedagogique: [...stagesInitiaux.pedagogique.lieux],
      employeurs: [...debouchesAnciens.professionnels],
      institutionnels: [...debouchesAnciens.enseignement],
    };
  }
}

/* ---------- Actualités ---------- */

export type ActualiteResume = {
  slug: string;
  titre: string;
  resume: string;
  publieLe: string;
  couverture: ImageResolue | null;
};

export type ActualiteComplete = ActualiteResume & { contenu: string; majLe: string };

export const ACTUALITES_PAR_PAGE = 9;

export async function lireActualites(
  page = 1,
): Promise<{ actualites: ActualiteResume[]; total: number }> {
  "use cache";
  cacheTag(ETIQUETTES.actualites, ETIQUETTES.medias);
  try {
    const where = { statut: "PUBLIE" as const, publieLe: { not: null } };
    const [total, lignes] = await Promise.all([
      db.actualite.count({ where }),
      db.actualite.findMany({
        where,
        orderBy: { publieLe: "desc" },
        skip: (page - 1) * ACTUALITES_PAR_PAGE,
        take: ACTUALITES_PAR_PAGE,
        include: { couverture: true },
      }),
    ]);
    cacheLife("max");
    return {
      total,
      actualites: lignes.map((a) => ({
        slug: a.slug,
        titre: a.titre,
        resume: a.resume,
        publieLe: a.publieLe!.toISOString(),
        couverture: a.couverture ? versImage(a.couverture) : null,
      })),
    };
  } catch (erreur) {
    signalerPanne("actualités", erreur);
    cacheLife("minutes");
    return { actualites: [], total: 0 };
  }
}

export async function lireActualite(slug: string): Promise<ActualiteComplete | null> {
  "use cache";
  cacheTag(ETIQUETTES.actualites, ETIQUETTES.medias);
  try {
    const a = await db.actualite.findUnique({ where: { slug }, include: { couverture: true } });
    cacheLife("max");
    if (!a || a.statut !== "PUBLIE" || !a.publieLe) return null;
    return {
      slug: a.slug,
      titre: a.titre,
      resume: a.resume,
      contenu: a.contenu,
      publieLe: a.publieLe.toISOString(),
      majLe: a.majLe.toISOString(),
      couverture: a.couverture ? versImage(a.couverture) : null,
    };
  } catch (erreur) {
    signalerPanne("actualité", erreur);
    cacheLife("minutes");
    return null;
  }
}

/* ---------- Agenda ---------- */

export type EvenementPublic = {
  id: string;
  titre: string;
  description: string | null;
  debut: string;
  fin: string | null;
  lieu: string | null;
};

/** Événements publiés à venir (ou en cours), du plus proche au plus lointain. */
export async function lireAgenda(): Promise<EvenementPublic[]> {
  "use cache";
  cacheTag(ETIQUETTES.agenda);
  try {
    const maintenant = new Date();
    // Un événement sans heure de fin reste affiché le jour même.
    const ilYaDouzeHeures = new Date(maintenant.getTime() - 12 * 3600 * 1000);
    const lignes = await db.evenement.findMany({
      where: {
        statut: "PUBLIE",
        OR: [{ fin: { gte: maintenant } }, { fin: null, debut: { gte: ilYaDouzeHeures } }],
      },
      orderBy: { debut: "asc" },
      take: 12,
    });
    cacheLife("hours");
    return lignes.map((e) => ({
      id: e.id,
      titre: e.titre,
      description: e.description,
      debut: e.debut.toISOString(),
      fin: e.fin?.toISOString() ?? null,
      lieu: e.lieu,
    }));
  } catch (erreur) {
    signalerPanne("agenda", erreur);
    cacheLife("minutes");
    return [];
  }
}

/* ---------- Questions fréquentes ---------- */

export type QuestionPublique = { id: string; question: string; reponse: string };

export async function lireFaq(rubrique = "admissions"): Promise<QuestionPublique[]> {
  "use cache";
  cacheTag(ETIQUETTES.faq);
  try {
    const lignes = await db.questionFrequente.findMany({
      where: { rubrique, visible: true },
      orderBy: { ordre: "asc" },
    });
    cacheLife("max");
    return lignes.map(({ id, question, reponse }) => ({ id, question, reponse }));
  } catch (erreur) {
    signalerPanne("questions fréquentes", erreur);
    cacheLife("minutes");
    return [];
  }
}
