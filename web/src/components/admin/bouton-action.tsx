"use client";

import { type ReactNode, useEffect, useState, useTransition } from "react";
import { Bouton } from "@/components/ui/bouton";
import type { EtatFormulaire } from "@/lib/etat-formulaire";
import { MessageEtat } from "./message-etat";

/**
 * Bouton déclenchant une action serveur, avec confirmation facultative
 * pour les opérations irréversibles.
 */
export function BoutonAction({
  action,
  children,
  confirmation,
  variante = "contour",
  taille = "sm",
  className,
  libelleAccessible,
}: {
  action: () => Promise<EtatFormulaire | void>;
  children: ReactNode;
  confirmation?: string;
  variante?: "contour" | "fantome" | "danger" | "institutionnel";
  taille?: "sm" | "md";
  className?: string;
  libelleAccessible?: string;
}) {
  const [enCours, demarrer] = useTransition();
  const [aConfirmer, setAConfirmer] = useState(false);
  const [etat, setEtat] = useState<EtatFormulaire>({ statut: null });

  // Un message de réussite s'efface de lui-même ; une erreur reste affichée.
  useEffect(() => {
    if (etat.statut !== "succes") return;
    const minuterie = setTimeout(() => setEtat({ statut: null }), 5000);
    return () => clearTimeout(minuterie);
  }, [etat]);

  const executer = () =>
    demarrer(async () => {
      setAConfirmer(false);
      const r = await action();
      if (r) setEtat(r);
    });

  if (aConfirmer && confirmation) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-sm text-pierre-700">{confirmation}</span>
        <Bouton type="button" variante="danger" taille="sm" disabled={enCours} onClick={executer}>
          Confirmer
        </Bouton>
        <Bouton type="button" variante="fantome" taille="sm" onClick={() => setAConfirmer(false)}>
          Annuler
        </Bouton>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Bouton
        type="button"
        variante={variante}
        taille={taille}
        className={className}
        disabled={enCours}
        aria-label={libelleAccessible}
        onClick={() => (confirmation ? setAConfirmer(true) : executer())}
      >
        {children}
      </Bouton>
      {etat.statut && <MessageEtat etat={etat} />}
    </span>
  );
}
