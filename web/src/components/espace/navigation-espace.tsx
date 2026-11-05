"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export function NavigationEspace({ liens }: { liens: { libelle: string; href: string }[] }) {
  const chemin = usePathname();
  // Notifications, messages et « Mon compte » s'ouvrent depuis l'en-tête : aucun onglet n'est alors actif.
  const horsOnglets = /\/(notifications|messages|compte)(\/|$)/.test(chemin);
  const actif = (href: string) =>
    !horsOnglets &&
    (chemin === href ||
      (chemin.startsWith(`${href}/`) &&
        !liens.some((l) => l.href.length > href.length && chemin.startsWith(l.href))));
  // Sur mobile, les onglets défilent : l'onglet actif est ramené dans le champ.
  const barre = useRef<HTMLElement>(null);
  useEffect(() => {
    barre.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [chemin]);
  return (
    <nav
      ref={barre}
      aria-label="Espace"
      className="conteneur -mb-px flex [scrollbar-width:none] gap-6 overflow-x-auto"
    >
      {liens.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={actif(l.href) ? "page" : undefined}
          className={cn(
            "shrink-0 border-b-2 py-3.5 text-sm transition-colors",
            actif(l.href)
              ? "border-chantier font-medium text-encre"
              : "border-transparent text-pierre-600 hover:text-encre",
          )}
        >
          {l.libelle}
        </Link>
      ))}
    </nav>
  );
}
