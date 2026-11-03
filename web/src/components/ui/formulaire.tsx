"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Bouton } from "./bouton";

/** Bouton d'envoi qui affiche l'état « en cours » pendant l'action serveur. */
export function BoutonEnvoi({
  children,
  enCours = "Veuillez patienter…",
  enCoursForce = false,
  ...props
}: ComponentProps<typeof Bouton> & { enCours?: string; enCoursForce?: boolean }) {
  const statut = useFormStatus();
  const pending = statut.pending || enCoursForce;
  return (
    <Bouton type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="animate-spin" />
          {enCours}
        </>
      ) : (
        children
      )}
    </Bouton>
  );
}
