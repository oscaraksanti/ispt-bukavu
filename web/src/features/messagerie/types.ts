/** Message tel qu'il est transmis au navigateur (sérialisable). */
export type MessageClient = {
  id: string;
  auteurId: string | null;
  auteur: string;
  /** Rôle affiché à côté du nom dans les groupes (« enseignant »…). */
  qualite: string | null;
  moi: boolean;
  contenu: string;
  creeLe: string;
  supprime: boolean;
  masque: boolean;
  reponseA: { id: string; auteur: string; extrait: string } | null;
  piece: { nom: string; type: string; taille: number; image: boolean } | null;
  /** Nombre de destinataires l'ayant lu (pour mes messages). */
  lu: number;
};

export type EtatEnvoi = { ok: true; message: MessageClient } | { ok: false; erreur: string };
