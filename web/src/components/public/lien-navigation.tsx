"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function LienNavigation({ href, children }: { href: string; children: ReactNode }) {
  const chemin = usePathname();
  const actif = chemin === href || chemin.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "relative inline-flex h-10 items-center px-3 text-[0.9375rem] text-pierre-700 transition-colors hover:text-encre",
        "after:absolute after:inset-x-3 after:bottom-1 after:h-[3px] after:origin-left after:scale-x-0 after:bg-chantier after:transition-transform after:duration-150",
        actif && "text-encre after:scale-x-100",
      )}
    >
      {children}
    </Link>
  );
}
