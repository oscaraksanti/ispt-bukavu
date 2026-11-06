"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { publier } from "@/features/campus/actions";
import { PHOTOS_MAX } from "@/features/campus/regles";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";
import { reduireImage } from "@/lib/reduire-image";
import { Avatar } from "@/components/ui/avatar";
import { ChampMentions } from "./champ-mentions";

type Choix = { id: string; libelle: string };

/** Formulaire de publication : texte, public visé, jusqu'à quatre photos. */
export function Compositeur({
  auteur,
  filieres,
  promotions,
  validationPrealable,
}: {
  auteur: { id: string; nom: string; photo: Date | null };
  filieres: Choix[];
  promotions: Choix[];
  validationPrealable: boolean;
}) {
  const [etat, envoyer, enCours] = useActionState(publier, ETAT_INITIAL);
  const [texte, setTexte] = useState("");
  const [photos, setPhotos] = useState<{ fichier: File; apercu: string }[]>([]);
  const [prepare, setPrepare] = useState(false);
  const choix = useRef<HTMLInputElement>(null);

  // Après une publication réussie, le formulaire est vidé.
  const [vu, setVu] = useState(etat);
  if (etat !== vu) {
    setVu(etat);
    if (etat.statut === "succes") {
      setTexte("");
      setPhotos([]);
    }
  }
  // Les aperçus sont libérés quand le formulaire disparaît.
  const courantes = useRef(photos);
  useEffect(() => {
    courantes.current = photos;
  }, [photos]);
  useEffect(() => () => courantes.current.forEach((p) => URL.revokeObjectURL(p.apercu)), []);

  const ajouter = (liste: FileList | null) => {
    const nouvelles = [...(liste ?? [])]
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, PHOTOS_MAX - photos.length)
      .map((fichier) => ({ fichier, apercu: URL.createObjectURL(fichier) }));
    setPhotos((p) => [...p, ...nouvelles]);
  };

  return (
    <form
      method="post"
      onSubmit={async (e) => {
        e.preventDefault();
        setPrepare(true);
        const fd = new FormData(e.currentTarget);
        fd.delete("photos");
        // Photos réduites dans le navigateur avant l'envoi (forfaits mobiles).
        for (const p of photos)
          fd.append("photos", await reduireImage(p.fichier, 1600), p.fichier.name);
        setPrepare(false);
        startTransition(() => envoyer(fd));
      }}
      className="rounded-md border border-pierre-200 bg-white p-4"
    >
      <div className="flex gap-3">
        <Avatar id={auteur.id} nom={auteur.nom} photo={auteur.photo} taille={40} />
        <div className="min-w-0 flex-1">
          <ChampMentions
            id="publication-contenu"
            name="contenu"
            libelle="Votre publication"
            rows={2}
            maxLength={3000}
            hauteurMax={320}
            value={texte}
            onChange={setTexte}
            placeholder="Partagez une information, une question, une réussite… (@ pour mentionner)"
            className="block w-full resize-none border-0 bg-transparent px-0 py-2 text-corps leading-relaxed outline-none placeholder:text-pierre-400"
          />
          {photos.length > 0 && (
            <ul className="mt-2 grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <li
                  key={p.apercu}
                  className="relative aspect-square overflow-hidden rounded-xs bg-pierre-100"
                >
                  <Image
                    src={p.apercu}
                    alt={`Photo ${i + 1} sélectionnée`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.apercu);
                      setPhotos((l) => l.filter((x) => x !== p));
                    }}
                    className="absolute top-1 right-1 inline-flex size-7 items-center justify-center rounded-full bg-encre/80 text-white"
                  >
                    <X aria-hidden className="size-4" />
                    <span className="sr-only">Retirer la photo {i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-pierre-100 pt-3">
        <input
          ref={choix}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            ajouter(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={photos.length >= PHOTOS_MAX}
          onClick={() => choix.current?.click()}
          className="inline-flex h-9 items-center gap-1.5 rounded-xs px-2.5 text-detail font-medium text-pierre-600 hover:bg-pierre-100 disabled:opacity-40"
        >
          <ImagePlus aria-hidden className="size-4" />
          Photos
          <span className="font-mono text-legende text-pierre-500">
            {photos.length}/{PHOTOS_MAX}
          </span>
        </button>
        <label htmlFor="publication-audience" className="sr-only">
          Visible par
        </label>
        <select
          id="publication-audience"
          name="audience"
          defaultValue="INSTITUT"
          className="h-9 max-w-[14rem] rounded-xs border border-pierre-300 bg-white px-2 text-detail"
        >
          <option value="INSTITUT">Tout l&apos;institut</option>
          {filieres.length > 0 && (
            <optgroup label="Une filière">
              {filieres.map((f) => (
                <option key={f.id} value={`FILIERE:${f.id}`}>
                  {f.libelle}
                </option>
              ))}
            </optgroup>
          )}
          {promotions.length > 0 && (
            <optgroup label="Une promotion">
              {promotions.map((p) => (
                <option key={p.id} value={`PROMOTION:${p.id}`}>
                  {p.libelle}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <button
          type="submit"
          disabled={enCours || prepare || (!texte.trim() && photos.length === 0)}
          className="ml-auto h-9 rounded-xs bg-ispt-600 px-4 text-sm font-medium text-white hover:bg-ispt-700 disabled:opacity-40"
        >
          {enCours || prepare ? "Publication…" : "Publier"}
        </button>
      </div>
      <div role="status" className="mt-2 text-detail empty:hidden">
        {etat.statut === "erreur" && <p className="text-erreur">{etat.message}</p>}
        {etat.statut === "succes" && <p className="text-succes">{etat.message}</p>}
        {validationPrealable && etat.statut !== "succes" && (
          <p className="text-pierre-500">
            Les publications sont relues par la modération avant de paraître.
          </p>
        )}
      </div>
    </form>
  );
}
