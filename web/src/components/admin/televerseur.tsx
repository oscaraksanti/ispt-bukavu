"use client";

import { CircleAlert, CircleCheck, ImageUp, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Liste } from "@/components/ui/champs";
import { televerserImage } from "@/features/medias/actions";
import { DOSSIERS_MEDIAS, TYPES_IMAGES_ACCEPTES } from "@/features/medias/regles";
import { cn } from "@/lib/cn";
import { reduireImage as reduire } from "@/lib/reduire-image";

type Suivi = { nom: string; etat: "attente" | "envoi" | "ok" | "erreur"; message?: string };

export function Televerseur() {
  const id = useId();
  const router = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const [dossier, setDossier] = useState("general");
  const [survol, setSurvol] = useState(false);
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const enCours = suivis.some((s) => s.etat === "attente" || s.etat === "envoi");

  async function envoyer(fichiers: File[]) {
    const images = fichiers.filter((f) => TYPES_IMAGES_ACCEPTES.includes(f.type));
    const refuses = fichiers.filter((f) => !TYPES_IMAGES_ACCEPTES.includes(f.type));
    const liste: Suivi[] = [
      ...images.map((f) => ({ nom: f.name, etat: "attente" as const })),
      ...refuses.map((f) => ({
        nom: f.name,
        etat: "erreur" as const,
        message: "Format non pris en charge",
      })),
    ];
    setSuivis(liste);
    const maj = (i: number, s: Partial<Suivi>) =>
      setSuivis((p) => p.map((x, j) => (j === i ? { ...x, ...s } : x)));

    for (const [i, fichier] of images.entries()) {
      maj(i, { etat: "envoi" });
      const donnees = new FormData();
      donnees.set("fichier", await reduire(fichier), fichier.name);
      donnees.set("nom", fichier.name);
      donnees.set("dossier", dossier);
      try {
        const r = await televerserImage(donnees);
        maj(i, r.ok ? { etat: "ok" } : { etat: "erreur", message: r.message });
      } catch {
        maj(i, { etat: "erreur", message: "Connexion interrompue, réessayez." });
      }
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem] sm:items-end">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            if (!enCours) envoyer([...e.dataTransfer.files]);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xs border border-dashed px-6 py-8 text-center transition-colors",
            survol ? "border-ispt-600 bg-ispt-50" : "border-pierre-300 bg-pierre-50",
          )}
        >
          <ImageUp aria-hidden className="size-6 text-ispt-600" />
          <p className="text-sm text-pierre-700">
            Glissez des photos ici ou{" "}
            <button
              type="button"
              disabled={enCours}
              onClick={() => champ.current?.click()}
              className="font-medium text-ispt-600 underline underline-offset-2 hover:no-underline disabled:opacity-50"
            >
              parcourez vos fichiers
            </button>
          </p>
          <p className="text-xs text-pierre-500">
            JPEG, PNG, WebP ou AVIF · réduites automatiquement avant l&apos;envoi
          </p>
          <input
            ref={champ}
            type="file"
            multiple
            accept={TYPES_IMAGES_ACCEPTES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              envoyer([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-dossier`} className="block text-sm font-medium text-pierre-800">
            Ranger dans
          </label>
          <Liste id={`${id}-dossier`} value={dossier} onChange={(e) => setDossier(e.target.value)}>
            {Object.entries(DOSSIERS_MEDIAS)
              .filter(([cle]) => cle !== "photos-officielles")
              .map(([cle, libelle]) => (
                <option key={cle} value={cle}>
                  {libelle}
                </option>
              ))}
          </Liste>
        </div>
      </div>

      {suivis.length > 0 && (
        <ul
          aria-live="polite"
          className="divide-y divide-pierre-200 rounded-xs border border-pierre-200 bg-white"
        >
          {suivis.map((s, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              {s.etat === "ok" && <CircleCheck aria-hidden className="size-4 text-succes" />}
              {s.etat === "erreur" && <CircleAlert aria-hidden className="size-4 text-erreur" />}
              {(s.etat === "envoi" || s.etat === "attente") && (
                <LoaderCircle
                  aria-hidden
                  className={cn("size-4 text-pierre-500", s.etat === "envoi" && "animate-spin")}
                />
              )}
              <span className="min-w-0 flex-1 truncate text-pierre-800">{s.nom}</span>
              <span className="shrink-0 text-xs text-pierre-500">
                {s.etat === "ok"
                  ? "Ajoutée"
                  : s.etat === "erreur"
                    ? s.message
                    : s.etat === "envoi"
                      ? "Envoi…"
                      : "En attente"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
