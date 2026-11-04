import { cn } from "@/lib/cn";

/** Notes d'une évaluation, en lecture seule. */
export function TableauNotes({
  lignes,
  seuil,
}: {
  lignes: { id: string; nom: string; matricule: string; valeur: number | null; absent: boolean }[];
  seuil: number;
}) {
  return (
    <div
      className="overflow-x-auto rounded-md border border-pierre-200 bg-white"
      tabIndex={0}
      role="region"
      aria-label="Tableau des notes"
    >
      <table className="w-full min-w-[30rem] text-left text-sm">
        <thead className="border-b border-pierre-200 bg-pierre-50 font-mono text-xs tracking-wide text-pierre-600 uppercase">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              N°
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Étudiant
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Matricule
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Note / 20
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pierre-100">
          {lignes.map((l, i) => (
            <tr key={l.id}>
              <td className="px-4 py-2 font-mono text-xs text-pierre-500">{i + 1}</td>
              <td className="px-4 py-2 text-pierre-900">{l.nom}</td>
              <td className="px-4 py-2 font-mono text-xs">{l.matricule}</td>
              <td
                className={cn(
                  "px-4 py-2 text-right font-mono",
                  l.valeur !== null && l.valeur < seuil && "text-erreur",
                )}
              >
                {l.absent ? "Abs." : (l.valeur?.toLocaleString("fr-FR") ?? "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
