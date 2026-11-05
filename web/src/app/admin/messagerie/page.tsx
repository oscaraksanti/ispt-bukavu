import type { Metadata } from "next";
import { EcranMessages } from "@/components/messagerie/ecrans";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Messages" };

export default function Messages() {
  return <EcranMessages base="/admin/messagerie" suite="/admin/messagerie" />;
}
