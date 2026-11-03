"use server";

import { updateTag } from "next/cache";
import sharp, { type OutputInfo } from "sharp";
import { z } from "zod";
import { exigerPermission } from "@/features/auth/acces";
import { ETIQUETTES } from "@/features/contenu/lecture";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import {
  cleMedia,
  COTE_MAX_PIXELS,
  DOSSIERS_MEDIAS,
  TAILLE_MAX_OCTETS,
  TYPES_IMAGES_ACCEPTES,
} from "./regles";

export type ResultatEnvoi = { ok: true; id: string } | { ok: false; message: string };

/** Reçoit une image (déjà réduite dans le navigateur), la normalise et l'enregistre. */
export async function televerserImage(formData: FormData): Promise<ResultatEnvoi> {
  const auteur = await exigerPermission("medias.gerer");
  const fichier = formData.get("fichier");
  const dossier = String(formData.get("dossier") ?? "general");
  const nomOriginal = String(formData.get("nom") ?? "");

  if (!(fichier instanceof File) || fichier.size === 0)
    return { ok: false, message: "Aucun fichier reçu." };
  if (!TYPES_IMAGES_ACCEPTES.includes(fichier.type))
    return { ok: false, message: "Format non pris en charge (JPEG, PNG, WebP ou AVIF)." };
  if (fichier.size > TAILLE_MAX_OCTETS)
    return { ok: false, message: "Fichier trop lourd, même après réduction." };
  if (!(dossier in DOSSIERS_MEDIAS)) return { ok: false, message: "Dossier inconnu." };

  let image: { data: Buffer; info: OutputInfo };
  try {
    // Réencodage systématique : orientation corrigée, métadonnées (dont GPS) retirées.
    image = await sharp(Buffer.from(await fichier.arrayBuffer()), { limitInputPixels: 60e6 })
      .rotate()
      .resize({
        width: COTE_MAX_PIXELS,
        height: COTE_MAX_PIXELS,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, message: "Ce fichier n'est pas une image lisible." };
  }

  const nom = nomOriginal || fichier.name || "image";
  const cle = cleMedia(new Date(), jetonAleatoire(6).toLowerCase(), nom);
  await stockage().enregistrer(cle, image.data, "image/webp");
  const media = await db.media.create({
    data: {
      cle,
      nomFichier: nom.replace(/\.[^.]+$/, "") + ".webp",
      typeMime: "image/webp",
      taille: image.info.size,
      largeur: image.info.width,
      hauteur: image.info.height,
      dossier,
      creeParId: auteur.id,
    },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "media_ajoute",
    entite: "Media",
    entiteId: media.id,
    apres: { nomFichier: media.nomFichier, dossier },
  });
  updateTag(ETIQUETTES.medias);
  return { ok: true, id: media.id };
}

const schemaMedia = z.object({
  texteAlternatif: z.string().trim().max(300, "Description trop longue (300 caractères)."),
  legende: z.string().trim().max(200, "Légende trop longue (200 caractères)."),
  dossier: z.string().refine((d) => d in DOSSIERS_MEDIAS, "Dossier inconnu."),
});

export async function modifierMedia(
  id: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("medias.gerer");
  const r = schemaMedia.safeParse({
    texteAlternatif: formData.get("texteAlternatif") ?? "",
    legende: formData.get("legende") ?? "",
    dossier: formData.get("dossier") ?? "general",
  });
  if (!r.success) return echec(r.error.issues[0]?.message ?? "Valeurs invalides.");
  const avant = await db.media.findUnique({ where: { id } });
  if (!avant) return echec("Ce média n'existe plus.");
  await db.media.update({
    where: { id },
    data: { ...r.data, legende: r.data.legende || null },
  });
  await journaliser({
    auteurId: auteur.id,
    action: "media_modifie",
    entite: "Media",
    entiteId: id,
    avant: {
      texteAlternatif: avant.texteAlternatif,
      legende: avant.legende,
      dossier: avant.dossier,
    },
    apres: r.data,
  });
  updateTag(ETIQUETTES.medias);
  return succes("Description enregistrée.");
}

/** Lieux où un média est utilisé (une image utilisée ne peut pas être supprimée). */
async function utilisations(id: string) {
  const [blocs, filieres, autorites, partenaires, actualites] = await Promise.all([
    db.blocPage.findMany({
      select: { cle: true, donnees: true, page: { select: { titre: true } } },
    }),
    db.filiere.findMany({ where: { photoId: id }, select: { nom: true } }),
    db.autorite.findMany({ where: { photoId: id }, select: { nom: true } }),
    db.partenaire.findMany({ where: { logoId: id }, select: { nom: true } }),
    db.actualite.findMany({ where: { couvertureId: id }, select: { titre: true } }),
  ]);
  return [
    ...blocs
      .filter((b) => JSON.stringify(b.donnees).includes(`"${id}"`))
      .map((b) => `page ${b.page.titre}`),
    ...filieres.map((f) => `filière ${f.nom}`),
    ...autorites.map((a) => `autorité ${a.nom}`),
    ...partenaires.map((p) => `partenaire ${p.nom}`),
    ...actualites.map((a) => `actualité ${a.titre}`),
  ];
}

export async function supprimerMedia(id: string): Promise<EtatFormulaire> {
  const auteur = await exigerPermission("medias.gerer");
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return echec("Ce média n'existe plus.");
  if (media.cle.startsWith("public/"))
    return echec(
      "Les photographies officielles livrées avec le site ne peuvent pas être supprimées.",
    );
  const lieux = await utilisations(id);
  if (lieux.length > 0)
    return echec(`Image utilisée (${[...new Set(lieux)].join(", ")}). Remplacez-la d'abord.`);
  await db.media.delete({ where: { id } });
  await stockage().supprimer(media.cle);
  await journaliser({
    auteurId: auteur.id,
    action: "media_supprime",
    entite: "Media",
    entiteId: id,
    avant: { nomFichier: media.nomFichier, cle: media.cle },
  });
  updateTag(ETIQUETTES.medias);
  return succes("Image supprimée.");
}
