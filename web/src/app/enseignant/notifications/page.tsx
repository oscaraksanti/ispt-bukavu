import type { Metadata } from "next";
import { ListeNotifications } from "@/components/notifications/liste-notifications";
import { exigerEnseignant } from "@/features/espaces/acces";
import { notificationsDe } from "@/features/notifications/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsEnseignant() {
  const { u } = await exigerEnseignant();
  return <ListeNotifications notifications={await notificationsDe(u.id)} />;
}
