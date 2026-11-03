import { Paperclip, Pin } from "lucide-react";
import Link from "next/link";
import { EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { cn } from "@/lib/cn";

export type CommuniqueResume = {
  id: string;
  titre: string;
  extrait: string;
  publieLe: Date | null;
  destinataires: string;
  epingle: boolean;
  pieces: number;
  lu?: boolean;
};

/** Liste de communiqués de la valve, épinglés et non lus mis en évidence. */
export function ListeCommuniques({
  communiques,
  base,
  vide,
}: {
  communiques: CommuniqueResume[];
  base: string;
  vide: string;
}) {
  if (communiques.length === 0) return <EtatVide titre={vide} />;
  return (
    <ul className="divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
      {communiques.map((c) => (
        <li key={c.id} className={cn("relative", c.lu === false && "bg-ispt-50/40")}>
          {c.lu === false && (
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-ispt-600" />
          )}
          <Link href={`${base}/${c.id}`} className="block px-5 py-4 hover:bg-pierre-50">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] tracking-wide text-pierre-600 uppercase">
              {c.epingle && (
                <span className="inline-flex items-center gap-1 text-rouge">
                  <Pin aria-hidden className="size-3" /> Épinglé
                </span>
              )}
              {c.publieLe && <span>{formatJour.format(c.publieLe)}</span>}
              <span>· {c.destinataires}</span>
              {c.lu === false && <span className="text-ispt-600">· Non lu</span>}
            </p>
            <p
              className={cn(
                "mt-1.5 text-lg leading-snug text-encre",
                c.lu === false && "font-medium",
              )}
            >
              {c.titre}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-pierre-600">{c.extrait}</p>
            {c.pieces > 0 && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-pierre-500">
                <Paperclip aria-hidden className="size-3.5" /> {c.pieces} pièce(s) jointe(s)
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function extrait(texte: string, longueur = 200) {
  const plat = texte
    .replace(/^#{2,3}\s+/gm, "")
    .replace(/^[-•*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return plat.length > longueur ? `${plat.slice(0, longueur).replace(/\s\S*$/, "")}…` : plat;
}
