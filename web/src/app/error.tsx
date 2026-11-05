"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Blason } from "@/components/marque/blason";
import { Bouton, LienBouton } from "@/components/ui/bouton";
import { signalerErreur } from "@/lib/surveillance-client";

/** Empreinte fournie par Next pour retrouver l'erreur dans les journaux du serveur. */
function referenceIncident(erreur: unknown) {
  if (typeof erreur !== "object" || erreur === null || !("digest" in erreur)) return null;
  return typeof erreur.digest === "string" ? erreur.digest : null;
}

/**
 * Erreur inattendue dans une page (base momentanément injoignable, réseau coupé…).
 * Le cadre de la page reste en place ; l'utilisateur peut réessayer sans recharger.
 */
export default function ErreurPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    signalerErreur(error);
  }, [error]);
  const reference = referenceIncident(error);

  return (
    <div
      role="alert"
      className="trame flex min-h-[70svh] flex-col items-center justify-center px-6 py-20 text-center"
    >
      <Blason hauteur={64} decoratif />
      <p className="mt-10 font-mono text-sm tracking-widest text-attention">INCIDENT TEMPORAIRE</p>
      <h1 className="mt-3 text-titre-page">La page n&apos;a pas pu s&apos;afficher</h1>
      <p className="mt-4 max-w-md text-pierre-600">
        Le service est peut-être momentanément indisponible, ou la connexion a été interrompue. Vos
        données ne sont pas perdues.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Bouton type="button" onClick={() => retry()}>
          <RotateCcw aria-hidden /> Réessayer
        </Bouton>
        <LienBouton href="/" variante="contour">
          Retour à l&apos;accueil
        </LienBouton>
      </div>
      {reference && (
        <p className="mt-10 font-mono text-legende tracking-wide text-pierre-500 uppercase">
          Référence de l&apos;incident : {reference}
        </p>
      )}
      <p className="mt-2 text-sm text-pierre-500">
        Si le problème persiste,{" "}
        <Link href="/contact" className="text-ispt-600 underline hover:no-underline">
          signalez-le à l&apos;institut
        </Link>
        .
      </p>
    </div>
  );
}
