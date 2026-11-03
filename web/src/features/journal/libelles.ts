/** Libellés lisibles des actions tracées dans le journal d'activité. */
export const LIBELLES_ACTIONS: Record<string, string> = {
  connexion: "Connexion",
  mot_de_passe_defini: "Mot de passe défini",
  contenu_modifie: "Section de page modifiée",
  reglages_modifies: "Identité de l'institut modifiée",
  media_ajoute: "Image ajoutée",
  media_modifie: "Image décrite",
  media_supprime: "Image supprimée",
  filiere_creee: "Filière créée",
  filiere_modifiee: "Filière modifiée",
  filiere_publiee: "Filière publiée",
  filiere_masquee: "Filière masquée",
  filiere_supprimee: "Filière supprimée",
  autorites_modifiees: "Autorités modifiées",
  partenaires_modifies: "Partenaires modifiés",
  utilisateur_cree: "Compte créé",
  utilisateur_modifie: "Rôles d'un compte modifiés",
  utilisateur_suspendu: "Compte suspendu",
  utilisateur_reactive: "Compte réactivé",
  invitation_renvoyee: "Invitation renvoyée",
  role_modifie: "Permissions d'un rôle modifiées",
  actualite_creee: "Article créé",
  actualite_modifiee: "Article modifié",
  actualite_publiee: "Article publié",
  actualite_retiree: "Article retiré du site",
  actualite_supprimee: "Article supprimé",
  evenement_cree: "Événement ajouté",
  evenement_modifie: "Événement modifié",
  evenement_supprime: "Événement supprimé",
  faq_modifiee: "Questions fréquentes modifiées",
  message_traite: "Message classé",
  message_rouvert: "Message rouvert",
  message_supprime: "Message supprimé",
};

export function libelleAction(action: string) {
  return LIBELLES_ACTIONS[action] ?? action.replaceAll("_", " ");
}
