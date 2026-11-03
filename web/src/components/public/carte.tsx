"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";

/**
 * Carte interactive chargée à la demande : évite de consommer des données
 * mobiles (souvent coûteuses) pour une carte que tout le monde n'utilise pas.
 */
export function Carte({ src, libelle }: { src: string; libelle: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-pierre-200 bg-pierre-100">
      {active ? (
        <iframe
          title="Carte de localisation de l'ISPT-Bukavu"
          src={src}
          className="absolute inset-0 size-full"
        />
      ) : (
        <div className="trame absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
          <span className="relative flex size-14 items-center justify-center bg-encre text-chantier">
            <MapPin aria-hidden className="size-6" />
          </span>
          <p className="font-mono text-sm tracking-wide text-ispt-600">{libelle}</p>
          <Bouton variante="contour" taille="sm" onClick={() => setActive(true)}>
            Afficher la carte interactive
          </Bouton>
        </div>
      )}
    </div>
  );
}
