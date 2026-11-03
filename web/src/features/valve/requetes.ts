import "server-only";
import type { CommuniqueAffiche } from "@/components/valve/communique";
import { libellePromotion } from "@/features/academique/regles";
import { db } from "@/lib/db";
import { INCLURE_CIBLE, libelleDestinataires } from "./donnees";
import type { Auteur } from "./regles";

/** Filières, promotions et cours proposés à l'auteur selon ses droits. */
export async function optionsCibles(auteur: Auteur) {
  const general = auteur.permissions.has("valve.publier");
  const [filieres, promotions, cours] = await Promise.all([
    general ? db.filiere.findMany({ where: { ouverte: true }, orderBy: { ordre: "asc" } }) : [],
    general
      ? db.promotion.findMany({
          where: { annee: { courante: true } },
          include: { filiere: true, niveau: true },
          orderBy: [{ filiere: { ordre: "asc" } }, { niveau: { ordre: "asc" } }],
        })
      : [],
    db.coursOffert.findMany({
      where: {
        promotion: { annee: { courante: true } },
        ...(general ? {} : { id: { in: auteur.coursOfferts } }),
      },
      include: { cours: true, promotion: { include: { filiere: true, niveau: true } } },
      orderBy: [{ promotion: { filiere: { ordre: "asc" } } }, { cours: { intitule: "asc" } }],
    }),
  ]);
  return {
    filieres: filieres.map((f) => ({ id: f.id, libelle: f.nom })),
    promotions: promotions.map((p) => ({ id: p.id, libelle: libellePromotion(p) })),
    cours: cours.map((c) => ({
      id: c.id,
      libelle: `${c.cours.intitule} · ${libellePromotion(c.promotion)}`,
    })),
  };
}

export const INCLURE_AFFICHAGE = {
  ...INCLURE_CIBLE,
  auteur: { include: { profilEnseignant: true } },
  piecesJointes: { include: { media: true } },
} as const;

type AvecAffichage = {
  id: string;
  titre: string;
  contenu: string;
  publieLe: Date | null;
  epingle: boolean;
  cible: string;
  auteur: { prenom: string | null; nom: string; profilEnseignant: { titre: string | null } | null };
  piecesJointes: { id: string; media: { nomFichier: string; typeMime: string } }[];
} & Parameters<typeof libelleDestinataires>[0];

export function versAffiche(c: AvecAffichage): CommuniqueAffiche {
  return {
    id: c.id,
    titre: c.titre,
    contenu: c.contenu,
    publieLe: c.publieLe,
    epingle: c.epingle,
    destinataires: libelleDestinataires(c),
    auteur: [c.auteur.profilEnseignant?.titre, c.auteur.prenom, c.auteur.nom]
      .filter(Boolean)
      .join(" "),
    pieces: c.piecesJointes.map((p) => ({
      id: p.id,
      nom: p.media.nomFichier,
      typeMime: p.media.typeMime,
    })),
  };
}
