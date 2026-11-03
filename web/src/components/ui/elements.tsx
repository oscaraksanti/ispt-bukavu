import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Lien avec flèche ------------------------------------------------------- */

export function LienFleche({
  className,
  children,
  externe = false,
  ...props
}: ComponentProps<typeof Link> & { externe?: boolean }) {
  const Icone = externe ? ArrowUpRight : ArrowRight;
  return (
    <Link
      className={cn(
        "group inline-flex items-center gap-1.5 font-medium text-ispt-600 underline-offset-4 hover:underline",
        className,
      )}
      {...props}
    >
      {children}
      <Icone
        aria-hidden
        className="size-4 transition-transform duration-150 ease-doux group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* Étiquette ----------------------------------------------------------------- */

const styleEtiquette = cva(
  "inline-flex items-center gap-1.5 rounded-xs px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      ton: {
        neutre: "bg-pierre-100 text-pierre-700",
        ispt: "bg-ispt-50 text-ispt-700",
        succes: "bg-succes-fond text-succes",
        attention: "bg-attention-fond text-attention",
        erreur: "bg-erreur-fond text-erreur",
        chantier: "bg-chantier text-encre",
      },
    },
    defaultVariants: { ton: "neutre" },
  },
);

export function Etiquette({
  className,
  ton,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof styleEtiquette>) {
  return <span className={cn(styleEtiquette({ ton }), className)} {...props} />;
}

/* Filet de cote --------------------------------------------------------------- */

export function FiletCote({ className, clair = false }: { className?: string; clair?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block h-px w-16",
        clair ? "bg-white/40" : "bg-ispt-600/50",
        "before:absolute before:-top-1 before:left-0 before:h-[9px] before:w-px before:bg-current",
        "after:absolute after:-top-1 after:right-0 after:h-[9px] after:w-px after:bg-current",
        clair ? "text-white/40" : "text-ispt-600/50",
        className,
      )}
    />
  );
}

/* En-tête de section --------------------------------------------------------- */

export function EnteteSection({
  numero,
  surtitre,
  titre,
  intro,
  action,
  clair = false,
  className,
  niveau = "h2",
}: {
  numero?: string;
  surtitre?: string;
  titre: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  clair?: boolean;
  className?: string;
  niveau?: "h1" | "h2";
}) {
  const Titre = niveau;
  return (
    <div
      className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}
    >
      <div className="max-w-2xl">
        {(numero || surtitre) && (
          <p className={cn("revele surtitre flex items-center gap-3", clair && "text-chantier")}>
            {numero && <span>{numero}</span>}
            {numero && surtitre && <FiletCote clair={clair} className="w-8" />}
            {surtitre && <span>{surtitre}</span>}
          </p>
        )}
        <Titre
          className={cn(
            "revele-titre ligne-masquee mt-4 text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem]",
            clair && "text-white",
          )}
        >
          <span>{titre}</span>
        </Titre>
        {intro && (
          <p
            style={{ "--i": 1 } as React.CSSProperties}
            className={cn(
              "revele mt-4 text-[1.0625rem] leading-relaxed",
              clair ? "text-white/75" : "text-pierre-600",
            )}
          >
            {intro}
          </p>
        )}
      </div>
      {action && (
        <div className="revele shrink-0" style={{ "--i": 2 } as React.CSSProperties}>
          {action}
        </div>
      )}
    </div>
  );
}

/* Chiffre clé ------------------------------------------------------------------ */

export function Chiffre({
  valeur,
  libelle,
  detail,
  clair = false,
}: {
  valeur: string;
  libelle: string;
  detail?: string;
  clair?: boolean;
}) {
  return (
    <div className={cn("revele border-t pt-4", clair ? "border-white/20" : "border-pierre-300")}>
      <p
        className={cn(
          "font-serif text-[2.75rem] leading-none tracking-tight",
          clair ? "text-white" : "text-encre",
        )}
      >
        {valeur}
      </p>
      <p className={cn("mt-3 text-sm font-medium", clair ? "text-white" : "text-pierre-800")}>
        {libelle}
      </p>
      {detail && (
        <p className={cn("mt-1 text-sm", clair ? "text-white/70" : "text-pierre-500")}>{detail}</p>
      )}
    </div>
  );
}

/* Encadré -------------------------------------------------------------------- */

const styleEncadre = cva("flex gap-3 rounded-md border-l-[3px] px-4 py-3 text-sm", {
  variants: {
    ton: {
      info: "border-ispt-600 bg-ispt-50 text-ispt-900",
      succes: "border-succes bg-succes-fond text-pierre-900",
      attention: "border-attention bg-attention-fond text-pierre-900",
      erreur: "border-erreur bg-erreur-fond text-pierre-900",
    },
  },
  defaultVariants: { ton: "info" },
});

export function Encadre({
  ton,
  titre,
  children,
  icone,
  className,
}: VariantProps<typeof styleEncadre> & {
  titre?: string;
  children: ReactNode;
  icone?: ReactNode;
  className?: string;
}) {
  return (
    <div role="note" className={cn(styleEncadre({ ton }), className)}>
      {icone && <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icone}</span>}
      <div>
        {titre && <p className="font-medium">{titre}</p>}
        <div className={cn(titre && "mt-0.5", "text-pierre-700")}>{children}</div>
      </div>
    </div>
  );
}

/* Squelette de chargement ------------------------------------------------------ */

export function Squelette({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xs bg-pierre-200", className)} />;
}

/* État vide ------------------------------------------------------------------ */

export function EtatVide({
  icone,
  titre,
  description,
  action,
}: {
  icone?: ReactNode;
  titre: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center border border-dashed border-pierre-300 px-6 py-12 text-center">
      {icone && <div className="text-pierre-500 [&_svg]:size-8">{icone}</div>}
      <p className="mt-4 font-medium text-pierre-900">{titre}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-pierre-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* Fil d'Ariane ---------------------------------------------------------------- */

export function FilAriane({
  elements,
  clair = false,
}: {
  elements: { libelle: string; href?: string }[];
  clair?: boolean;
}) {
  return (
    <nav aria-label="Fil d'Ariane">
      <ol
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs tracking-wide uppercase",
          clair ? "text-white/70" : "text-pierre-500",
        )}
      >
        {elements.map((el, i) => (
          <li key={el.libelle} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {el.href ? (
              <Link href={el.href} className={cn(clair ? "hover:text-white" : "hover:text-encre")}>
                {el.libelle}
              </Link>
            ) : (
              <span aria-current="page" className={clair ? "text-white" : "text-pierre-800"}>
                {el.libelle}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
