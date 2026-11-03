"use client";

import {
  Wallet,
  CalendarClock,
  ClipboardCheck,
  Megaphone,
  BookOpen,
  CalendarCog,
  Presentation,
  CalendarDays,
  CalendarRange,
  FolderOpen,
  CircleHelp,
  FileText,
  GraduationCap,
  Handshake,
  History,
  Images,
  Inbox,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Settings2,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Signature } from "@/components/marque/blason";
import { seDeconnecter } from "@/features/auth/actions";
import { cn } from "@/lib/cn";
import type { GroupeNavigation } from "./navigation";

const ICONES: Record<string, LucideIcon> = {
  Wallet,
  CalendarClock,
  ClipboardCheck,
  Megaphone,
  BookOpen,
  CalendarCog,
  Presentation,
  CalendarDays,
  CalendarRange,
  FolderOpen,
  CircleHelp,
  FileText,
  GraduationCap,
  Handshake,
  History,
  Images,
  Inbox,
  Landmark,
  LayoutDashboard,
  Newspaper,
  Settings2,
  ShieldCheck,
  Users,
};

function Liens({ groupes, surClic }: { groupes: GroupeNavigation[]; surClic?: () => void }) {
  const chemin = usePathname();
  return (
    <nav aria-label="Administration" className="space-y-7">
      {/* L'entrée active est la plus précise qui correspond à l'adresse. */}
      {groupes.map((g) => (
        <div key={g.titre}>
          <p className="px-3 font-mono text-[0.625rem] tracking-[0.14em] text-white/65 uppercase">
            {g.titre}
          </p>
          <ul className="mt-2 space-y-0.5">
            {g.entrees.map((e) => {
              const Icone = ICONES[e.icone] ?? FileText;
              const correspond = (href: string) =>
                href === "/admin"
                  ? chemin === "/admin"
                  : chemin === href || chemin.startsWith(`${href}/`);
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
                      "relative flex items-center gap-3 rounded-xs px-3 py-2 text-[0.9375rem] text-white/75 transition-colors hover:bg-white/5 hover:text-white",
                      actif && "bg-white/10 text-white",
                    )}
                  >
                    {actif && (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-0 w-[3px] bg-chantier"
                      />
                    )}
                    <Icone aria-hidden className="size-4 shrink-0" />
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
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate text-sm text-white">{nom}</p>
      <p className="truncate text-xs text-white/65">{email}</p>
      <form action={seDeconnecter} className="mt-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white"
        >
          <LogOut aria-hidden className="size-4" /> Se déconnecter
        </button>
      </form>
    </div>
  );
}

export function BarreLaterale({
  groupes,
  nom,
  email,
}: {
  groupes: GroupeNavigation[];
  nom: string;
  email: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <aside className="trame-claire fixed inset-y-0 left-0 hidden w-64 flex-col bg-encre px-4 py-6 lg:flex">
        <Link href="/admin" className="px-2">
          <Signature clair compacte />
        </Link>
        <div className="mt-10 flex-1 overflow-y-auto">
          <Liens groupes={groupes} />
        </div>
        <Pied nom={nom} email={email} />
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-encre px-4 lg:hidden">
        <Link href="/admin">
          <Signature clair compacte />
        </Link>
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="inline-flex size-10 items-center justify-center text-white"
          aria-label="Ouvrir le menu"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </div>
      {ouvert && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-encre/60" onClick={() => setOuvert(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-encre px-4 py-5">
            <div className="flex items-center justify-between px-2">
              <Signature clair compacte />
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="inline-flex size-10 items-center justify-center text-white"
                aria-label="Fermer le menu"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">
              <Liens groupes={groupes} surClic={() => setOuvert(false)} />
            </div>
            <Pied nom={nom} email={email} />
          </div>
        </div>
      )}
    </>
  );
}
