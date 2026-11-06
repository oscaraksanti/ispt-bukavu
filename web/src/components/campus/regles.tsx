import { ShieldCheck } from "lucide-react";

/** Liste des règles de la communauté (une règle par ligne du réglage). */
export function ListeRegles({ texte }: { texte: string }) {
  return (
    <ul className="space-y-1.5 text-detail text-pierre-800">
      {texte
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => (
          <li key={l} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ispt-600" />
            {l.replace(/^[-•]\s*/, "")}
          </li>
        ))}
    </ul>
  );
}

/** Rappel des règles, replié, une fois qu'elles ont été acceptées. */
export function RappelRegles({ texte }: { texte: string }) {
  return (
    <details className="group rounded-md border border-pierre-200 bg-white px-4 py-3">
      <summary className="flex cursor-pointer items-center gap-2 text-detail font-medium text-encre">
        <ShieldCheck aria-hidden className="size-4 text-ispt-600" />
        Règles du Campus et de la messagerie
      </summary>
      <div className="mt-3">
        <ListeRegles texte={texte} />
      </div>
    </details>
  );
}
