import { type ReactNode, ViewTransition } from "react";

/**
 * Transition entre les pages publiques : l'ancienne page s'efface, la
 * nouvelle arrive en fondu (voir « Transitions entre les pages » dans
 * globals.css). À placer dans chaque page : les layouts persistent d'une
 * navigation à l'autre et n'entrent ni ne sortent.
 */
export function TransitionPage({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

/**
 * Photo qui « voyage » d'une page à l'autre : la vignette d'une filière ou
 * d'un article se transforme en photo d'en-tête de la page ouverte.
 */
export function PhotoPartagee({ nom, children }: { nom?: string; children: ReactNode }) {
  if (!nom) return <>{children}</>;
  return (
    <ViewTransition name={nom} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
