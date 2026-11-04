"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { exigerConnexion } from "@/features/auth/acces";
import { db } from "@/lib/db";
import { lienSur } from "./regles";

/** Ouvre une notification : la marque lue puis mène à son objet. */
export async function ouvrirNotification(id: string) {
  const u = await exigerConnexion("/");
  // Seules les notifications de l'utilisateur connecté sont concernées.
  const n = await db.notification.findFirst({ where: { id, utilisateurId: u.id } });
  if (!n) return;
  if (!n.lueLe) await db.notification.update({ where: { id }, data: { lueLe: new Date() } });
  // Le compteur de la cloche est dans la mise en page : on la rafraîchit aussi.
  refresh();
  const lien = lienSur(n.lien);
  if (lien) redirect(lien);
}

export async function toutMarquerLu() {
  const u = await exigerConnexion("/");
  await db.notification.updateMany({
    where: { utilisateurId: u.id, lueLe: null },
    data: { lueLe: new Date() },
  });
  refresh();
}
