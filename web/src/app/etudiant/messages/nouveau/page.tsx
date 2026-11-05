import type { Metadata } from "next";
import { EcranNouveau } from "@/components/messagerie/ecrans";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Nouveau message" };

export default async function NouveauMessage({
  searchParams,
}: PageProps<"/etudiant/messages/nouveau">) {
  const { q, refus } = await searchParams;
  return (
    <EcranNouveau
      base="/etudiant/messages"
      suite="/etudiant/messages/nouveau"
      q={typeof q === "string" ? q.slice(0, 80) : ""}
      refus={refus === "1"}
    />
  );
}
