import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const baseChamp =
  "w-full rounded-xs border border-pierre-300 bg-white px-3 text-[0.9375rem] text-pierre-900 transition-colors duration-rapide placeholder:text-pierre-400 hover:border-pierre-400 focus:border-ispt-600 focus:ring-2 focus:ring-ispt-600/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-pierre-100 aria-invalid:border-erreur aria-invalid:focus:ring-erreur/15";

export function Libelle({
  className,
  obligatoire,
  children,
  ...props
}: ComponentProps<"label"> & { obligatoire?: boolean }) {
  return (
    <label className={cn("block text-sm font-medium text-pierre-800", className)} {...props}>
      {children}
      {obligatoire && (
        <span className="ml-0.5 text-erreur" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

export function Saisie({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(baseChamp, "h-11", className)} {...props} />;
}

export function ZoneTexte({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(baseChamp, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />
  );
}

export function Liste({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(baseChamp, "h-11 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-pierre-500"
      />
    </div>
  );
}

export function Case({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 shrink-0 rounded-xs border-pierre-400 accent-ispt-600 focus-visible:outline-2",
        className,
      )}
      {...props}
    />
  );
}

/** Regroupe libellé, champ, aide et message d'erreur, avec les liens d'accessibilité. */
export function Champ({
  id,
  libelle,
  obligatoire,
  aide,
  erreur,
  children,
  className,
}: {
  id: string;
  libelle: string;
  obligatoire?: boolean;
  aide?: ReactNode;
  erreur?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Libelle htmlFor={id} obligatoire={obligatoire}>
        {libelle}
      </Libelle>
      {children}
      {aide && !erreur && (
        <p id={`${id}-aide`} className="text-[0.8125rem] text-pierre-500">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-erreur`} role="alert" className="text-[0.8125rem] font-medium text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}
