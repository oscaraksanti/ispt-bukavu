import type { Metadata } from "next";
import { ListeNotifications } from "@/components/notifications/liste-notifications";
import { exigerEtudiant } from "@/features/espaces/acces";
import { notificationsDe } from "@/features/notifications/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsEtudiant() {
  const { u } = await exigerEtudiant();
  return <ListeNotifications notifications={await notificationsDe(u.id)} />;
}
