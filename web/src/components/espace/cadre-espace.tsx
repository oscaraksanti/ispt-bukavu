import { CircleHelp, CircleUserRound, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Signature } from "@/components/marque/blason";
import { seDeconnecter } from "@/features/auth/actions";
import { IconeMessages } from "@/components/messagerie/icone-messages";
import { Cloche } from "@/components/notifications/cloche";
import { BandeauHorsLigne } from "@/components/pwa/bandeau-hors-ligne";
import { LienEvitement } from "@/components/ui/elements";
import { NavigationEspace } from "./navigation-espace";

/** Cadre commun des espaces étudiant et enseignant : en-tête, onglets, contenu. */
export function CadreEspace({
  nom,
  sousTitre,
  liens,
  autresEspaces,
  notifications,
  messages,
  aide,
  compte,
  children,
}: {
  /** Page « Mon compte » de l'espace. */
  compte: string;
  /** Guide d'utilisation de l'espace. */
  aide?: string;
  nom: string;
  sousTitre: string;
  liens: { libelle: string; href: string }[];
  autresEspaces?: { libelle: string; href: string }[];
  notifications: { href: string; nombre: number };
  messages: { href: string; nombre: number };
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-papier">
      <LienEvitement />
      <BandeauHorsLigne />
      <header className="border-b border-pierre-200 bg-white">
        <div className="conteneur flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Retour au site de l'ISPT-Bukavu">
            <Signature compacte />
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            {autresEspaces?.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="hidden text-sm text-ispt-600 underline hover:no-underline sm:inline"
              >
                {e.libelle}
              </Link>
            ))}
            <Link
              href={compte}
              className="inline-flex size-10 items-center justify-center rounded-xs text-pierre-700 hover:bg-pierre-100 lg:size-auto lg:max-w-56 lg:px-2 lg:py-1 lg:text-right"
            >
              <span className="sr-only">Mon compte, </span>
              <span className="hidden min-w-0 lg:block">
                <span className="block truncate text-sm font-medium text-encre">{nom}</span>
                <span className="block truncate text-xs text-pierre-500">{sousTitre}</span>
              </span>
              <CircleUserRound aria-hidden className="size-5 lg:hidden" />
            </Link>
            {aide && (
              <Link
                prefetch={false}
                href={aide}
                className="hidden size-10 items-center justify-center rounded-xs text-pierre-700 hover:bg-pierre-100 sm:inline-flex"
              >
                <CircleHelp aria-hidden className="size-5" />
                <span className="sr-only">Aide</span>
              </Link>
            )}
            <IconeMessages href={messages.href} nombre={messages.nombre} />
            <Cloche href={notifications.href} nombre={notifications.nombre} />
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-xs px-3 text-sm text-pierre-700 hover:bg-pierre-100"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="sr-only xl:not-sr-only">Se déconnecter</span>
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
