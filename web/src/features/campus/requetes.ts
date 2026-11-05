import "server-only";
import { libellePromotion } from "@/features/academique/regles";
import type { ProfilComplet } from "@/features/messagerie/acces";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { type Lecteur, peutVoir } from "./regles";

/** Lecteur du Campus à partir du profil de messagerie et des permissions. */
export function lecteurDe(profil: ProfilComplet, permissions: Set<string>): Lecteur {
  return {
    id: profil.id,
    personnel: profil.personnel,
    moderateur: permissions.has("messagerie.moderer"),
    filieres: [...new Set([...profil.filieres, ...profil.filieresEnseignees])],
    promotions: [...new Set([...profil.promotions, ...profil.promotionsEnseignees])],
  };
}

/** Condition Prisma équivalente à `peutVoir` pour une publication publiée. */
function visibles(l: Lecteur): Prisma.PublicationWhereInput {
  const base: Prisma.PublicationWhereInput = { supprimeLe: null };
  const publiee: Prisma.PublicationWhereInput = { statut: "PUBLIEE", masqueLe: null };
  if (l.personnel || l.moderateur) return { ...base, OR: [publiee, { auteurId: l.id }] };
  return {
    ...base,
    OR: [
      { auteurId: l.id },
      {
        ...publiee,
        OR: [
          { audience: "INSTITUT" },
          { audience: "FILIERE", filiereId: { in: l.filieres } },
          { audience: "PROMOTION", promotionId: { in: l.promotions } },
        ],
      },
    ],
  };
}

export type FiltreFil = "tout" | "institut" | "filiere" | "promotion" | "enregistres" | "miennes";

export const FILTRES: { cle: FiltreFil; libelle: string }[] = [
  { cle: "tout", libelle: "Tout" },
  { cle: "institut", libelle: "Institut" },
  { cle: "filiere", libelle: "Ma filière" },
  { cle: "promotion", libelle: "Ma promotion" },
  { cle: "enregistres", libelle: "Enregistrés" },
  { cle: "miennes", libelle: "Mes publications" },
];

const INCLURE = (moi: string) =>
  ({
    auteur: {
      select: {
        id: true,
        prenom: true,
        nom: true,
        roles: { select: { role: { select: { code: true, libelle: true } } } },
        profilEtudiant: {
          select: {
            inscriptions: {
              where: { promotion: { annee: { courante: true } } },
              select: { promotion: { include: { filiere: true, niveau: true } } },
              take: 1,
            },
          },
        },
      },
    },
    filiere: { select: { nomCourt: true } },
    promotion: { include: { filiere: true, niveau: true } },
    medias: {
      orderBy: { ordre: "asc" },
      select: {
        media: { select: { id: true, largeur: true, hauteur: true, texteAlternatif: true } },
      },
    },
    reactions: { where: { utilisateurId: moi }, select: { utilisateurId: true } },
    enregistrements: { where: { utilisateurId: moi }, select: { utilisateurId: true } },
    _count: {
      select: {
        reactions: true,
        commentaires: { where: { supprimeLe: null, masqueLe: null } },
      },
    },
  }) satisfies Prisma.PublicationInclude;

type PublicationBrute = Prisma.PublicationGetPayload<{ include: ReturnType<typeof INCLURE> }>;

const nom = (u: { prenom: string | null; nom: string } | null) =>
  u ? [u.prenom, u.nom].filter(Boolean).join(" ") : "Compte supprimé";

/** « BAC2 Génie Informatique », « Enseignant », « Communication »… */
function qualiteAuteur(a: PublicationBrute["auteur"]) {
  if (!a) return "";
  const inscription = a.profilEtudiant?.inscriptions[0];
  if (inscription) return libellePromotion(inscription.promotion);
  const roles = a.roles.map((r) => r.role).filter((r) => r.code !== "etudiant");
  return roles.map((r) => r.libelle).join(", ");
}

/** Noms affichés des personnes mentionnées (« Prénom Nom »). */
async function nomsMentionnes(ids: string[]) {
  const uniques = [...new Set(ids)];
  if (!uniques.length) return new Map<string, string>();
  const comptes = await db.utilisateur.findMany({
    where: { id: { in: uniques } },
    select: { id: true, prenom: true, nom: true },
  });
  return new Map(comptes.map((c) => [c.id, [c.prenom, c.nom].filter(Boolean).join(" ")]));
}

function versCarte(p: PublicationBrute, l: Lecteur, noms: Map<string, string>) {
  return {
    id: p.id,
    auteurId: p.auteurId,
    auteur: nom(p.auteur),
    qualite: qualiteAuteur(p.auteur),
    initiales: nom(p.auteur)
      .split(" ")
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join(""),
    moi: p.auteurId === l.id,
    contenu: p.contenu,
    audience: p.audience,
    cible:
      p.audience === "FILIERE"
        ? (p.filiere?.nomCourt ?? "")
        : p.audience === "PROMOTION" && p.promotion
          ? libellePromotion(p.promotion)
          : "",
    statut: p.statut,
    masque: !!p.masqueLe,
    epingle: !!p.epingleLe,
    commentairesFermes: p.commentairesFermes,
    creeLe: p.creeLe,
    modifie: !!p.modifieLe,
    photos: p.medias.map((m) => ({
      id: m.media.id,
      largeur: m.media.largeur,
      hauteur: m.media.hauteur,
      alt: m.media.texteAlternatif,
    })),
    jaimes: p._count.reactions,
    aime: p.reactions.length > 0,
    enregistre: p.enregistrements.length > 0,
    commentaires: p._count.commentaires,
    mentions: p.mentions.map((id) => noms.get(id)).filter((n): n is string => !!n),
  };
}

