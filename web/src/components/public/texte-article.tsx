import { analyserTexte } from "@/features/actualites/texte";

/** Rendu d'un texte saisi dans l'administration (jamais de HTML brut). */
export function TexteArticle({ texte }: { texte: string }) {
  return (
    <div className="prose-ispt max-w-none">
      {analyserTexte(texte).map((bloc, i) => {
        if (bloc.type === "intertitre") return <h2 key={i}>{bloc.texte}</h2>;
        if (bloc.type === "liste")
          return (
            <ul key={i}>
              {bloc.elements.map((e, j) => (
                <li key={j}>{e}</li>
              ))}
            </ul>
          );
        return <p key={i}>{bloc.texte}</p>;
      })}
    </div>
  );
}
