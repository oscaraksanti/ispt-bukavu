"use client";

import Link from "next/link";
import "./globals.css";

/**
 * Dernier recours : erreur dans le cadre commun du site. Cette page remplace
 * tout le document ; elle reste sobre et sans dépendance (ni police ni image).
 */
export default function ErreurGlobale({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="fr">
      <body className="trame flex min-h-svh flex-col items-center justify-center bg-papier px-6 text-center font-sans">
        <title>Service momentanément indisponible · ISPT-Bukavu</title>
        <p className="font-mono text-sm tracking-widest text-attention">ISPT-BUKAVU</p>
        <h1 className="mt-3 text-titre-page">Service momentanément indisponible</h1>
        <p className="mt-4 max-w-md text-pierre-600">
          La plateforme rencontre un incident. Réessayez dans quelques instants ; vos données ne
          sont pas perdues.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-11 items-center rounded-xs bg-chantier px-5 font-medium text-encre"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-xs border border-pierre-300 bg-white px-5 font-medium text-encre"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
