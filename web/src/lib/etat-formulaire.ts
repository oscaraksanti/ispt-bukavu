/** État renvoyé par les actions serveur des formulaires de l'administration. */
export type EtatFormulaire = {
  statut: "succes" | "erreur" | null;
  message?: string;
  erreurs?: Record<string, string>;
  /** Change à chaque envoi pour rejouer l'annonce, même si le message est identique. */
  horodatage?: number;
};

export const ETAT_INITIAL: EtatFormulaire = { statut: null };

export function succes(message: string): EtatFormulaire {
  return { statut: "succes", message, horodatage: Date.now() };
}

export function echec(message: string, erreurs?: Record<string, string>): EtatFormulaire {
  return { statut: "erreur", message, erreurs, horodatage: Date.now() };
}
