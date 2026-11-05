import type { Metadata } from "next";
import { EcranCampus } from "@/components/campus/ecrans";
import { FILTRES, type FiltreFil } from "@/features/campus/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Campus" };

export default async function Campus({ searchParams }: PageProps<"/admin/campus">) {
  const { filtre: f, avant: a } = await searchParams;
  const filtre = FILTRES.find((x) => x.cle === f)?.cle ?? ("tout" as FiltreFil);
  const avant = typeof a === "string" && !Number.isNaN(Date.parse(a)) ? new Date(a) : null;
  return <EcranCampus base="/admin/campus" suite="/admin/campus" filtre={filtre} avant={avant} />;
}
