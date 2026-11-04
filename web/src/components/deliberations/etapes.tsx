import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const ETAPES = [
  { cle: "PREPARATION", titre: "Préparation", texte: "Calcul, contrôles, décisions du jury" },
  { cle: "CLOTUREE", titre: "Clôture", texte: "Résultats figés, procès-verbal" },
  { cle: "PROCLAMEE", titre: "Proclamation", texte: "Bulletins vérifiables émis" },
] as const;

/** Progression d'une délibération. */
export function Etapes({ statut }: { statut: string }) {
  const courant = ETAPES.findIndex((e) => e.cle === statut);
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {ETAPES.map((e, i) => {
        const fait = i < courant || statut === "PROCLAMEE";
        const actif = i === courant;
        return (
          <li
            key={e.cle}
            aria-current={actif ? "step" : undefined}
            className={cn(
              "flex gap-3 rounded-md border p-3",
              actif ? "border-encre bg-ispt-50" : "border-pierre-200",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                fait
                  ? "bg-encre text-chantier"
                  : actif
                    ? "bg-encre text-white"
                    : "bg-pierre-100 text-pierre-600",
              )}
            >
              {fait ? <Check aria-hidden className="size-4" /> : i + 1}
            </span>
            <span>
              <span className="block text-sm font-medium text-encre">{e.titre}</span>
              <span className="block text-xs text-pierre-600">{e.texte}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
