import type { Metadata } from "next";
import { EcranConversation } from "@/components/messagerie/ecrans";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Messages" };

export default async function Conversation({
  params,
  searchParams,
}: PageProps<"/etudiant/messages/[id]">) {
  const [{ id }, { communique }] = await Promise.all([params, searchParams]);
  return (
    <EcranConversation
      base="/etudiant/messages"
      suite={`/etudiant/messages/${id}`}
      id={id}
      communique={typeof communique === "string" ? communique : undefined}
    />
  );
}
