import { Bell } from "lucide-react";
import Link from "next/link";
import { libelleCompteur } from "@/features/notifications/regles";
import { cn } from "@/lib/cn";

/** Accès aux notifications, avec le nombre de non lues. */
export function Cloche({
  href,
  nombre,
  clair = false,
}: {
  href: string;
  nombre: number;
  clair?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={
        nombre > 0
          ? `Notifications : ${libelleCompteur(nombre)} non lue${nombre > 1 ? "s" : ""}`
          : "Notifications : aucune nouvelle"
      }
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-xs transition-colors",
        clair
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-pierre-700 hover:bg-pierre-100",
      )}
    >
      <Bell aria-hidden className="size-5" />
      {nombre > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-chantier px-1 font-mono text-legende leading-none font-medium text-encre"
        >
          {libelleCompteur(nombre)}
        </span>
      )}
    </Link>
  );
}
