import Image from "next/image";
import type { CSSProperties } from "react";
import type { ImageResolue } from "@/features/medias/url";
import { cn } from "@/lib/cn";

/**
 * Photographie remplissant son conteneur (positionné en relatif).
 * Si l'image a été retirée de la médiathèque, un aplat neutre la remplace.
 */
export function Photo({
  image,
  sizes,
  className,
  style,
  prioritaire = false,
}: {
  image: ImageResolue | null;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  prioritaire?: boolean;
}) {
  if (!image) return <div aria-hidden className="trame absolute inset-0 bg-pierre-100" />;
  return (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      style={style}
      {...(prioritaire ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
    />
  );
}

export function Legende({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <figcaption className="absolute bottom-0 left-0 bg-encre/85 px-2.5 py-1 font-mono text-[0.625rem] tracking-wide text-white uppercase">
      {children}
    </figcaption>
  );
}
