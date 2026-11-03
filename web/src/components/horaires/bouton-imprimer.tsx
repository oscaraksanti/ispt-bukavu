"use client";

import { Printer } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";

export function BoutonImprimer({ libelle = "Imprimer pour la valve" }: { libelle?: string }) {
  return (
    <Bouton type="button" variante="contour" onClick={() => window.print()}>
      <Printer aria-hidden /> {libelle}
    </Bouton>
  );
}
