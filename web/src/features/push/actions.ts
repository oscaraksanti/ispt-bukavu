"use server";

import { exigerConnexion } from "@/features/auth/acces";
import { lireSession } from "@/features/auth/session";
import { db } from "@/lib/db";
import { ABONNEMENTS_MAX, lireAbonnement } from "./regles";

/**
 * Enregistre l'abonnement de cet appareil, rattaché à la session en cours : la
 * déconnexion ou la fermeture de la session le supprime (appareils partagés).
 * Un appareil = un compte à la fois ; cinq appareils au plus par compte.
 */
export async function enregistrerAbonnement(brut: unknown, agent: string) {
  const u = await exigerConnexion("/connexion");
  const session = await lireSession();
  const a = lireAbonnement(brut);
  if (!a || !session) return { ok: false as const };
  const donnees = { utilisateurId: u.id, sessionId: session.sessionId, agent: agent.slice(0, 250) };
  await db.abonnementPush.upsert({
    where: { endpoint: a.endpoint },
    update: { ...donnees, p256dh: a.p256dh, auth: a.auth },
    create: { ...a, ...donnees },
  });
  const anciens = await db.abonnementPush.findMany({
    where: { utilisateurId: u.id },
    orderBy: { creeLe: "desc" },
    skip: ABONNEMENTS_MAX,
    select: { id: true },
  });
  if (anciens.length)
    await db.abonnementPush.deleteMany({ where: { id: { in: anciens.map((x) => x.id) } } });
  return { ok: true as const };
}

export async function supprimerAbonnement(endpoint: string) {
  const u = await exigerConnexion("/connexion");
  await db.abonnementPush.deleteMany({ where: { endpoint, utilisateurId: u.id } });
}
