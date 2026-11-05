import type { Metadata } from "next";
import Link from "next/link";
import { Blason } from "@/components/marque/blason";

export const metadata: Metadata = { title: "Hors ligne", robots: { index: false } };

export default function HorsLigne() {
  return (
    <main className="trame flex min-h-svh items-center justify-center bg-papier px-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <Blason hauteur={88} decoratif />
        </div>
        <h1 className="mt-8 text-titre-page">Pas de connexion</h1>
        <p className="mt-4 text-pierre-700">
          Cette page n&apos;a pas encore été consultée sur cet appareil. Les pages déjà ouvertes
          (horaire, valve, notes) restent disponibles hors ligne ; les autres le seront dès le
          retour du réseau.
        </p>
        <p className="mt-8">
          <Link href="/" className="font-medium text-ispt-600 underline hover:no-underline">
            Réessayer
          </Link>
        </p>
      </div>
    </main>
  );
}
