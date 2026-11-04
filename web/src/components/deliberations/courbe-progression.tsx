/** Courbe des moyennes successives (SVG, sans bibliothèque). */
export function CourbeProgression({
  points,
  seuil,
}: {
  points: { libelle: string; moyenne: number }[];
  seuil: number;
}) {
  const L = 560;
  const H = 180;
  const m = { g: 34, d: 16, h: 16, b: 30 };
  const x = (i: number) =>
    points.length === 1 ? (m.g + L - m.d) / 2 : m.g + (i * (L - m.g - m.d)) / (points.length - 1);
  const y = (v: number) => m.h + ((20 - v) * (H - m.h - m.b)) / 20;
  const chemin = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.moyenne)}`).join(" ");
  const resume = points
    .map((p) => `${p.libelle} : ${p.moyenne.toLocaleString("fr-FR")}`)
    .join(", ");
  return (
    <figure>
      <svg
        viewBox={`0 0 ${L} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Évolution des moyennes : ${resume}`}
      >
        {[0, 5, 10, 15, 20].map((v) => (
          <g key={v}>
            <line x1={m.g} x2={L - m.d} y1={y(v)} y2={y(v)} stroke="#e7e4dc" />
            <text x={m.g - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b6658">
              {v}
            </text>
          </g>
        ))}
        <line
          x1={m.g}
          x2={L - m.d}
          y1={y(seuil)}
          y2={y(seuil)}
          stroke="#9c5208"
          strokeDasharray="4 4"
        />
        <path d={chemin} fill="none" stroke="#283890" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.libelle}>
            <circle
              cx={x(i)}
              cy={y(p.moyenne)}
              r="5"
              fill="#141b4a"
              stroke="#fef200"
              strokeWidth="2"
            />
            <text
              x={x(i)}
              y={y(p.moyenne) - 11}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#141b4a"
            >
              {p.moyenne.toLocaleString("fr-FR")}
            </text>
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#4d493f">
              {p.libelle}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 text-xs text-pierre-600">
        Ligne pointillée : seuil de validation ({seuil}/20).
      </figcaption>
    </figure>
  );
}
