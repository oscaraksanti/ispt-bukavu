"use server";

import { exigerConnexion } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { lireAbonnement } from "./regles";

/** Enregistre l'abonnement de cet appareil (un appareil = un compte à la fois). */
export async function enregistrerAbonnement(brut: unknown, agent: string) {
  const u = await exigerConnexion("/connexion");
  const a = lireAbonnement(brut);
  if (!a) return { ok: false as const };
  await db.abonnementPush.upsert({
    where: { endpoint: a.endpoint },
    update: { utilisateurId: u.id, p256dh: a.p256dh, auth: a.auth, agent: agent.slice(0, 250) },
    create: { ...a, utilisateurId: u.id, agent: agent.slice(0, 250) },
  });
  return { ok: true as const };
}

export async function supprimerAbonnement(endpoint: string) {
  const u = await exigerConnexion("/connexion");
  await db.abonnementPush.deleteMany({ where: { endpoint, utilisateurId: u.id } });
}
