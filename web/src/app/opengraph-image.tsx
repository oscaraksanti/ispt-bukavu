import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { lireInstitut } from "@/features/contenu/lecture";

/**
 * Aperçu affiché quand un lien du site est partagé (WhatsApp, Facebook, LinkedIn…).
 * Hérité par toutes les pages qui n'en définissent pas un autre.
 */
export const alt = "ISPT-Bukavu — Institut Supérieur Pédagogique et Technique de Bukavu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ENCRE = "#141b4a";
const CHANTIER = "#fef200";
const PAPIER = "#f7f6f2";

// Lus au chargement du module (et non à chaque requête) : l'image reste générée à la compilation.
const [serif, mono, blason] = await Promise.all([
  readFile(join(process.cwd(), "assets/polices/newsreader-500.ttf")),
  readFile(join(process.cwd(), "assets/polices/plex-mono-400.ttf")),
  readFile(join(process.cwd(), "public/brand/blason-couleur.svg")),
]);

export default async function ImagePartage() {
  const institut = await lireInstitut();
  const site = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.isptbukavu.org",
  ).host.replace(/^www\./, "");
  const surtitre = [institut.ville, institut.province, `Depuis ${institut.anneeOuverture}`]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PAPIER,
        backgroundImage:
          "linear-gradient(to right, rgba(40,56,144,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(40,56,144,0.07) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingRight: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Plex Mono",
              fontSize: 22,
              letterSpacing: 2,
              color: "#283890",
            }}
          >
            {surtitre}
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: "Newsreader",
              fontSize: 68,
              lineHeight: 1.04,
              letterSpacing: -1,
              color: ENCRE,
            }}
          >
            {institut.nom}
          </div>
          <div
            style={{ marginTop: 28, display: "flex", width: 120, height: 10, background: CHANTIER }}
          />
          <div style={{ marginTop: 28, fontFamily: "Plex Mono", fontSize: 22, color: "#57554e" }}>
            {institut.statut}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 260,
            height: 305,
            backgroundImage: `url(data:image/svg+xml;base64,${blason.toString("base64")})`,
            backgroundSize: "260px 305px",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          background: ENCRE,
          color: "rgba(255,255,255,0.8)",
          fontFamily: "Plex Mono",
          fontSize: 22,
          letterSpacing: 1,
        }}
      >
        <div style={{ display: "flex" }}>{institut.sigle.toUpperCase()}</div>
        <div style={{ display: "flex", color: CHANTIER }}>{site}</div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: serif, weight: 500, style: "normal" },
        { name: "Plex Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
