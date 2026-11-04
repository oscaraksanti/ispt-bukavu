"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavigationEspace({ liens }: { liens: { libelle: string; href: string }[] }) {
  const chemin = usePathname();
  // Les notifications s'ouvrent depuis la cloche : aucun onglet n'est alors actif.
  const horsOnglets = chemin.endsWith("/notifications");
  const actif = (href: string) =>
    !horsOnglets &&
    (chemin === href ||
      (chemin.startsWith(`${href}/`) &&
        !liens.some((l) => l.href.length > href.length && chemin.startsWith(l.href))));
  return (
    <nav aria-label="Espace" className="conteneur -mb-px flex gap-6 overflow-x-auto">
      {liens.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={actif(l.href) ? "page" : undefined}
          className={cn(
            "shrink-0 border-b-2 py-3 text-sm transition-colors",
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
