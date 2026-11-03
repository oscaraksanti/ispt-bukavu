import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const styleBouton = cva(
  "inline-flex items-center justify-center gap-2 rounded-xs font-medium whitespace-nowrap transition-colors duration-rapide ease-doux disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        principal: "bg-chantier text-encre hover:bg-chantier-fonce",
        institutionnel: "bg-ispt-600 text-white hover:bg-ispt-700",
        contour: "border border-pierre-300 bg-white text-encre hover:border-encre",
        fantome: "text-encre hover:bg-pierre-100",
        inverse: "border border-white/30 text-white hover:border-white hover:bg-white/5",
        danger: "bg-erreur text-white hover:bg-erreur/90",
      },
      taille: {
        sm: "h-8 px-3 text-sm",
        md: "h-11 px-5 text-[0.9375rem]",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: { variante: "principal", taille: "md" },
  },
);

type VariantesBouton = VariantProps<typeof styleBouton>;

export function Bouton({
  className,
  variante,
  taille,
  ...props
}: ComponentProps<"button"> & VariantesBouton) {
  return <button className={cn(styleBouton({ variante, taille }), className)} {...props} />;
}

export function LienBouton({
  className,
  variante,
  taille,
  ...props
}: ComponentProps<typeof Link> & VariantesBouton) {
  return <Link className={cn(styleBouton({ variante, taille }), className)} {...props} />;
}
