"use client";

import { CircleAlert, FileUp, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { styleBouton } from "@/components/ui/bouton";
import { deposerPiece } from "@/features/admissions/actions-candidat";
import { TAILLE_MAX_PIECE, TYPES_PIECES } from "@/features/admissions/fichiers";
import { cn } from "@/lib/cn";
import { reduireImage } from "@/lib/reduire-image";

/** Bouton de dépôt d'une pièce : photo réduite dans le navigateur, ou PDF. */
export function DepotPiece({
  pieceExigeeId,
  libelle,
  remplacer,
}: {
  pieceExigeeId: string;
  libelle: string;
  remplacer: boolean;
}) {
  const champ = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(fichier: File) {
    setErreur(null);
    if (!TYPES_PIECES.includes(fichier.type)) {
      setErreur("Format accepté : photo (JPEG, PNG, WebP) ou PDF.");
      return;
    }
    setEnCours(true);
    try {
      const contenu =
        fichier.type === "application/pdf" ? fichier : await reduireImage(fichier, 2000);
      if (contenu.size > TAILLE_MAX_PIECE) {
        setErreur("Fichier trop lourd (4 Mo au plus).");
        return;
      }
      const donnees = new FormData();
      donnees.set("pieceExigeeId", pieceExigeeId);
      donnees.set("fichier", contenu, fichier.name);
      const r = await deposerPiece(donnees);
      if (!r.ok) setErreur(r.message);
      else router.refresh();
    } catch {
      setErreur("Connexion interrompue : réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <button
        type="button"
        disabled={enCours}
        onClick={() => champ.current?.click()}
        className={cn(
          styleBouton({ variante: remplacer ? "contour" : "institutionnel", taille: "sm" }),
        )}
      >
        {enCours ? <LoaderCircle aria-hidden className="animate-spin" /> : <FileUp aria-hidden />}
        {enCours ? "Envoi…" : remplacer ? "Remplacer" : "Déposer"}
        <span className="sr-only"> : {libelle}</span>
      </button>
      <input
        ref={champ}
        type="file"
        accept={TYPES_PIECES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) envoyer(f);
          e.target.value = "";
        }}
      />
      {erreur && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-erreur">
          <CircleAlert aria-hidden className="size-3.5" /> {erreur}
        </p>
      )}
    </div>
  );
}
