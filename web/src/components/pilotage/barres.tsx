/** Graphique en barres horizontales, accessible (tableau lu par les lecteurs d'écran). */
export function Barres({
  titre,
  donnees,
  unite = "",
}: {
  titre: string;
  donnees: { libelle: string; valeur: number; detail?: string }[];
  unite?: string;
}) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur));
  return (
    <figure>
      <figcaption className="font-sans text-sm font-semibold text-encre">{titre}</figcaption>
      {donnees.length === 0 ? (
        <p className="mt-3 text-sm text-pierre-500">Pas encore de données.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <tbody>
            {donnees.map((d) => (
              <tr key={d.libelle}>
                <th scope="row" className="w-40 py-1.5 pr-3 text-left font-normal text-pierre-700">
                  {d.libelle}
                </th>
                <td className="py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-pierre-100">
                      <div
                        className="h-full rounded-full bg-ispt-600"
                        style={{ width: `${(d.valeur / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-xs text-pierre-800">
                      {d.valeur.toLocaleString("fr-FR")}
                      {unite}
                    </span>
                  </div>
                  {d.detail && <p className="mt-0.5 text-xs text-pierre-500">{d.detail}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}
