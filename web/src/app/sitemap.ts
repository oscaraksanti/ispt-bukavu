import type { MetadataRoute } from "next";
import { lireActualites, lireFilieres } from "@/features/contenu/lecture";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ispt-bukavu.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [filieres, { actualites }] = await Promise.all([lireFilieres(), lireActualites(1)]);
  const pages = [
    "",
    "/institut",
    "/formations",
    "/admissions",
    "/actualites",
    "/valve",
    "/contact",
    "/candidater",
    "/verifier",
  ];
  return [
    ...pages.map((p) => ({
      url: `${BASE}${p}`,
      changeFrequency: "monthly" as const,
      priority: p ? 0.8 : 1,
    })),
    ...filieres.map((f) => ({
      url: `${BASE}/formations/${f.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...actualites.map((a) => ({
      url: `${BASE}/actualites/${a.slug}`,
      lastModified: a.publieLe,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
