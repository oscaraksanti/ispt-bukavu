"use server";

import { refresh } from "next/cache";
import { exigerConnexion } from "@/features/auth/acces";
import { peutGererCours } from "@/features/notes/acces";
import { db } from "@/lib/db";
import { echec, type EtatFormulaire, succes } from "@/lib/etat-formulaire";
import { journaliser } from "@/lib/journal";
import { jetonAleatoire } from "@/lib/securite";
import { stockage } from "@/lib/stockage";
import { lienValide, TAILLE_MAX_SUPPORT, TYPES_SUPPORTS } from "./regles";

export async function ajouterSupport(
  coursOffertId: string,
  _etat: EtatFormulaire,
  fd: FormData,
): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/enseignant");
  if (!(await peutGererCours(u, coursOffertId))) return echec("Ce cours ne vous est pas confié.");
  const titre = String(fd.get("titre") ?? "")
    .trim()
    .slice(0, 160);
  const chapitre =
    String(fd.get("chapitre") ?? "")
      .trim()
      .slice(0, 120) || null;
  const url = String(fd.get("url") ?? "").trim();
  const fichier = fd.get("fichier");
  if (!titre) return echec("Indiquez le titre du support.");
  const ordre = await db.support.count({ where: { coursOffertId } });

  if (fichier instanceof File && fichier.size > 0) {
    const extension = TYPES_SUPPORTS[fichier.type];
    if (!extension) return echec("Formats acceptés : PDF, images, Word, PowerPoint, Excel.");
    if (fichier.size > TAILLE_MAX_SUPPORT)
      return echec("Fichier trop lourd (4 Mo au plus) : partagez plutôt un lien.");
    const contenu = Buffer.from(await fichier.arrayBuffer());
    if (extension === "pdf" && contenu.subarray(0, 5).toString() !== "%PDF-")
      return echec("Ce fichier n'est pas un PDF valide.");
    const cle = `prive/supports/${coursOffertId}/${jetonAleatoire(6).toLowerCase()}.${extension}`;
    await stockage().enregistrer(cle, contenu, fichier.type);
    const media = await db.media.create({
      data: {
        cle,
        nomFichier: fichier.name.slice(0, 120),
        typeMime: fichier.type,
        taille: contenu.length,
        dossier: "supports",
        texteAlternatif: titre,
        creeParId: u.id,
      },
    });
    await db.support.create({
      data: { coursOffertId, titre, chapitre, type: "FICHIER", mediaId: media.id, ordre },
    });
  } else if (url) {
    if (!lienValide(url)) return echec("Lien invalide : il doit commencer par https://");
    await db.support.create({ data: { coursOffertId, titre, chapitre, type: "LIEN", url, ordre } });
  } else {
    return echec("Joignez un fichier ou indiquez un lien.");
  }
  await journaliser({
    auteurId: u.id,
    action: "support_ajoute",
    entite: "CoursOffert",
    entiteId: coursOffertId,
    apres: { titre },
  });
  refresh();
  return succes("Support ajouté : il est visible des étudiants du cours.");
}

export async function supprimerSupport(id: string): Promise<EtatFormulaire> {
  const u = await exigerConnexion("/enseignant");
  const s = await db.support.findUnique({ where: { id }, include: { media: true } });
  if (!s) return echec("Support introuvable.");
  if (!(await peutGererCours(u, s.coursOffertId))) return echec("Ce cours ne vous est pas confié.");
  await db.support.delete({ where: { id } });
  if (s.media) {
    await db.media.delete({ where: { id: s.media.id } }).catch(() => undefined);
    await stockage()
      .supprimer(s.media.cle)
      .catch(() => undefined);
  }
  await journaliser({
    auteurId: u.id,
    action: "support_supprime",
    entite: "Support",
    entiteId: id,
  });
  refresh();
  return succes("Support retiré.");
}
