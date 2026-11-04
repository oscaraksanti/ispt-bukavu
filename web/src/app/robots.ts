import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ispt-bukavu.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/etudiant",
        "/enseignant",
        "/candidat",
        "/pieces",
        "/valve/pieces",
        "/supports",
        "/recu",
        "/activer",
        "/hors-ligne",
        "/documents",
        "/api",
        "/systeme-de-design",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
