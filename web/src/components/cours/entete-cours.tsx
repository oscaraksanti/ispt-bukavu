import Link from "next/link";
import { cn } from "@/lib/cn";

/** En-tête commun des pages d'un cours dans l'espace enseignant, avec ses onglets. */
export function EnteteCours({
  coursOffertId,
  code,
  intitule,
  promotion,
  actif,
}: {
  coursOffertId: string;
  code: string;
  intitule: string;
  promotion: string;
  actif: "cours" | "devoirs" | "presences";
}) {
  const base = `/enseignant/cours/${coursOffertId}`;
  const onglets = [
    { cle: "cours", libelle: "Notes et supports", href: base },
    { cle: "devoirs", libelle: "Devoirs", href: `${base}/devoirs` },
    { cle: "presences", libelle: "Présences", href: `${base}/presences` },
  ] as const;
  return (
    <header>
      <Link href="/enseignant" className="text-sm text-ispt-600 underline hover:no-underline">
        ← Mes cours
      </Link>
      <p className="mt-4 font-mono text-xs text-ispt-600">{code}</p>
      <h1 className="mt-2 text-[2.25rem] leading-tight">{intitule}</h1>
      <p className="mt-2 text-pierre-700">{promotion}</p>
      <nav aria-label="Sections du cours" className="mt-6 flex gap-6 border-b border-pierre-200">
        {onglets.map((o) => (
          <Link
            key={o.cle}
            href={o.href}
            aria-current={actif === o.cle ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm transition-colors",
              actif === o.cle
                ? "border-chantier font-medium text-encre"
                : "border-transparent text-pierre-600 hover:text-encre",
            )}
          >
            {o.libelle}
          </Link>
        ))}
      </nav>
    </header>
  );
}
