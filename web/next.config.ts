import type { NextConfig } from "next";

const entetesSecurite = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Les photos sont réduites dans le navigateur avant l'envoi (une par requête) ;
    // la limite reste sous le plafond de 4,5 Mo des fonctions Vercel.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // AVIF d'abord : fichiers nettement plus légers pour les connexions mobiles.
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  async headers() {
    return [
      { source: "/:path*", headers: entetesSecurite },
      {
        // Le service worker doit être relu à chaque visite pour se mettre à jour.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
