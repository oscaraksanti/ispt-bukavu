import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { type ProfilComplet, profilsMessagerie } from "./acces";
import { apercu, lecteurs, peutEcrireA } from "./regles";
import type { MessageClient } from "./types";

const nom = (u: { prenom: string | null; nom: string } | null) =>
  u ? [u.prenom, u.nom].filter(Boolean).join(" ") : "Compte supprimé";

/** Nombre de conversations ayant des messages non lus (pastille de l'en-tête). */
export async function compterConversationsNonLues(utilisateurId: string) {
  try {
    const [r] = await db.$queryRaw<{ n: bigint }[]>(Prisma.sql`
      SELECT count(DISTINCT m."conversationId") AS n
      FROM "Message" m
      JOIN "ParticipantConversation" p
        ON p."conversationId" = m."conversationId" AND p."utilisateurId" = ${utilisateurId}
      WHERE p."quitteLe" IS NULL
        AND m."creeLe" > COALESCE(p."luJusquA", p."creeLe")
        AND (m."auteurId" IS NULL OR m."auteurId" <> ${utilisateurId})
        AND m."supprimeLe" IS NULL`);
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
}

/** Conversations de l'utilisateur, la plus récente d'abord, avec aperçu et non-lus. */
export async function listeConversations(profil: ProfilComplet) {
  const participations = await db.participantConversation.findMany({
    where: { utilisateurId: profil.id, quitteLe: null },
    include: {
      conversation: {
        include: {
          participants: {
            where: { utilisateurId: { not: profil.id } },
            take: 1,
            include: { utilisateur: { select: { prenom: true, nom: true } } },
          },
          messages: {
            orderBy: { creeLe: "desc" },
            take: 1,
            include: { auteur: { select: { prenom: true, nom: true } } },
          },
        },
      },
    },
  });
  const nonLus = await Promise.all(
    participations.map((p) =>
      db.message.count({
        where: {
          conversationId: p.conversationId,
          creeLe: { gt: p.luJusquA ?? p.creeLe },
          supprimeLe: null,
          OR: [{ auteurId: null }, { auteurId: { not: profil.id } }],
        },
      }),
    ),
  );
  return participations
    .map((p, i) => {
      const c = p.conversation;
      const dernier = c.messages[0];
      const autre = c.participants[0]?.utilisateur ?? null;
      return {
        id: c.id,
        type: c.type,
        titre: c.type === "PRIVEE" ? nom(autre) : (c.titre ?? "Groupe"),
        initiales: (c.type === "PRIVEE" ? nom(autre) : (c.titre ?? "G"))
          .split(/[\s·]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((x) => x[0]?.toUpperCase())
          .join(""),
        sourdine: p.sourdine,
        nonLus: nonLus[i],
        dernierLe: dernier?.creeLe ?? null,
        apercu: dernier
          ? `${dernier.auteurId === profil.id ? "Vous : " : c.type !== "PRIVEE" && dernier.auteur ? `${dernier.auteur.prenom ?? dernier.auteur.nom} : ` : ""}${apercu(
              {
                contenu: dernier.contenu,
                supprime: !!dernier.supprimeLe,
                masque: !!dernier.masqueLe,
                piece: !!dernier.mediaId,
              },
            )}`
          : c.type === "PRIVEE"
            ? "Nouvelle conversation"
            : c.type === "COURS"
              ? "Groupe du cours"
              : "Groupe de la promotion",
      };
    })
    .sort((a, b) => (b.dernierLe?.getTime() ?? 0) - (a.dernierLe?.getTime() ?? 0));
}

export type ConversationListe = Awaited<ReturnType<typeof listeConversations>>[number];

const INCLURE_MESSAGE = {
  auteur: {
    select: {
      prenom: true,
      nom: true,
      roles: { select: { role: { select: { code: true } } } },
    },
  },
  reponseA: {
    select: {
      id: true,
      contenu: true,
      supprimeLe: true,
      masqueLe: true,
      mediaId: true,
      auteur: { select: { prenom: true, nom: true } },
    },
  },
  media: { select: { nomFichier: true, typeMime: true, taille: true } },
} as const;

type MessageBrut = Prisma.MessageGetPayload<{ include: typeof INCLURE_MESSAGE }>;

function qualite(m: MessageBrut, groupe: boolean) {
  if (!groupe || !m.auteur) return null;
  const roles = m.auteur.roles.map((r) => r.role.code);
  if (roles.includes("enseignant")) return "enseignant";
  if (roles.some((r) => r !== "etudiant" && r !== "candidat")) return "personnel";
  return null;
}

function versClient(
  m: MessageBrut,
  moi: string,
  lectures: { utilisateurId: string; luJusquA: Date | null }[],
  groupe: boolean,
): MessageClient {
  const retire = !!m.supprimeLe || !!m.masqueLe;
  return {
    id: m.id,
    auteurId: m.auteurId,
    auteur: nom(m.auteur),
    qualite: qualite(m, groupe),
    moi: m.auteurId === moi,
    contenu: retire ? "" : m.contenu,
    creeLe: m.creeLe.toISOString(),
    supprime: !!m.supprimeLe,
    masque: !!m.masqueLe,
    reponseA:
      m.reponseA && !retire
        ? {
            id: m.reponseA.id,
            auteur: nom(m.reponseA.auteur),
            extrait: apercu({
              contenu: m.reponseA.contenu,
              supprime: !!m.reponseA.supprimeLe,
              masque: !!m.reponseA.masqueLe,
              piece: !!m.reponseA.mediaId,
            }),
          }
        : null,
    piece:
      m.media && !retire
        ? {
            nom: m.media.nomFichier,
            type: m.media.typeMime,
            taille: m.media.taille,
            image: m.media.typeMime.startsWith("image/"),
          }
        : null,
    lu:
      m.auteurId === moi
        ? lecteurs(
            m.creeLe,
            lectures.filter((l) => l.utilisateurId !== moi).map((l) => l.luJusquA),
          )
        : 0,
  };
}

/**
 * Messages d'une conversation : les 80 derniers, ou ceux postérieurs à
 * `apres` (actualisation périodique), du plus ancien au plus récent.
 */
export async function messagesDe(
  conversationId: string,
  moi: string,
  type: "PRIVEE" | "PROMOTION" | "COURS",
  apres?: Date,
) {
  const [brut, lectures] = await Promise.all([
    db.message.findMany({
      where: { conversationId, ...(apres ? { creeLe: { gt: apres } } : {}) },
      include: INCLURE_MESSAGE,
      orderBy: { creeLe: "desc" },
      take: 80,
    }),
    db.participantConversation.findMany({
      where: { conversationId, quitteLe: null },
      select: { utilisateurId: true, luJusquA: true },
    }),
  ]);
  return brut.reverse().map((m) => versClient(m, moi, lectures, type !== "PRIVEE"));
}

/** Accusés de lecture de mes derniers messages (actualisation du « Vu »). */
export async function lecturesDe(conversationId: string, moi: string, depuis: Date) {
  const [mes, lectures] = await Promise.all([
    db.message.findMany({
      where: { conversationId, auteurId: moi, creeLe: { gte: depuis } },
      select: { id: true, creeLe: true },
    }),
    db.participantConversation.findMany({
      where: { conversationId, quitteLe: null, utilisateurId: { not: moi } },
      select: { luJusquA: true },
    }),
  ]);
  return Object.fromEntries(
    mes.map((m) => [
      m.id,
      lecteurs(
        m.creeLe,
        lectures.map((l) => l.luJusquA),
      ),
    ]),
  );
}

export async function messageClient(id: string, moi: string, groupe: boolean) {
  const m = await db.message.findUniqueOrThrow({ where: { id }, include: INCLURE_MESSAGE });
  return versClient(m, moi, [], groupe);
}

/**
 * Personnes à qui l'utilisateur peut écrire : sa promotion et ses enseignants
 * (étudiant), ses étudiants (enseignant), puis toute personne autorisée
 * trouvée par la recherche (nom, matricule ou adresse).
 */
export async function contactsPossibles(profil: ProfilComplet, q: string) {
  const recherche = q.trim();
  const ids = new Set<string>();
  if (!recherche) {
    const promotions = [...profil.promotions, ...profil.promotionsEnseignees];
    if (promotions.length) {
      const [etudiants, enseignants] = await Promise.all([
        db.inscription.findMany({
          where: { promotionId: { in: promotions }, statut: { not: "ABANDON" } },
          select: { etudiant: { select: { utilisateurId: true } } },
          take: 300,
        }),
        db.coursEnseignant.findMany({
          where: { coursOffert: { promotionId: { in: profil.promotions } } },
          select: { enseignant: { select: { utilisateurId: true } } },
        }),
      ]);
      for (const e of etudiants) ids.add(e.etudiant.utilisateurId);
      for (const e of enseignants) ids.add(e.enseignant.utilisateurId);
    }
  } else if (recherche.length >= 2) {
    // « Jean Bah » : chaque mot doit se retrouver dans le prénom, le nom, le post-nom
    // ou le matricule (ou être l'adresse complète).
    const mots = recherche.split(/\s+/).filter(Boolean).slice(0, 4);
    const trouves = await db.utilisateur.findMany({
      where: {
        statut: "ACTIF",
        AND: mots.map((mot) => ({
          OR: [
            { nom: { contains: mot, mode: "insensitive" as const } },
            { postnom: { contains: mot, mode: "insensitive" as const } },
            { prenom: { contains: mot, mode: "insensitive" as const } },
            // Adresse : seulement complète et exacte (pas de devinette lettre par lettre).
            { email: { equals: mot, mode: "insensitive" as const } },
            { profilEtudiant: { matricule: { contains: mot, mode: "insensitive" as const } } },
          ],
        })),
      },
      select: { id: true },
      take: 80,
    });
    for (const t of trouves) ids.add(t.id);
  }
  ids.delete(profil.id);
  if (!ids.size) return [];
  const profils = await profilsMessagerie([...ids]);
  const autorises = [...profils.values()].filter((p) => peutEcrireA(profil, p)).map((p) => p.id);
  const comptes = await db.utilisateur.findMany({
    where: { id: { in: autorises } },
    select: {
      id: true,
      nom: true,
      postnom: true,
      prenom: true,
      profilEtudiant: { select: { matricule: true } },
      roles: { select: { role: { select: { libelle: true, code: true } } } },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    take: 60,
  });
  return comptes.map((c) => ({
    id: c.id,
    nom: [c.prenom, c.nom, c.postnom].filter(Boolean).join(" "),
    detail:
      c.profilEtudiant?.matricule ??
      c.roles
        .filter((r) => r.role.code !== "etudiant")
        .map((r) => r.role.libelle)
        .join(", "),
  }));
}
