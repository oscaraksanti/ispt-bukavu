# Spécification des besoins

Version 1 · novembre 2026

Ce document fixe le périmètre de la première version de la plateforme, ses acteurs, ses besoins fonctionnels et non fonctionnels, et les règles d'accès. Il s'appuie sur les données officielles de l'institut ([`../sources/donnees-site-ispt.md`](../sources/donnees-site-ispt.md)), le benchmark ([`../recherche/benchmark-rdc.md`](../recherche/benchmark-rdc.md)), l'état de l'art ([`../recherche/etat-de-l-art.md`](../recherche/etat-de-l-art.md)) et le cadre réglementaire ([`../recherche/cadre-reglementaire.md`](../recherche/cadre-reglementaire.md)).

## 1. Périmètre de la version 1

| Inclus | Reporté (perspectives) |
|---|---|
| Site institutionnel entièrement administrable | Messagerie et fil social entre étudiants (charte de modération non définie par l'institut) |
| Admissions en ligne de bout en bout | Paiement en ligne par mobile money |
| Valve numérique avec ciblage et accusé de lecture | Quiz, forums de cours |
| Structure académique LMD | Application mobile native |
| Horaires hebdomadaires | Annuaire interactif des anciens |
| Cours et supports pédagogiques | Synchronisation automatique avec la plateforme ministérielle |
| Notes avec circuit de validation, relevés | |
| Frais académiques (suivi des paiements enregistrés par la caisse) | |
| Documents officiels vérifiables par QR code | |
| Stages pédagogiques et professionnels | |
| Notifications dans l'application et par email | |
| Tableau de bord de la direction | |
| Gestion des rôles et des permissions, journal d'activité | |
| Application installable (PWA) et consultation hors-ligne des données récentes | |

## 2. Acteurs

| Acteur | Description |
|---|---|
| **Visiteur** | Toute personne qui consulte le site public sans compte : futur étudiant, parent, partenaire, employeur. |
| **Vérificateur** | Visiteur particulier qui contrôle l'authenticité d'un document en scannant son QR code. |
| **Candidat** | Personne qui crée un compte pour déposer une candidature en première année. |
| **Étudiant** | Inscrit dans une promotion pour l'année académique en cours. |
| **Enseignant** | Titulaire ou intervenant d'un ou plusieurs cours. |
| **Personnel** | Agent de l'institut disposant d'un ou plusieurs rôles d'administration (voir § 5). |
| **Administrateur technique** | Configure la plateforme, les rôles et les permissions. |
| **Système** | Tâches automatiques : envoi d'emails, rappels, génération de documents, sauvegardes. |

## 3. Besoins fonctionnels

Notation : **BF-xx**. Priorité **M** (indispensable au lancement) ou **S** (souhaitable au lancement).

### 3.1 Site institutionnel

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-01 | Consulter l'accueil, la présentation de l'institut, l'histoire, la mission, la devise et les autorités académiques | M |
| BF-02 | Consulter les filières : présentation, métiers, débouchés, durée, conditions d'admission | M |
| BF-03 | Consulter les actualités et les événements, avec page de détail | M |
| BF-04 | Consulter la galerie photo par album (collation, travaux pratiques, stages, campus) | S |
| BF-05 | Consulter les stages et partenaires, et la page « anciens » | M |
| BF-06 | Consulter le contact, la carte de localisation et envoyer un message | M |
| BF-07 | Vérifier l'authenticité d'un document officiel par son code ou son QR code | M |
| BF-08 | Télécharger les documents publics (dépliant, calendrier académique, communiqués publics) | M |

### 3.2 Admissions

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-10 | Créer un compte candidat (email et mot de passe, vérification de l'email) | M |
| BF-11 | Remplir la candidature en plusieurs étapes, enregistrée automatiquement : identité, coordonnées, études secondaires (section, pourcentage à l'examen d'État), filière souhaitée | M |
| BF-12 | Téléverser les pièces exigées, définies par l'administration (actuellement 8), depuis un téléphone | M |
| BF-13 | Déclarer le paiement des frais de dossier (référence du bordereau) | M |
| BF-14 | Suivre l'état de la candidature et recevoir une notification à chaque changement | M |
| BF-15 | Examiner les candidatures : liste filtrable, contrôle des pièces, demande de complément, décision motivée | M |
| BF-16 | Convertir une candidature acceptée en inscription étudiante avec génération du matricule | M |
| BF-17 | Ouvrir et fermer les campagnes d'admission, avec dates et filières concernées | M |

### 3.3 Valve numérique

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-20 | Publier un communiqué avec un ciblage : public, tout l'institut, filière, promotion, cours | M |
| BF-21 | Joindre des fichiers (PDF, images) à un communiqué | M |
| BF-22 | Programmer une publication, épingler un communiqué, définir une date d'expiration | S |
| BF-23 | Soumettre un communiqué à validation avant publication selon le rôle de l'auteur | M |
| BF-24 | Consulter la valve personnelle, filtrée selon le profil, et marquer comme lu | M |
| BF-25 | Consulter les statistiques de lecture d'un communiqué | S |

### 3.4 Structure académique et horaires

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-30 | Gérer les années académiques, semestres, filières, niveaux (L1 à L4) et promotions | M |
| BF-31 | Gérer les unités d'enseignement, éléments constitutifs, crédits et volumes horaires | M |
| BF-32 | Affecter les enseignants aux cours d'une promotion | M |
| BF-33 | Construire l'horaire hebdomadaire par promotion (jours, plages, salles, enseignants) et le publier | M |
| BF-34 | Signaler un changement de séance (report, annulation) et notifier les étudiants concernés | M |
| BF-35 | Consulter son horaire (étudiant, enseignant), y compris hors-ligne après une première consultation | M |

### 3.5 Cours, notes et documents

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-40 | Déposer des supports de cours (documents, liens) et les organiser par chapitre | M |
| BF-41 | Consulter et télécharger les supports de ses cours | M |
| BF-42 | Saisir les notes par évaluation (interrogations, travaux pratiques, examen) | M |
| BF-43 | Circuit des notes : brouillon → soumis par l'enseignant → validé par le secrétariat académique → publié | M |
| BF-44 | Consulter ses notes publiées et son relevé par semestre | M |
| BF-45 | Demander un document officiel (attestation de fréquentation, relevé, attestation de réussite) | M |
| BF-46 | Générer les documents en PDF avec QR code de vérification, signés par le rôle habilité | M |

### 3.6 Frais académiques

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-50 | Définir le barème des frais par année et par niveau, en USD ou en CDF | M |
| BF-51 | Enregistrer un paiement (bordereau bancaire, guichet), générer le reçu | M |
| BF-52 | Consulter son solde, l'historique et les reçus | M |
| BF-53 | Lister les impayés, exporter la situation financière | M |

### 3.7 Stages

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-60 | Gérer les lieux de stage (entreprises, écoles) et les conventions | M |
| BF-61 | Affecter les étudiants à un lieu et à un encadreur, par type de stage (pédagogique, professionnel) | M |
| BF-62 | Déposer le rapport de stage et saisir l'évaluation | S |

### 3.8 Administration du contenu et de la plateforme

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-70 | Modifier tous les textes et images du site public sans développeur, avec aperçu avant publication | M |
| BF-71 | Gérer une médiathèque : téléversement, recadrage, texte alternatif obligatoire, réutilisation | M |
| BF-72 | Gérer les menus, les pages et l'ordre des sections | S |
| BF-73 | Gérer les réglages généraux : nom officiel, coordonnées, réseaux sociaux, GPS, devise, logo | M |
| BF-74 | Gérer les utilisateurs, importer des listes (CSV), désactiver un compte | M |
| BF-75 | Gérer les rôles et leurs permissions | M |
| BF-76 | Consulter le journal d'activité des actions sensibles | M |
| BF-77 | Consulter le tableau de bord de pilotage : candidatures, inscrits, encaissements, communiqués | M |
| BF-78 | Exporter les inscriptions et les notes dans un format tabulaire compatible avec la plateforme ministérielle | S |

### 3.9 Transversal

| Réf. | Besoin | Priorité |
|---|---|---|
| BF-80 | Notifications dans l'application et par email selon des préférences | M |
| BF-81 | Réinitialisation du mot de passe par email | M |
| BF-82 | Recherche globale dans l'administration | S |

## 4. Besoins non fonctionnels

| Réf. | Exigence | Mesure de réussite |
|---|---|---|
| BNF-01 | **Performance en faible connectivité** | Page d'accueil < 500 Ko transférés au premier chargement ; LCP < 2,5 s en 4G simulée ; pages des espaces connectés utilisables en 3G |
| BNF-02 | **Mobile d'abord** | Toutes les fonctions utilisables sur un écran de 360 px de large |
| BNF-03 | **Accessibilité** | Conformité WCAG 2.2 niveau AA sur les pages publiques et les parcours principaux |
| BNF-04 | **Sécurité** | Contrôle des permissions côté serveur à chaque requête ; mots de passe hachés ; limitation des tentatives de connexion ; en-têtes de sécurité ; couverture des risques OWASP Top 10 |
| BNF-05 | **Confidentialité** | Données minimales, consentement explicite à la collecte, droit d'accès et de rectification, journal des accès aux données sensibles |
| BNF-06 | **Disponibilité** | Surveillance externe, sauvegardes quotidiennes, restauration testée |
| BNF-07 | **Portabilité** | PostgreSQL standard et stockage compatible S3, pour un hébergement possible en RDC |
| BNF-08 | **Maintenabilité** | TypeScript strict, tests automatisés des règles métier et des accès, intégration continue, documentation |
| BNF-09 | **Administrabilité** | Aucune donnée institutionnelle codée en dur dans l'interface |
| BNF-10 | **Langue** | Interface en français ; architecture prête pour d'autres langues |

## 5. Rôles et permissions

Les permissions sont attribuées à des **rôles** modifiables par l'administrateur technique ; un membre du personnel peut cumuler plusieurs rôles. Rôles proposés par défaut, calqués sur l'organigramme :

| Rôle | Responsabilités principales |
|---|---|
| Direction générale | Lecture globale, pilotage, signature des documents |
| Secrétariat général académique | Structure académique, validation et publication des notes, documents académiques |
| Secrétariat général administratif | Personnel, réglages institutionnels |
| Appariteur / secrétariat de section | Admissions, inscriptions, horaires, communiqués de section |
| Caisse | Barèmes, paiements, reçus, situation financière |
| Communication | Contenus du site, actualités, galerie, médiathèque |
| Support | Comptes utilisateurs, réinitialisations |
| Administrateur technique | Rôles, permissions, réglages techniques |

### Matrice (extrait)

L = lecture · É = écriture · V = validation · — = aucun accès

| Domaine | Direction | SGAc | SGAdm | Section | Caisse | Comm. | Support | Enseignant | Étudiant |
|---|---|---|---|---|---|---|---|---|---|
| Contenus du site | L | — | L | — | — | É | — | — | — |
| Communiqués | V | V | V | É | — | É | — | É (ses cours) | L (ciblés) |
| Candidatures | L | L | — | É/V | L | — | — | — | — |
| Structure académique | L | É | — | L | — | — | — | L | — |
| Horaires | L | V | — | É | — | — | — | L (les siens) | L (sa promotion) |
| Notes | L | V | — | L | — | — | — | É (ses cours) | L (les siennes, publiées) |
| Frais | L | — | L | — | É | — | — | — | L (les siens) |
| Documents officiels | V | É | — | É | — | — | — | — | Demande |
| Stages | L | É | — | É | — | — | — | L | L (les siens) |
| Utilisateurs | L | — | É | — | — | — | É | — | — |
| Rôles et permissions | — | — | — | — | — | — | — | — | — |
| Journal d'activité | L | — | L | — | — | — | — | — | — |

Les rôles et permissions sont gérés uniquement par l'administrateur technique.

Décisions de l'institut appliquées par défaut : seule l'administration centrale publie des communiqués adressés à tout l'institut ; le niveau super-administrateur est attribué au Directeur Général ; l'enregistrement des paiements est confié au Directeur Général et au responsable du support technique ; tous les espaces sont lancés simultanément.

## 6. Règles métier principales

1. **Notes** : seule une note **publiée** est visible par l'étudiant ; toute modification d'une note validée la renvoie au statut brouillon et est journalisée.
2. **Barème de notation** : seuils de réussite et règles de compensation sont des **paramètres** de l'année académique, non codés en dur, en attendant la confirmation des textes applicables.
3. **Admission** : les pièces exigées, les frais de dossier et les filières ouvertes sont paramétrés par campagne.
4. **Matricule** : généré à l'inscription définitive, unique et non réutilisable.
5. **Documents** : chaque document émis porte un code unique non devinable ; la page de vérification affiche le type, le titulaire, la date et l'état (valide ou révoqué), sans autre donnée personnelle.
6. **Communiqués** : un communiqué ciblé n'est visible que des destinataires concernés ; un communiqué public est visible de tous.
7. **Frais** : solde = total des frais dus − paiements enregistrés − exonérations ; chaque paiement produit un reçu numéroté.
8. **Journal** : création, modification et suppression de notes, paiements, documents, rôles et comptes sont tracées (auteur, date, avant/après).
