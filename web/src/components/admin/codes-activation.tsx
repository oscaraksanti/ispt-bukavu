"use client";

import { KeyRound, Mail, Printer } from "lucide-react";
import { useState, useTransition } from "react";
import { Bouton } from "@/components/ui/bouton";
import type { EtatCodes } from "@/features/academique/actions-etudiants";
import { MessageEtat } from "./message-etat";

/**
 * Génère les codes d'activation d'une promotion et les présente en fiches
 * imprimables à découper (avec un QR code vers la page d'activation), ou les
 * envoie par email aux étudiants dont l'adresse est connue.
 */
export function CodesActivation({
  action,
  actionEmail,
  avecEmail,
  promotion,
  urlActivation,
  qr,
}: {
  action: () => Promise<EtatCodes>;
  actionEmail: () => Promise<EtatCodes>;
  avecEmail: number;
  promotion: string;
  urlActivation: string;
  qr: string;
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
          <KeyRound aria-hidden /> {enCours ? "Génération…" : "Générer les fiches à imprimer"}
        </Bouton>
        {avecEmail > 0 && (
          <Bouton
            type="button"
            variante="contour"
            disabled={enCours}
            onClick={() => demarrer(async () => setEtat(await actionEmail()))}
          >
            <Mail aria-hidden /> Générer et envoyer par email ({avecEmail})
          </Bouton>
        )}
        {codes.length > 0 && (
          <Bouton type="button" variante="contour" onClick={() => window.print()}>
            <Printer aria-hidden /> Imprimer les fiches
          </Bouton>
        )}
      </div>
      <p className="text-xs text-pierre-600">
        Seuls les étudiants qui n&apos;ont pas encore activé leur compte reçoivent un code. Générer
        de nouveaux codes annule les précédents. Les codes ne sont affichés qu&apos;une fois :
        imprimez les fiches avant de quitter la page.
      </p>
      <MessageEtat etat={etat} />
      {codes.length > 0 && (
        <div className="feuille-codes">
          <p className="hidden print:mb-3 print:block print:text-sm">
            ISPT-Bukavu · Codes d&apos;activation · {promotion}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-0">
            {codes.map((c) => (
              <li
                key={c.matricule}
                className="flex break-inside-avoid gap-4 rounded-xs border border-dashed border-pierre-400 bg-white p-4 print:rounded-none"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-encre">{c.nom}</p>
                  <p className="mt-1 font-mono text-xs text-pierre-600">
                    Matricule : {c.matricule}
                  </p>
                  <p className="mt-3 font-mono text-xl tracking-wider text-encre">{c.code}</p>
                  <p className="mt-2 text-xs text-pierre-600">
                    Activez votre compte sur <span className="font-mono">{urlActivation}</span> avec
                    votre matricule et ce code (valable 30 jours).
                  </p>
                  {c.envoye && (
                    <p className="mt-2 text-xs font-medium text-succes print:hidden">
                      Envoyé par email
                    </p>
                  )}
                </div>
                <div
                  aria-hidden
                  className="size-20 shrink-0 [&_svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: qr }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
