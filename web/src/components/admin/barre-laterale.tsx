"use client";

import { CircleHelp, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Signature } from "@/components/marque/blason";
import { seDeconnecter } from "@/features/auth/actions";
import { Cloche } from "@/components/notifications/cloche";
import { cn } from "@/lib/cn";
import { ICONES } from "./icones";
import type { GroupeNavigation } from "./navigation";
import { BoutonRecherche, RechercheRapide } from "./recherche-rapide";

function Liens({ groupes, surClic }: { groupes: GroupeNavigation[]; surClic?: () => void }) {
  const chemin = usePathname();
  const correspond = (href: string) =>
    href === "/admin" ? chemin === "/admin" : chemin === href || chemin.startsWith(`${href}/`);
  return (
    <nav aria-label="Administration" className="space-y-6">
      {/* L'entrée active est la plus précise qui correspond à l'adresse. */}
      {groupes.map((g) => (
        <div key={g.titre}>
          <p className="px-3 font-mono text-legende tracking-[0.12em] text-white/55 uppercase">
            {g.titre}
          </p>
          <ul className="mt-2 space-y-px">
            {g.entrees.map((e) => {
              const Icone = ICONES[e.icone];
              const actif =
                correspond(e.href) &&
                !groupes.some((g2) =>
                  g2.entrees.some((x) => x.href.length > e.href.length && correspond(x.href)),
                );
              return (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    onClick={surClic}
                    aria-current={actif ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xs px-3 py-2 text-corps text-white/75 transition-colors duration-150 hover:bg-white/5 hover:text-white",
                      actif && "bg-white/10 text-white",
                    )}
                  >
                    {actif && (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-0 w-[3px] bg-chantier"
                      />
                    )}
                    <Icone
                      aria-hidden
                      className={cn("size-4 shrink-0", actif ? "text-chantier" : "text-white/60")}
                    />
                    {e.libelle}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Pied({ nom, email }: { nom: string; email: string }) {
  const initiales = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join("");
  return (
    <div className="border-t border-white/10 pt-4">
      <Link
        href="/admin/compte"
        className="-mx-2 flex items-center gap-3 rounded-xs px-2 py-1.5 hover:bg-white/5"
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-xs text-white"
        >
          {initiales}
        </span>
        <span className="min-w-0">
          <span className="sr-only">Mon compte, </span>
          <span className="block truncate text-sm text-white">{nom}</span>
          <span className="block truncate text-xs text-white/60">{email}</span>
        </span>
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1">
        {/* Sans préchargement : le guide est une page du site public. */}
        <Link
          prefetch={false}
          href="/aide/administration"
          className="inline-flex h-10 items-center gap-2 rounded-xs px-2 text-sm text-white/75 hover:bg-white/5 hover:text-white"
        >
          <CircleHelp aria-hidden className="size-4" /> Aide
        </Link>
        <form action={seDeconnecter}>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-xs px-2 text-sm text-white/75 hover:bg-white/5 hover:text-white"
          >
            <LogOut aria-hidden className="size-4" /> Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}

export function BarreLaterale({
  groupes,
  nom,
  email,
  notifications,
}: {
  groupes: GroupeNavigation[];
  nom: string;
  email: string;
  notifications: number;
}) {
  const menu = useRef<HTMLDialogElement>(null);
  const fermer = () => menu.current?.close();
  return (
    <>
      <aside className="trame-claire fixed inset-y-0 left-0 hidden w-64 flex-col bg-encre px-4 py-6 lg:flex">
        <div className="flex items-center justify-between gap-2 pl-2">
          <Link href="/admin">
            <Signature clair compacte />
          </Link>
          <Cloche href="/admin/notifications" nombre={notifications} clair />
        </div>
        <div className="mt-6">
          <BoutonRecherche />
        </div>
        <div className="-mx-1 mt-6 flex-1 [scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/0.18)_transparent] overflow-y-auto px-1 pb-4">
          <Liens groupes={groupes} />
        </div>
        <Pied nom={nom} email={email} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-encre px-4 lg:hidden">
        <Link href="/admin">
          <Signature clair compacte />
        </Link>
        <div className="flex items-center">
          <BoutonRecherche compact />
          <Cloche href="/admin/notifications" nombre={notifications} clair />
          <button
            type="button"
            onClick={() => menu.current?.showModal()}
            className="inline-flex size-11 items-center justify-center text-white"
            aria-label="Ouvrir le menu"
          >
            <Menu aria-hidden className="size-5" />
          </button>
        </div>
      </header>

      {/* Fenêtre modale native : focus piégé, Échap, défilement de la page bloqué. */}
      <dialog
        ref={menu}
        aria-label="Menu de l'administration"
        onClick={(e) => e.target === menu.current && fermer()}
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-encre p-0 text-white backdrop:bg-encre/60 lg:hidden"
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-center justify-between px-2">
            <Signature clair compacte />
            <button
              type="button"
              onClick={fermer}
              className="inline-flex size-11 items-center justify-center text-white"
              aria-label="Fermer le menu"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="mt-6 flex-1 [scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/0.18)_transparent] overflow-y-auto">
            <Liens groupes={groupes} surClic={fermer} />
          </div>
          <Pied nom={nom} email={email} />
        </div>
      </dialog>

      <RechercheRapide groupes={groupes} />
    </>
  );
}
