import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

/**
 * Politique de sécurité du contenu. Next.js insère des scripts en ligne (données
 * de rendu) : sans nonce — qui rendrait chaque page dynamique et désactiverait
 * le cache — 'unsafe-inline' reste nécessaire pour les scripts. La politique
 * interdit en revanche tout script, style ou cadre venu d'un autre site,
 * l'intégration du site dans un cadre et l'envoi de formulaires ailleurs.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.openstreetmap.org",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const entetesSecurite = [
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Content-Security-Policy", value: csp }]
    : []),
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
  // L'ancienne adresse technique renvoie vers le nom de domaine officiel (un seul site indexé).
  async redirects() {
    const officiel = process.env.NEXT_PUBLIC_SITE_URL;
    if (!officiel || officiel.includes("vercel.app")) return [];
    return [
      {
        source: "/:chemin*",
        has: [{ type: "host" as const, value: "ispt-bukavu.vercel.app" }],
        destination: `${officiel}/:chemin*`,
        permanent: true,
      },
    ];
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

/**
 * Sentry : l'envoi des sources (piles d'appels lisibles) n'a lieu que si un
 * jeton est fourni à la compilation ; sinon la configuration reste inchangée.
 */
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "datalendo",
      project: process.env.SENTRY_PROJECT ?? "ispt-bukavu",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      telemetry: false,
      silent: !process.env.CI,
    })
  : nextConfig;
