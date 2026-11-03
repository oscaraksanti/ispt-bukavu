"use client";

import { KeyRound, Printer } from "lucide-react";
import { useState, useTransition } from "react";
import { Bouton } from "@/components/ui/bouton";
import type { EtatCodes } from "@/features/academique/actions-etudiants";
import { MessageEtat } from "./message-etat";

/**
 * Génère les codes d'activation d'une promotion et les présente en feuille
 * imprimable, à découper et remettre à chaque étudiant.
 */
export function CodesActivation({
  action,
  promotion,
  urlActivation,
}: {
  action: () => Promise<EtatCodes>;
  promotion: string;
  urlActivation: string;
}) {
  const [etat, setEtat] = useState<EtatCodes>({ statut: null });
  const [enCours, demarrer] = useTransition();
  const codes = etat.codes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Bouton
          type="button"
          variante="institutionnel"
          disabled={enCours}
          onClick={() => demarrer(async () => setEtat(await action()))}
        >
          <KeyRound aria-hidden /> {enCours ? "Génération…" : "Générer les codes d'activation"}
        </Bouton>
        {codes.length > 0 && (
          <Bouton type="button" variante="contour" onClick={() => window.print()}>
            <Printer aria-hidden /> Imprimer la feuille
          </Bouton>
        )}
      </div>
      <p className="text-xs text-pierre-500">
        Seuls les étudiants qui n&apos;ont pas encore activé leur compte reçoivent un code. Les
        codes ne sont affichés qu&apos;une fois : imprimez la feuille avant de quitter la page.
      </p>
      <MessageEtat etat={etat} />
      {codes.length > 0 && (
        <div className="feuille-codes">
          <p className="hidden print:mb-4 print:block print:text-sm">
            ISPT-Bukavu · Codes d&apos;activation · {promotion}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
            {codes.map((c) => (
              <li
                key={c.matricule}
                className="break-inside-avoid rounded-xs border border-dashed border-pierre-400 bg-white p-4"
              >
                <p className="text-sm font-medium text-encre">{c.nom}</p>
                <p className="mt-1 font-mono text-xs text-pierre-600">Matricule : {c.matricule}</p>
                <p className="mt-3 font-mono text-xl tracking-wider text-encre">{c.code}</p>
                <p className="mt-2 text-xs text-pierre-600">
                  Activez votre compte sur {urlActivation} avec votre matricule et ce code.
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
