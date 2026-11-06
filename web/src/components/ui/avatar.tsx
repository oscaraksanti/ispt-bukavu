import Image from "next/image";
import { initialesDe } from "@/features/compte/regles";
import { cn } from "@/lib/cn";

/**
 * Photo de profil, ou initiales à défaut. Décorative : le nom de la personne
 * est toujours écrit à côté.
 */
export function Avatar({
  id,
  nom,
  photo,
  taille = 40,
  className,
}: {
  id: string;
  nom: string;
  /** Date de mise à jour de la photo (null : pas de photo). */
  photo: Date | string | null | undefined;
  taille?: number;
  className?: string;
}) {
  const base = "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full";
  if (photo)
    return (
      <Image
        src={`/profils/photo/${id}?v=${new Date(photo).getTime()}`}
        alt=""
        width={taille}
        height={taille}
        unoptimized
        className={cn(base, "bg-pierre-100 object-cover", className)}
        style={{ width: taille, height: taille }}
      />
    );
  return (
    <span
      aria-hidden
      className={cn(base, "bg-ispt-50 font-mono text-xs text-ispt-700", className)}
      style={{ width: taille, height: taille }}
    >
      {initialesDe(nom)}
    </span>
  );
}
