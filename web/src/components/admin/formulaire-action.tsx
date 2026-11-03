"use client";

import { type ReactNode, useActionState, useEffect, useRef } from "react";
import { BoutonEnvoi } from "@/components/ui/formulaire";
import { ETAT_INITIAL, type EtatFormulaire } from "@/lib/etat-formulaire";
import { MessageEtat } from "./message-etat";

/** Formulaire relié à une action serveur, avec annonce du résultat. */
export function FormulaireAction({
  action,
  children,
  libelleEnvoi,
  viderApresSucces = false,
  className,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  children: ReactNode;
  libelleEnvoi: string;
  viderApresSucces?: boolean;
  className?: string;
}) {
  const formulaire = useRef<HTMLFormElement>(null);
  const [etat, envoyer] = useActionState(action, ETAT_INITIAL);

  useEffect(() => {
    if (viderApresSucces && etat.statut === "succes") formulaire.current?.reset();
  }, [etat, viderApresSucces]);

  return (
    <form ref={formulaire} action={envoyer} className={className ?? "space-y-5"}>
      {children}
      <div className="flex flex-col gap-4 border-t border-pierre-200 pt-5 sm:flex-row-reverse sm:items-center sm:justify-between">
        <BoutonEnvoi variante="institutionnel" enCours="Enregistrement…" className="shrink-0">
          {libelleEnvoi}
        </BoutonEnvoi>
        <MessageEtat etat={etat} className="min-w-0 [overflow-wrap:anywhere]" />
      </div>
    </form>
  );
}
