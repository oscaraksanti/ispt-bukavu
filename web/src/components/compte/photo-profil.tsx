"use client";

import { Camera } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";
import { changerPhotoProfil } from "@/features/compte/actions";
import { TYPES_PHOTO_PROFIL } from "@/features/compte/regles";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";
import { reduireImage } from "@/lib/reduire-image";

/**
 * Choix d'une photo : réduite dans le navigateur (forfaits mobiles), puis
 * envoyée dès la sélection.
 */
export function ChoixPhotoProfil({ aUnePhoto }: { aUnePhoto: boolean }) {
  const [etat, envoyer, enCours] = useActionState(changerPhotoProfil, ETAT_INITIAL);
  const [prepare, setPrepare] = useState(false);
  const choix = useRef<HTMLInputElement>(null);

  return (
    <form method="post" onSubmit={(e) => e.preventDefault()}>
      <input
        ref={choix}
        id="photo-profil"
        type="file"
        accept={TYPES_PHOTO_PROFIL.join(",")}
        className="sr-only"
        onChange={async (e) => {
          const fichier = e.target.files?.[0];
          e.target.value = "";
          if (!fichier) return;
          setPrepare(true);
          const fd = new FormData();
          fd.append("photo", await reduireImage(fichier, 800), fichier.name);
          setPrepare(false);
          startTransition(() => envoyer(fd));
        }}
      />
      <label
        htmlFor="photo-profil"
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xs border border-pierre-300 bg-white px-3 text-sm font-medium text-encre focus-within:outline-2 hover:border-encre"
      >
        <Camera aria-hidden className="size-4" />
        {enCours || prepare ? "Envoi…" : aUnePhoto ? "Changer la photo" : "Ajouter une photo"}
      </label>
      <div role="status" className="mt-2 text-detail empty:hidden">
        {etat.statut === "erreur" && <p className="text-erreur">{etat.message}</p>}
        {etat.statut === "succes" && <p className="text-succes">{etat.message}</p>}
      </div>
    </form>
  );
}
