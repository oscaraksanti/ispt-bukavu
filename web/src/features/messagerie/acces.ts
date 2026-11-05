import "server-only";
import { redirect } from "next/navigation";
import { libellePromotion } from "@/features/academique/regles";
import { exigerConnexion, type UtilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { ROLES_PERSONNEL } from "@/lib/permissions";
import { aAccesMessagerie, cleCours, clePromotion, type ProfilMessagerie } from "./regles";

export type ProfilComplet = ProfilMessagerie & {
  /** Filières de l'étudiant (année en cours) et des cours confiés à l'enseignant. */
  filieres: string[];
  filieresEnseignees: string[];
  /** Cours offerts confiés (enseignant). */
  coursEnseignes: string[];
  /** Cours offerts des promotions de l'étudiant. */
  coursSuivis: string[];
};

const INSCRIPTION_ACTIVE = {
  statut: { not: "ABANDON" as const },
  promotion: { annee: { courante: true } },
};

/** Profils de messagerie de plusieurs comptes, calculés en trois requêtes. */
export async function profilsMessagerie(ids: string[]): Promise<Map<string, ProfilComplet>> {
  const [comptes, inscriptions, affectations] = await Promise.all([
    db.utilisateur.findMany({
      where: { id: { in: ids }, statut: "ACTIF" },
      select: { id: true, roles: { select: { role: { select: { code: true } } } } },
    }),
    db.inscription.findMany({
      where: { ...INSCRIPTION_ACTIVE, etudiant: { utilisateurId: { in: ids } } },
      select: {
        promotionId: true,
        etudiant: { select: { utilisateurId: true } },
        promotion: { select: { filiereId: true, cours: { select: { id: true } } } },
      },
    }),
    db.coursEnseignant.findMany({
      where: {
        enseignant: { utilisateurId: { in: ids } },
        coursOffert: { promotion: { annee: { courante: true } } },
      },
      select: {
        coursOffertId: true,
        enseignant: { select: { utilisateurId: true } },
        coursOffert: { select: { promotionId: true, promotion: { select: { filiereId: true } } } },
      },
    }),
  ]);
  return new Map(
    comptes.map((c) => {
      const roles = c.roles.map((r) => r.role.code);
      const mesInscriptions = inscriptions.filter((i) => i.etudiant.utilisateurId === c.id);
      const mesCours = affectations.filter((a) => a.enseignant.utilisateurId === c.id);
      return [
        c.id,
        {
          id: c.id,
          personnel: roles.some((r) => ROLES_PERSONNEL.includes(r)),
          enseignant: roles.includes("enseignant"),
          etudiant: roles.includes("etudiant"),
          promotions: mesInscriptions.map((i) => i.promotionId),
          coursSuivis: mesInscriptions.flatMap((i) => i.promotion.cours.map((x) => x.id)),
          coursEnseignes: mesCours.map((a) => a.coursOffertId),
          promotionsEnseignees: [...new Set(mesCours.map((a) => a.coursOffert.promotionId))],
          filieres: [...new Set(mesInscriptions.map((i) => i.promotion.filiereId))],
          filieresEnseignees: [...new Set(mesCours.map((a) => a.coursOffert.promotion.filiereId))],
        },
      ];
    }),
  );
}

/** Exige un compte ayant accès à la messagerie (personnel, enseignant ou étudiant). */
export async function exigerMessagerie(suite: string) {
  const u = await exigerConnexion(suite);
  const profil = (await profilsMessagerie([u.id])).get(u.id);
  if (!profil || !aAccesMessagerie(profil)) redirect("/acces-refuse");
  return { u, profil };
}

/**
 * Crée au besoin les groupes de l'utilisateur (sa promotion, ses cours) et sa
 * ligne de participant ; marque comme quittés les groupes dont il ne fait plus partie.
 */
export async function synchroniserGroupes(profil: ProfilComplet) {
  const promotions = profil.promotions;
  const cours = [...new Set([...profil.coursSuivis, ...profil.coursEnseignes])];
  const [detailsPromotions, detailsCours] = await Promise.all([
    promotions.length
      ? db.promotion.findMany({
          where: { id: { in: promotions } },
          include: { filiere: true, niveau: true, annee: true },
        })
      : [],
    cours.length
      ? db.coursOffert.findMany({
          where: { id: { in: cours } },
          include: {
            cours: { select: { intitule: true } },
            promotion: { include: { filiere: true, niveau: true } },
          },
        })
      : [],
  ]);
  const voulues = [
    ...detailsPromotions.map((p) => ({
      cle: clePromotion(p.id),
      type: "PROMOTION" as const,
      titre: `${libellePromotion(p)} · ${p.annee.libelle}`,
      promotionId: p.id,
      coursOffertId: null,
    })),
    ...detailsCours.map((c) => ({
      cle: cleCours(c.id),
      type: "COURS" as const,
      titre: `${c.cours.intitule} · ${libellePromotion(c.promotion)}`,
      promotionId: null,
      coursOffertId: c.id,
    })),
  ];
  if (voulues.length) await db.conversation.createMany({ data: voulues, skipDuplicates: true });
  const conversations = voulues.length
    ? await db.conversation.findMany({
        where: { cle: { in: voulues.map((v) => v.cle) } },
        select: { id: true, coursOffertId: true },
      })
    : [];
  if (conversations.length)
    await db.participantConversation.createMany({
      data: conversations.map((c) => ({
        conversationId: c.id,
        utilisateurId: profil.id,
        animateur: !!c.coursOffertId && profil.coursEnseignes.includes(c.coursOffertId),
      })),
      skipDuplicates: true,
    });
  const ids = conversations.map((c) => c.id);
  await db.$transaction([
    // Retour dans un groupe (réinscription, nouvelle affectation).
    db.participantConversation.updateMany({
      where: { utilisateurId: profil.id, conversationId: { in: ids }, quitteLe: { not: null } },
      data: { quitteLe: null },
    }),
    db.participantConversation.updateMany({
      where: {
        utilisateurId: profil.id,
        quitteLe: null,
        conversation: { type: { not: "PRIVEE" } },
        conversationId: { notIn: ids },
      },
      data: { quitteLe: new Date() },
    }),
  ]);
}

/**
 * Accès à une conversation : participant d'une conversation privée, ou
 * membre actuel du groupe (calculé à partir des inscriptions et affectations).
 */
export async function accesConversation(profil: ProfilComplet, conversationId: string) {
  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;
  let membre = false;
  let animateur = false;
  if (conversation.type === "PROMOTION")
    membre = !!conversation.promotionId && profil.promotions.includes(conversation.promotionId);
  else if (conversation.type === "COURS" && conversation.coursOffertId) {
    animateur = profil.coursEnseignes.includes(conversation.coursOffertId);
    membre = animateur || profil.coursSuivis.includes(conversation.coursOffertId);
  }
  const participant = await db.participantConversation.findUnique({
    where: { conversationId_utilisateurId: { conversationId, utilisateurId: profil.id } },
  });
  if (conversation.type === "PRIVEE") membre = !!participant && !participant.quitteLe;
  if (!membre) return null;
  return { conversation, participant, animateur };
}

export type AccesConversation = NonNullable<Awaited<ReturnType<typeof accesConversation>>>;

/** Comptes ayant la permission de modérer (destinataires des signalements). */
export async function moderateurs() {
  const comptes = await db.utilisateur.findMany({
    where: {
      statut: "ACTIF",
      roles: {
        some: { role: { permissions: { some: { permissionCode: "messagerie.moderer" } } } },
      },
    },
    select: { id: true },
  });
  return comptes.map((c) => c.id);
}

export type { UtilisateurConnecte };
