import type { ImageResolue } from "@/features/medias/url";
import type { DonneesBloc } from "./donnees";

export type LecteurBloc = {
  texte(cle: string): string;
  image(cle: string): ImageResolue | null;
  liste(cle: string): LecteurBloc[];
  visible: boolean;
};

/** Accès typé et tolérant aux données d'un bloc déjà résolu. */
export function lecteur(donnees: DonneesBloc | undefined): LecteurBloc {
  const d = donnees ?? {};
  return {
    texte: (cle) => (typeof d[cle] === "string" ? (d[cle] as string) : ""),
    image: (cle) => {
      const v = d[cle];
      return v && typeof v === "object" && "url" in v ? (v as ImageResolue) : null;
    },
    liste: (cle) =>
      Array.isArray(d[cle])
        ? (d[cle] as unknown[]).map((e) =>
            lecteur(e && typeof e === "object" ? (e as DonneesBloc) : {}),
          )
        : [],
    visible: d.visible !== false,
  };
}
