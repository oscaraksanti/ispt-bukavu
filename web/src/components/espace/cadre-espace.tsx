import { LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Signature } from "@/components/marque/blason";
import { seDeconnecter } from "@/features/auth/actions";
import { Cloche } from "@/components/notifications/cloche";
import { BandeauHorsLigne } from "@/components/pwa/bandeau-hors-ligne";
import { NavigationEspace } from "./navigation-espace";

/** Cadre commun des espaces étudiant et enseignant : en-tête, onglets, contenu. */
export function CadreEspace({
  nom,
  sousTitre,
  liens,
  autresEspaces,
  notifications,
  children,
}: {
  nom: string;
  sousTitre: string;
  liens: { libelle: string; href: string }[];
  autresEspaces?: { libelle: string; href: string }[];
  notifications: { href: string; nombre: number };
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-papier">
      <BandeauHorsLigne />
      <header className="border-b border-pierre-200 bg-white">
        <div className="conteneur flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Retour au site de l'ISPT-Bukavu">
            <Signature compacte />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {autresEspaces?.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="hidden text-sm text-ispt-600 underline hover:no-underline sm:inline"
              >
                {e.libelle}
              </Link>
            ))}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-encre">{nom}</p>
              <p className="text-xs text-pierre-500">{sousTitre}</p>
            </div>
            <Cloche href={notifications.href} nombre={notifications.nombre} />
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-xs px-3 text-sm text-pierre-700 hover:bg-pierre-100"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="sr-only sm:not-sr-only">Se déconnecter</span>
              </button>
            </form>
          </div>
        </div>
        <NavigationEspace liens={liens} />
      </header>
      <main id="contenu" className="conteneur py-8 lg:py-12">
        {children}
      </main>
    </div>
  );
}
