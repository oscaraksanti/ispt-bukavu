import type { MetadataRoute } from "next";
import { MODE_DEMO } from "@/lib/demo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ispt-bukavu.vercel.app";

export default function robots(): MetadataRoute.Robots {
  if (MODE_DEMO) return { rules: { userAgent: "*", disallow: "/" } };
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
        "/confirmer-email",
        "/affiche",
        "/hors-ligne",
        "/documents",
        "/devoirs",
        "/deliberations",
        "/stages",
        "/api",
        "/systeme-de-design",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
