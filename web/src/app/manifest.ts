import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ISPT-Bukavu",
    short_name: "ISPT-Bukavu",
    description:
      "Institut Supérieur Pédagogique et Technique de Bukavu : site, valve, horaires, notes et démarches.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#141b4a",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mon horaire", url: "/etudiant/horaire" },
      { name: "Valve", url: "/etudiant/valve" },
      { name: "Mes notes", url: "/etudiant/notes" },
    ],
  };
}
