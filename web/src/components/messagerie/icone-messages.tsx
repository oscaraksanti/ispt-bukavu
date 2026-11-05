import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Accès à la messagerie, avec le nombre de conversations non lues. */
export function IconeMessages({
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
          ? `Messages : ${nombre > 99 ? "plus de 99" : nombre} conversation${nombre > 1 ? "s" : ""} non lue${nombre > 1 ? "s" : ""}`
          : "Messages"
      }
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-xs transition-colors",
        clair
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-pierre-700 hover:bg-pierre-100",
      )}
    >
      <MessageCircle aria-hidden className="size-5" />
      {nombre > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-ispt-500 px-1 font-mono text-legende leading-none font-medium text-white ring-2 ring-white"
        >
          {nombre > 99 ? "99+" : nombre}
        </span>
      )}
    </Link>
  );
}