export type CartePublication = ReturnType<typeof versCarte>;

export const PAR_PAGE = 15;

/** Fil du Campus : épinglées d'abord (sur « Tout »), puis les plus récentes. */
export async function fil(l: Lecteur, filtre: FiltreFil, avant?: Date) {
  const condition: Prisma.PublicationWhereInput[] = [visibles(l)];
  if (filtre === "institut") condition.push({ audience: "INSTITUT" });
  if (filtre === "filiere") condition.push({ audience: "FILIERE" });
  if (filtre === "promotion") condition.push({ audience: "PROMOTION" });
  if (filtre === "enregistres")
    condition.push({ enregistrements: { some: { utilisateurId: l.id } } });
  if (filtre === "miennes") condition.push({ auteurId: l.id });
  const [epinglees, publications] = await Promise.all([
    filtre === "tout" && !avant
      ? db.publication.findMany({
          where: { AND: [...condition, { epingleLe: { not: null } }] },
          include: INCLURE(l.id),
          orderBy: { epingleLe: "desc" },
          take: 3,
        })
      : [],
    db.publication.findMany({
      where: {
        AND: [
          ...condition,
          ...(filtre === "tout" ? [{ epingleLe: null }] : []),
          ...(avant ? [{ creeLe: { lt: avant } }] : []),
        ],
      },
      include: INCLURE(l.id),
      orderBy: { creeLe: "desc" },
      take: PAR_PAGE + 1,
    }),
  ]);
  const suite = publications.length > PAR_PAGE;
  const page = publications.slice(0, PAR_PAGE);
  const toutes = [...epinglees, ...page];
  const noms = await nomsMentionnes(toutes.flatMap((p) => p.mentions));
  return {
    publications: toutes.map((p) => versCarte(p, l, noms)),
    suivante: suite ? page.at(-1)!.creeLe.toISOString() : null,
  };
}

/** Une publication et ses commentaires, si le lecteur peut la voir. */
export async function publication(id: string, l: Lecteur) {
  const p = await db.publication.findUnique({ where: { id }, include: INCLURE(l.id) });
  if (
    !p ||
    !peutVoir(
      {
        auteurId: p.auteurId,
        audience: p.audience,
        filiereId: p.filiereId,
        promotionId: p.promotionId,
        statut: p.statut,
        supprime: !!p.supprimeLe,
        masque: !!p.masqueLe,
      },
      l,
    )
  )
    return null;
  return versCarte(p, l, await nomsMentionnes(p.mentions));
}

/** Commentaires d'une publication (réponses rangées sous leur commentaire). */
export async function commentairesDe(publicationId: string, l: Lecteur, limite?: number) {
  const liste = await db.commentaire.findMany({
    where: {
      publicationId,
      OR: [{ masqueLe: null }, ...(l.moderateur ? [{}] : [{ auteurId: l.id }])],
    },
    include: { auteur: { select: { prenom: true, nom: true } } },
    orderBy: { creeLe: "asc" },
  });
  const noms = await nomsMentionnes(liste.flatMap((c) => c.mentions));
  const cartes = liste.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    auteurId: c.auteurId,
    auteur: nom(c.auteur),
    moi: c.auteurId === l.id,
    contenu: c.supprimeLe ? "" : c.contenu,
    supprime: !!c.supprimeLe,
    masque: !!c.masqueLe,
    creeLe: c.creeLe,
    modifie: !!c.modifieLe,
    mentions: c.mentions.map((id) => noms.get(id)).filter((n): n is string => !!n),
  }));
  const racines = cartes.filter((c) => !c.parentId);
  const arbre = racines.map((r) => ({
    ...r,
    reponses: cartes.filter((c) => c.parentId === r.id),
  }));
  // Dans le fil : les derniers commentaires seulement.
  return limite ? arbre.slice(-limite) : arbre;
}

export type CarteCommentaire = Awaited<ReturnType<typeof commentairesDe>>[number];

/** Audiences proposées dans le formulaire de publication. */
export async function choixAudience(l: Lecteur) {
  const [filieres, promotions] = await Promise.all([
    db.filiere.findMany({
      where: l.personnel ? {} : { id: { in: l.filieres } },
      select: { id: true, nomCourt: true },
      orderBy: { ordre: "asc" },
    }),
    db.promotion.findMany({
      where: {
        annee: { courante: true },
        ...(l.personnel ? {} : { id: { in: l.promotions } }),
      },
      include: { filiere: true, niveau: true },
      orderBy: [{ niveau: { ordre: "asc" } }, { filiere: { ordre: "asc" } }],
    }),
  ]);
  return {
    filieres: filieres.map((f) => ({ id: f.id, libelle: f.nomCourt })),
    promotions: promotions.map((p) => ({ id: p.id, libelle: libellePromotion(p) })),
  };
}
