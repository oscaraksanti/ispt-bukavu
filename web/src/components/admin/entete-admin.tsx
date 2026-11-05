import type { ReactNode } from "react";
import { FilAriane } from "@/components/ui/elements";

/** En-tête de page de l'administration. */
export function EnteteAdmin({
  ariane,
  titre,
  description,
  actions,
}: {
  ariane?: { libelle: string; href?: string }[];
  titre: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-pierre-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {ariane && <FilAriane elements={ariane} />}
        <h1 className="mt-3 text-3xl sm:text-titre-page">{titre}</h1>
        {description && <p className="mt-2 max-w-2xl text-pierre-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Carte blanche à bordure fine. */
export function Panneau({
  titre,
  description,
  children,
  actions,
  className,
  id,
}: {
  id?: string;
  titre?: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-md border border-pierre-200 bg-white ${className ?? ""}`}
    >
      {(titre || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-pierre-200 px-5 py-4">
          <div>
            {titre && <h2 className="font-sans text-base font-semibold text-encre">{titre}</h2>}
            {description && <p className="mt-0.5 text-sm text-pierre-600">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
