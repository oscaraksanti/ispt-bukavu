"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import type { EtatFormulaire } from "@/lib/etat-formulaire";
import { cn } from "@/lib/cn";

/** Annonce le résultat d'un envoi (lu par les lecteurs d'écran). */
export function MessageEtat({ etat, className }: { etat: EtatFormulaire; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      {etat.statut && etat.message && (
        <p
          key={etat.horodatage}
          className={cn(
            "flex items-start gap-2 text-sm font-medium",
            etat.statut === "succes" ? "text-succes" : "text-erreur",
          )}
        >
          {etat.statut === "succes" ? (
            <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          )}
          {etat.message}
        </p>
      )}
    </div>
  );
}
