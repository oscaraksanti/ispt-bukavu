import type { MetadataRoute } from "next";
import { filieres } from "@/contenu/institut";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ispt-bukavu.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/institut", "/formations", "/admissions", "/contact"];
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
  ];
}
