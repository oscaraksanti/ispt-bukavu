import { FileText, Pin } from "lucide-react";
import { TexteArticle } from "@/components/public/texte-article";
import { formatJour } from "@/features/actualites/dates";

export type CommuniqueAffiche = {
  id: string;
  titre: string;
  contenu: string;
  publieLe: Date | null;
  epingle: boolean;
  destinataires: string;
  auteur: string;
  pieces: { id: string; nom: string; typeMime: string }[];
};

/** Corps d'un communiqué, identique sur la valve publique, étudiante et l'administration. */
export function Communique({ c }: { c: CommuniqueAffiche }) {
  return (
    <article>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-wide text-pierre-600 uppercase">
        {c.epingle && (
          <span className="inline-flex items-center gap-1 text-rouge">
            <Pin aria-hidden className="size-3.5" /> Épinglé
          </span>
        )}
        {c.publieLe && (
          <time dateTime={c.publieLe.toISOString()}>{formatJour.format(c.publieLe)}</time>
        )}
        <span>· {c.destinataires}</span>
      </p>
      <h1 className="mt-3 text-[2rem] leading-tight sm:text-[2.5rem]">{c.titre}</h1>
      <p className="mt-2 text-sm text-pierre-600">{c.auteur}</p>
      <div className="mt-8">
        <TexteArticle texte={c.contenu} />
      </div>
      {c.pieces.length > 0 && (
        <ul className="mt-8 space-y-2 border-t border-pierre-200 pt-6">
          {c.pieces.map((p) => (
            <li key={p.id}>
              <a
                href={`/valve/pieces/${p.id}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 text-ispt-600 underline hover:no-underline"
              >
                <FileText aria-hidden className="size-4" /> {p.nom}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
