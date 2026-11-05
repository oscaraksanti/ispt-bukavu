import Image from "next/image";
import { cn } from "@/lib/cn";

type Variante = "couleur" | "monochrome" | "blanc";

const PROPORTIONS = { avec: 174 / 204, sans: 174 / 187 };

/** Blason officiel (redessin vectoriel, voir brand/svg). */
export function Blason({
  variante = "couleur",
  devise = false,
  hauteur = 48,
  className,
  prioritaire = false,
  decoratif = false,
}: {
  variante?: Variante;
  devise?: boolean;
  hauteur?: number;
  className?: string;
  prioritaire?: boolean;
  decoratif?: boolean;
}) {
  const fichier = `/brand/blason-${variante}${devise ? "" : "-sans-devise"}.svg`;
  const largeur = Math.round(hauteur * (devise ? PROPORTIONS.avec : PROPORTIONS.sans));
  return (
    <Image
      src={fichier}
      alt={decoratif ? "" : "Blason de l'ISPT-Bukavu"}
      width={largeur}
      height={hauteur}
      unoptimized
      loading={prioritaire ? "eager" : "lazy"}
      style={{ height: hauteur, width: "auto" }}
      className={cn("shrink-0", className)}
    />
  );
}

/** Blason accompagné du nom de l'institut. */
export function Signature({
  clair = false,
  compacte = false,
}: {
  clair?: boolean;
  compacte?: boolean;
}) {
  return (
    <span className="flex items-center gap-3">
      <Blason hauteur={compacte ? 36 : 44} variante="couleur" prioritaire decoratif />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-[1.375rem] font-medium tracking-tight",
            clair ? "text-white" : "text-encre",
          )}
        >
          ISPT-Bukavu
        </span>
        {!compacte && (
          <span
            className={cn(
              "mt-1 font-mono text-legende tracking-[0.12em] uppercase",
              clair ? "text-white/70" : "text-pierre-500",
            )}
          >
            Pédagogie · Technique
          </span>
        )}
      </span>
    </span>
  );
}
