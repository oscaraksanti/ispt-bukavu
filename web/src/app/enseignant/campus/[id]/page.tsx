import type { Metadata } from "next";
import { EcranPublication } from "@/components/campus/ecrans";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Publication · Campus" };

export default async function Publication({
  params,
  searchParams,
}: PageProps<"/enseignant/campus/[id]">) {
  const [{ id }, { modifier }] = await Promise.all([params, searchParams]);
  return (
    <EcranPublication
      base="/enseignant/campus"
      suite={`/enseignant/campus/${id}`}
      id={id}
      modifier={modifier === "1"}
    />
  );
}
