import { FileText } from "lucide-react";
import { Etiquette } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { estEnRegle, formatMontant, MODES_PAIEMENT } from "@/features/finances/regles";
import type { situationEtudiant } from "@/features/finances/requetes";
import { cn } from "@/lib/cn";

type Situation = NonNullable<Awaited<ReturnType<typeof situationEtudiant>>>;

/** Situation financière : soldes par devise, barèmes, paiements et exonérations. */
export function SituationFinanciere({
  s,
  actionsPaiement,
}: {
  s: Situation;
  actionsPaiement?: (id: string, annule: boolean) => React.ReactNode;
}) {
  const enRegle = estEnRegle(s.lignes);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {s.lignes.length === 0 ? (
          <Etiquette ton="neutre">Aucun frais défini pour l&apos;année</Etiquette>
        ) : enRegle ? (
          <Etiquette ton="succes">En règle</Etiquette>
        ) : (
          <Etiquette ton={s.enRetard ? "erreur" : "attention"}>
            {s.enRetard ? "Paiement en retard" : "Solde à régler"}
          </Etiquette>
        )}
        <span className="text-sm text-pierre-600">Année {s.annee.libelle}</span>
      </div>
      {s.lignes.length > 0 && (
        <dl className="grid gap-3 sm:grid-cols-2">
          {s.lignes.map((l) => (
            <div key={l.devise} className="rounded-md border border-pierre-200 bg-white p-5">
              <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">
                Reste à payer ({l.devise === "USD" ? "dollars" : "francs congolais"})
              </dt>
              <dd
                className={cn(
                  "mt-1 font-serif text-3xl",
                  l.solde > 0 ? "text-encre" : "text-succes",
                )}
              >
                {formatMontant(Math.max(l.solde, 0), l.devise)}
              </dd>
              <dd className="mt-2 text-sm text-pierre-600">
                Dû {formatMontant(l.du, l.devise)} · payé {formatMontant(l.paye, l.devise)}
                {l.exonere > 0 && ` · exonéré ${formatMontant(l.exonere, l.devise)}`}
                {l.solde < 0 && ` · trop-perçu ${formatMontant(-l.solde, l.devise)}`}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {s.baremes.length > 0 && (
        <section>
          <h3 className="font-sans text-sm font-semibold text-encre">Frais de l&apos;année</h3>
          <ul className="mt-2 divide-y divide-pierre-200 rounded-md border border-pierre-200 bg-white text-sm">
            {s.baremes.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-pierre-900">{b.libelle}</span>
                {b.echeance && (
                  <span className="text-xs text-pierre-500">
                    avant le {formatJour.format(b.echeance)}
                  </span>
                )}
                <span className="font-mono">{formatMontant(Number(b.montant), b.devise)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3 className="font-sans text-sm font-semibold text-encre">Paiements</h3>
        {s.paiements.length === 0 ? (
          <p className="mt-2 text-sm text-pierre-600">Aucun paiement enregistré.</p>
        ) : (
          <ul className="mt-2 divide-y divide-pierre-200 rounded-md border border-pierre-200 bg-white text-sm">
            {s.paiements.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3",
                  p.annuleLe && "opacity-60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("text-pierre-900", p.annuleLe && "line-through")}>
                    {formatMontant(Number(p.montant), p.devise)} · {MODES_PAIEMENT[p.mode]}
                  </p>
                  <p className="text-xs text-pierre-500">
                    {formatJour.format(p.payeLe)} · réf. {p.reference}
                    {p.annuleLe && ` · annulé : ${p.motifAnnulation}`}
                  </p>
                </div>
                {!p.annuleLe && (
                  <a
                    href={`/recu/${p.id}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 text-ispt-600 underline hover:no-underline"
                  >
                    <FileText aria-hidden className="size-4" /> Reçu {p.numeroRecu}
                  </a>
                )}
                {actionsPaiement?.(p.id, !!p.annuleLe)}
              </li>
            ))}
          </ul>
        )}
      </section>
      {s.exonerations.length > 0 && (
        <section>
          <h3 className="font-sans text-sm font-semibold text-encre">Exonérations</h3>
          <ul className="mt-2 divide-y divide-pierre-200 rounded-md border border-pierre-200 bg-white text-sm">
            {s.exonerations.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1">{e.motif}</span>
                <span className="font-mono">{formatMontant(Number(e.montant), e.devise)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
