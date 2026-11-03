import type { Metadata } from "next";
import { LienBouton } from "@/components/ui/bouton";

export const metadata: Metadata = { title: "Accès refusé", robots: { index: false } };

export default function PageAccesRefuse() {
  return (
    <>
      <p className="surtitre">Accès refusé</p>
      <h1 className="mt-3 text-4xl">Cette page ne vous est pas ouverte</h1>
      <p className="mt-3 text-pierre-600">
        Votre compte ne dispose pas des droits nécessaires. Si vous pensez qu&apos;il s&apos;agit
        d&apos;une erreur, adressez-vous au support technique de l&apos;institut.
      </p>
      <div className="mt-8 flex gap-3">
        <LienBouton href="/admin">Retour à mon espace</LienBouton>
        <LienBouton href="/" variante="contour">
          Site public
        </LienBouton>
      </div>
    </>
  );
}
