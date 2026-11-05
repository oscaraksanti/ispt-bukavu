import type { Metadata } from "next";
import { EcranConversation } from "@/components/messagerie/ecrans";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Messages" };

export default async function Conversation({ params }: PageProps<"/enseignant/messages/[id]">) {
  const { id } = await params;
  return (
    <EcranConversation base="/enseignant/messages" suite={`/enseignant/messages/${id}`} id={id} />
  );
}
