"use client";

import {
  Bell,
  CircleHelp,
  CircleUserRound,
  House,
  LogOut,
  Menu,
  MessageCircle,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { cn } from "@/lib/cn";

type Lien = { libelle: string; href: string };

const pastille = (n: number) =>
  n > 0 ? (
    <span
      aria-hidden
      className="absolute -top-1 left-1/2 ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ispt-600 px-1 font-mono text-[0.625rem] leading-none text-white ring-2 ring-white"
    >
      {n > 99 ? "99+" : n}
    </span>
  ) : null;

/**
 * Barre de navigation du bas, sur téléphone : les quatre destinations du
 * quotidien et un menu pour tout le reste (onglets, compte, aide, déconnexion).
 */
export function BarreMobile({
  liens,
  messages,
  notifications,
  compte,
  aide,
  autresEspaces,
  deconnexion,
}: {
  liens: Lien[];
  messages: { href: string; nombre: number };
  notifications: { href: string; nombre: number };
  compte: string;
  aide?: string;
  autresEspaces?: Lien[];
  deconnexion: () => Promise<void>;
}) {
  const chemin = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const accueil = liens[0];
  const campus = liens.find((l) => l.href.endsWith("/campus"));
  const sous = (href: string) => chemin === href || chemin.startsWith(`${href}/`);
  const elements = [
    {
      libelle: accueil.libelle === "Mes cours" ? "Cours" : "Accueil",
      href: accueil.href,
      icone: House,
      actif: chemin === accueil.href,
      nombre: 0,
    },
    ...(campus
      ? [
          {
            libelle: "Campus",
            href: campus.href,
            icone: UsersRound,
            actif: sous(campus.href),
            nombre: 0,
          },
        ]
      : []),
    {
      libelle: "Messages",
      href: messages.href,
      icone: MessageCircle,
      actif: sous(messages.href),
      nombre: messages.nombre,
    },
    {
      libelle: "Alertes",
      href: notifications.href,
      icone: Bell,
      actif: sous(notifications.href),
      nombre: notifications.nombre,
    },
  ];
  const autres = liens.filter((l) => l !== accueil && l !== campus);
  const fermer = () => menu.current?.close();

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-pierre-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {elements.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                aria-current={e.actif ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium",
                  e.actif ? "text-ispt-600" : "text-pierre-600",
                )}
              >
                {e.actif && (
                  <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-ispt-600" />
                )}
                <span className="relative">
                  <e.icone aria-hidden className="size-5" />
                  {pastille(e.nombre)}
                </span>
                {e.libelle}
                {e.nombre > 0 && (
                  <span className="sr-only">
                    {" "}
                    : {e.nombre} non lu{e.nombre > 1 ? "s" : ""}
                  </span>
                )}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => menu.current?.showModal()}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-pierre-600"
            >
              <Menu aria-hidden className="size-5" />
              Menu
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={menu}
        aria-label="Menu de l'espace"
        onClick={(e) => e.target === menu.current && fermer()}
        className="mx-0 mt-auto mb-0 max-h-[85svh] w-full max-w-none rounded-t-2xl bg-white p-0 text-pierre-900 backdrop:bg-encre/50 md:hidden"
      >
        <div className="flex items-center justify-between border-b border-pierre-100 px-5 py-3">
          <p className="font-sans text-base font-semibold text-encre">Menu</p>
          <button
            type="button"
            onClick={fermer}
            className="inline-flex size-10 items-center justify-center rounded-full text-pierre-600 hover:bg-pierre-100"
          >
            <X aria-hidden className="size-5" />
            <span className="sr-only">Fermer le menu</span>
          </button>
        </div>
        <ul className="grid grid-cols-2 gap-2 p-4">
          {autres.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={fermer}
                aria-current={sous(l.href) ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center rounded-md border px-4 text-sm font-medium",
                  sous(l.href)
                    ? "border-ispt-600 bg-ispt-50 text-ispt-700"
                    : "border-pierre-200 text-encre hover:border-encre",
                )}
              >
                {l.libelle}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="border-t border-pierre-100 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <li>
            <Link
              href={compte}
              onClick={fermer}
              className="flex h-12 items-center gap-3 rounded-md px-3 text-sm text-encre hover:bg-pierre-50"
            >
              <CircleUserRound aria-hidden className="size-5 text-pierre-500" /> Mon compte
            </Link>
          </li>
          {aide && (
            <li>
              <Link
                prefetch={false}
                href={aide}
                onClick={fermer}
                className="flex h-12 items-center gap-3 rounded-md px-3 text-sm text-encre hover:bg-pierre-50"
              >
                <CircleHelp aria-hidden className="size-5 text-pierre-500" /> Aide
              </Link>
            </li>
          )}
          {autresEspaces?.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                onClick={fermer}
                className="flex h-12 items-center gap-3 rounded-md px-3 text-sm text-ispt-600 hover:bg-pierre-50"
              >
                {e.libelle}
              </Link>
            </li>
          ))}
          <li>
            <form action={deconnexion}>
              <button
                type="submit"
                className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-sm text-erreur hover:bg-erreur-fond"
              >
                <LogOut aria-hidden className="size-5" /> Se déconnecter
              </button>
            </form>
          </li>
        </ul>
      </dialog>
    </>
  );
}
