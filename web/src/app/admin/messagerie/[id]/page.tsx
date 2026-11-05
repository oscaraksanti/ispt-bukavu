import type { Metadata } from "next";
import { EcranConversation } from "@/components/messagerie/ecrans";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Messages" };

export default async function Conversation({ params }: PageProps<"/admin/messagerie/[id]">) {
  const { id } = await params;
  return <EcranConversation base="/admin/messagerie" suite={`/admin/messagerie/${id}`} id={id} />;
}
