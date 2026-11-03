import Link from "next/link";
import { Blason } from "@/components/marque/blason";
import { LienBouton } from "@/components/ui/bouton";

export default function PageIntrouvable() {
  return (
    <main className="trame flex min-h-svh flex-col items-center justify-center px-6 py-20 text-center">
      <Link href="/" aria-label="Accueil">
        <Blason hauteur={72} />
      </Link>
      <p className="mt-10 font-mono text-sm tracking-widest text-ispt-600">ERREUR 404</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Cette page est introuvable</h1>
      <p className="mt-4 max-w-md text-pierre-600">
        L&apos;adresse a peut-être changé, ou la page n&apos;existe plus.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LienBouton href="/">Retour à l&apos;accueil</LienBouton>
        <LienBouton href="/contact" variante="contour">
          Contacter l&apos;institut
        </LienBouton>
      </div>
    </main>
  );
}
