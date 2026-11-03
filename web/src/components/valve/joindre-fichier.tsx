"use client";

import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { TYPES_PIECES } from "@/features/admissions/fichiers";
import { joindreFichier } from "@/features/valve/actions";
import { reduireImage } from "@/lib/reduire-image";

export function JoindreFichier({ communiqueId }: { communiqueId: string }) {
  const champ = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Bouton
        type="button"
        variante="contour"
        taille="sm"
        disabled={enCours}
        onClick={() => champ.current?.click()}
      >
        <Paperclip aria-hidden /> {enCours ? "Envoi…" : "Joindre un PDF ou une image"}
      </Bouton>
      <input
        ref={champ}
        type="file"
        accept={TYPES_PIECES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setErreur(null);
          setEnCours(true);
          try {
            const fd = new FormData();
            fd.set(
              "fichier",
              f.type === "application/pdf" ? f : await reduireImage(f, 2400),
              f.name,
            );
            const r = await joindreFichier(communiqueId, fd);
            if (!r.ok) setErreur(r.message);
            else router.refresh();
          } catch {
            setErreur("Connexion interrompue : réessayez.");
          } finally {
            setEnCours(false);
          }
        }}
      />
      {erreur && (
        <p role="alert" className="text-sm text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}
