/**
 * Guides d'utilisation de la plateforme, par profil. Ils décrivent le
 * fonctionnement du logiciel (écrans, boutons, étapes) et non des règles de
 * l'institut : les montants, dates et règlements restent ceux publiés par
 * l'institut dans la plateforme.
 */

export type SectionGuide = { titre: string; etapes?: string[]; texte?: string; conseil?: string };

export type Guide = {
  slug: string;
  titre: string;
  pour: string;
  resume: string;
  /** Espace à ouvrir après la lecture. */
  espace?: { libelle: string; href: string };
  sections: SectionGuide[];
};

export const GUIDES: Guide[] = [
  {
    slug: "etudiant",
    titre: "Guide de l'étudiant",
    pour: "Étudiants inscrits",
    resume:
      "Activer son compte, consulter la valve, l'horaire, les notes, les résultats et les frais, demander un document.",
    espace: { libelle: "Ouvrir mon espace", href: "/etudiant" },
    sections: [
      {
        titre: "Activer son compte (première fois)",
        etapes: [
          "Le secrétariat vous remet une fiche avec votre matricule et un code d'activation (ou vous l'envoie par email).",
          "Ouvrez la page « Activer mon compte » (adresse indiquée sur la fiche, ou scannez le QR code).",
          "Saisissez votre matricule, le code, puis choisissez un mot de passe d'au moins 10 caractères, avec des lettres et des chiffres.",
          "Vous êtes connecté. Les fois suivantes, utilisez « Connexion » avec votre matricule et ce mot de passe.",
        ],
        conseil:
          "Le code ne sert qu'une fois et expire après 30 jours. S'il est perdu ou expiré, demandez-en un nouveau au secrétariat.",
      },
      {
        titre: "Mot de passe oublié",
        etapes: [
          "Si une adresse email est enregistrée sur votre compte : page « Connexion » › « Mot de passe oublié », puis suivez le lien reçu.",
          "Sinon, demandez un nouveau code d'activation au secrétariat de votre section.",
        ],
      },
      {
        titre: "La valve numérique",
        texte:
          "Les communiqués qui vous concernent (institut, filière, promotion, cours) apparaissent dans l'onglet « Valve ». Ouvrez chaque communiqué : votre lecture est enregistrée, ce qui permet au secrétariat de savoir qu'il a été vu. Les pièces jointes s'ouvrent depuis le communiqué.",
      },
      {
        titre: "Horaire et cours",
        etapes: [
          "« Horaire » affiche les séances de la semaine, avec la salle et les éventuels changements.",
          "« Mes cours » donne accès aux supports déposés par les enseignants et aux devoirs.",
          "Pour rendre un devoir : ouvrez-le, joignez votre fichier avant l'échéance et validez.",
        ],
      },
      {
        titre: "Calendrier des examens",
        texte:
          "L'onglet « Examens » affiche vos épreuves jour par jour : heure, cours, modalité et salle, avec les consignes de la session. Une épreuve déplacée porte la mention « Modifiée » et vous recevez une notification. « Ajouter à mon agenda » télécharge un fichier à ouvrir sur votre téléphone : chaque épreuve y apparaît avec un rappel la veille.",
      },
      {
        titre: "Notes et résultats",
        texte:
          "« Notes » montre les évaluations publiées par vos enseignants, cours par cours. « Résultats » présente les décisions du jury une fois proclamées, avec votre bulletin, téléchargeable et vérifiable par QR code.",
        conseil:
          "Une note n'apparaît qu'après validation et publication par le secrétariat académique.",
      },
      {
        titre: "Frais académiques",
        texte:
          "« Frais » indique ce qui est dû pour l'année, les paiements enregistrés par la caisse et le solde. Chaque paiement a un reçu numéroté, imprimable et vérifiable.",
      },
      {
        titre: "Documents officiels",
        etapes: [
          "Onglet « Documents » › « Demander un document » : choisissez l'attestation ou le relevé souhaité.",
          "Le secrétariat traite la demande ; vous êtes notifié quand le document est émis.",
          "Le document s'imprime depuis votre espace. Son QR code permet à quiconque de vérifier son authenticité.",
        ],
      },
      {
        titre: "Sur téléphone et sans connexion",
        texte:
          "La plateforme s'installe sur l'écran d'accueil du téléphone depuis le navigateur (« Ajouter à l'écran d'accueil »). Les pages déjà consultées restent lisibles en cas de coupure ; un bandeau indique alors que vous êtes hors ligne.",
      },
    ],
  },
  {
    slug: "enseignant",
    titre: "Guide de l'enseignant",
    pour: "Enseignants",
    resume:
      "Accepter l'invitation, gérer ses cours : évaluations et notes, supports, devoirs, présences, communiqués et stages.",
    espace: { libelle: "Ouvrir mon espace", href: "/enseignant" },
    sections: [
      {
        titre: "Premier accès",
        etapes: [
          "Vous recevez un email « Votre accès à la plateforme de l'ISPT-Bukavu ».",
          "Ouvrez le lien (valable 72 heures) et choisissez votre mot de passe.",
          "Connectez-vous ensuite avec votre adresse email et ce mot de passe.",
        ],
        conseil:
          "Lien expiré ? Demandez au secrétariat de renvoyer l'invitation depuis la gestion des comptes.",
      },
      {
        titre: "Mes cours",
        texte:
          "La page d'accueil liste les cours qui vous sont confiés pour l'année. Chaque cours comporte trois onglets : « Notes et supports », « Devoirs » et « Présences ». Vous ne voyez que vos propres cours.",
      },
      {
        titre: "Évaluations et notes",
        etapes: [
          "Créez les évaluations du cours (interrogation, travail, examen) avec leur poids ; le total vise 100 %.",
          "Saisissez les notes de chaque étudiant, puis transmettez l'évaluation au secrétariat.",
          "Le secrétariat académique valide puis publie : les étudiants voient alors leurs notes.",
        ],
        conseil:
          "Une évaluation transmise n'est plus modifiable, sauf si le secrétariat vous la renvoie.",
      },
      {
        titre: "Supports et devoirs",
        etapes: [
          "Déposez vos supports (PDF, présentations) depuis l'onglet « Notes et supports ».",
          "Dans « Devoirs », publiez un énoncé avec une échéance ; les étudiants rendent leur copie en ligne.",
          "Corrigez chaque remise (note et appréciation). Les devoirs sont formatifs : ils n'entrent pas dans le bulletin.",
        ],
      },
      {
        titre: "Présences",
        texte:
          "L'onglet « Présences » reprend les séances de l'horaire. Ouvrez une séance pour faire l'appel (présent, absent, retard, excusé).",
      },
      {
        titre: "Examens et surveillances",
        texte:
          "L'onglet « Examens » liste les épreuves de vos cours et celles que vous surveillez, avec les salles. Vous êtes prévenu à la publication du calendrier et à chaque changement.",
      },
      {
        titre: "Communiqués",
        texte:
          "« Valve » › « Nouveau communiqué » permet d'informer les étudiants de vos cours. Selon vos droits, le communiqué est publié directement ou soumis à validation.",
      },
    ],
  },
  {
    slug: "candidat",
    titre: "Guide du candidat",
    pour: "Futurs étudiants",
    resume: "Créer un compte, constituer et déposer son dossier, suivre la décision.",
    espace: { libelle: "Candidater", href: "/candidater" },
    sections: [
      {
        titre: "Créer son compte",
        etapes: [
          "Ouvrez « Candidater » depuis le site, lorsqu'une campagne d'admission est ouverte.",
          "Indiquez votre nom, votre adresse email et choisissez un mot de passe.",
          "Ouvrez le lien de confirmation reçu par email, puis « Confirmer mon adresse » : votre dossier s'ouvre.",
        ],
        conseil:
          "Pas d'email ? Regardez dans les courriers indésirables, ou connectez-vous et cliquez sur « Renvoyer le lien ». Le dossier ne peut être déposé qu'une fois l'adresse confirmée.",
      },
      {
        titre: "Constituer le dossier",
        etapes: [
          "Étape 1 : complétez vos informations (identité, coordonnées, études antérieures, filière souhaitée) et, si la campagne fixe des frais de dossier, le mode et la référence du paiement.",
          "Étape 2 : joignez les pièces demandées (photos nettes ou PDF).",
          "Étape 3 : déposez le dossier. Vous pouvez enregistrer et revenir plus tard avant le dépôt.",
        ],
        conseil:
          "Les pièces exigées et les frais sont affichés dans votre dossier pour la campagne en cours.",
      },
      {
        titre: "Suivre sa candidature",
        texte:
          "Le suivi indique chaque étape de l'instruction. La caisse vérifie votre paiement : votre reçu apparaît alors dans votre espace ; si la référence n'est pas reconnue, vous pouvez la corriger. Si une pièce est refusée, vous êtes prévenu avec le motif. La décision vous est notifiée dans votre espace et par email ; une fois inscrit, vous vous connectez avec le même mot de passe à votre espace étudiant.",
      },
    ],
  },
  {
    slug: "administration",
    titre: "Guide de l'administration",
    pour: "Direction, secrétariats, appariteurs, caisse, communication",
    resume:
      "Mise en service, comptes, structure académique, inscriptions, notes et délibérations, finances, valve et site.",
    espace: { libelle: "Ouvrir l'administration", href: "/admin" },
    sections: [
      {
        titre: "Par où commencer",
        texte:
          "La page « Mise en service » liste ce qui reste à saisir et renvoie à l'écran concerné. Les informations marquées « Donnée de l'institut » attendent une source officielle : saisissez-les dès qu'elles sont connues, rien n'est inventé à leur place.",
      },
      {
        titre: "Comptes du personnel et des enseignants",
        etapes: [
          "« Comptes » › « Inviter une personne », ou « Inviter une liste » à partir d'un fichier CSV (modèle téléchargeable).",
          "Chaque personne reçoit un lien pour choisir son mot de passe ; « Relancer les invitations » renvoie les liens en attente.",
          "Les rôles déterminent les écrans accessibles. Personne ne peut attribuer plus de droits qu'il n'en possède.",
        ],
      },
      {
        titre: "Année, promotions et programme",
        etapes: [
          "« Années et promotions » : marquez l'année courante et créez les promotions (filière × niveau).",
          "« Programme des cours » : unités d'enseignement, cours, crédits, puis affectation des enseignants.",
          "« Horaires » : planifiez les séances ; l'horaire s'imprime au format des valves.",
        ],
      },
      {
        titre: "Étudiants (appariteur, secrétariat)",
        etapes: [
          "« Étudiants » : importez le registre de la promotion (CSV) ou ajoutez les étudiants un à un.",
          "Générez les codes d'activation : imprimez les fiches à découper ou envoyez-les par email.",
          "Les candidats admis s'inscrivent depuis « Admissions » : un matricule leur est attribué.",
        ],
      },
      {
        titre: "Notes et délibérations",
        etapes: [
          "« Notes » : validez puis publiez les évaluations transmises par les enseignants.",
          "« Délibérations » : ouvrez la session de la promotion, vérifiez les contrôles, renseignez le jury, motivez les décisions modifiées, clôturez puis proclamez.",
          "La proclamation émet les bulletins vérifiables et prévient les étudiants. Le procès-verbal s'imprime depuis la session.",
        ],
        conseil:
          "Le règlement (seuil, arrondi, mentions, décisions) se règle par année dans « Délibérations » › « Règlement ».",
      },
      {
        titre: "Examens",
        etapes: [
          "« Examens » › créez la session (ordinaire ou de rattrapage) avec ses dates et ses consignes.",
          "Ajoutez chaque épreuve : cours, jour, heures, salle, modalité et surveillants.",
          "Les conflits (même promotion, même salle ou même surveillant au même moment) sont signalés ; la publication est bloquée tant qu'il en reste.",
          "« Publier le calendrier » prévient étudiants et enseignants ; toute modification ultérieure leur est notifiée. « Imprimer » produit une page par promotion pour les valves.",
        ],
      },
      {
        titre: "Caisse",
        etapes: [
          "« Finances » : enregistrez les barèmes de l'année (montants officiels uniquement).",
          "Enregistrez chaque paiement reçu ; un reçu numéroté et vérifiable est produit.",
          "Les exonérations se saisissent avec leur motif. L'étudiant voit son solde à jour.",
          "Frais de dossier des candidats : en haut de « Finances », vérifiez chaque référence sur le relevé, puis « Paiement reçu » (reçu numéroté) ou « Référence introuvable » (le candidat est prévenu et corrige).",
        ],
      },
      {
        titre: "Valve, site et communication",
        etapes: [
          "« Valve » : publiez un communiqué ciblé (institut, filière, promotion, cours) et suivez les accusés de lecture.",
          "« Pages », « Filières », « Autorités », « Partenaires », « FAQ » : textes et photos du site public.",
          "« Actualités » et « Agenda » : annonces et calendrier académique. « Médiathèque » : photos.",
        ],
      },
      {
        titre: "Documents officiels",
        texte:
          "« Documents » traite les demandes des étudiants et permet d'émettre directement une attestation ou un relevé. En bas de la page, « Paramètres des documents » fixe le signataire et les formules, à confirmer par l'institut.",
      },
    ],
  },
];

export function guide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
