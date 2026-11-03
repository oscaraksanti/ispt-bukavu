# État de l'art : plateformes d'admission, systèmes d'information étudiants et bonnes pratiques de conception

Document de travail pour le chapitre 2 du mémoire (« Cadre conceptuel et état de l'art »). Toutes les sources ont été consultées le 3 novembre 2026. Chaque chiffre est suivi de sa source ; les points non vérifiés sur une source primaire sont signalés par la mention **[à confirmer]**.

Conventions de lecture :

- « Source primaire » : site ou document officiel de l'organisme concerné (ministère, université, W3C, OWASP, ITU, GSMA).
- « Source secondaire » : presse ou site d'information. Utilisée seulement quand aucune source primaire n'a été trouvée, et signalée comme telle.
- Les montants et dates sont donnés tels que publiés, sans conversion.

---

## Volet A. Plateformes nationales d'admission et d'orientation dans le supérieur

### A.1 Tableau comparatif

| Critère | Campusen (Sénégal) | CampusFaso (Burkina Faso) | Parcoursup (France) | KUCCPS (Kenya) |
|---|---|---|---|---|
| Opérateur | CINERI (MESRI) | DGESup (MESRSI) | MENESR | KUCCPS (agence publique) |
| Périmètre | Universités publiques et ISEP | Établissements publics et privés conventionnés ; admission et gestion des dossiers étudiants (notes, examens, délibérations) | Quasi-totalité des formations du supérieur (25 000 en 2025) | Universités, TVET, KMTC, TTC |
| Identifiant | INE attribué à la création du compte | INE attribué à la création du compte | Dossier Parcoursup | Numéro d'index KCSE |
| Nombre de vœux | Variable selon les années **[à confirmer]** | 12 choix, dont 6 au plus dans une même université (2025) | Vœux et sous-vœux (plafond non vérifié **[à confirmer]**) ; jusqu'à 10 nouveaux vœux en phase complémentaire | Plusieurs choix, révisables lors de fenêtres dédiées |
| Paiement | Droits d'inscription à régler sous 8 jours après proposition définitive, auprès d'opérateurs agréés | Frais d'inscription payés en ligne après orientation (Orange Money, OTP) | Non trouvé de source primaire récente **[à confirmer]** | 1 500 KSh via eCitizen (M-Pesa, banque, carte) |
| Notification | Email + SMS | Email + quittance PDF | Tableau de bord + messages | Portail + SMS |
| Volumétrie publiée | 74 476 inscrits sur 77 388 bacheliers (août 2025) | Non trouvée | 980 000 candidats, 13 M vœux et sous-vœux (2025) | 980 444 à 980 535 éligibles ; 293 869 placés (cycle 2026) |
| Accompagnement | Interdiction des intermédiaires | Numéro vert 80 00 13 80 | CAES, outil de simulation, site d'entraînement | Fenêtres de révision des choix |

### A.2 Fiches

#### Campusen (Sénégal)

**Fonctionnement.** Campusen est la plateforme nationale d'orientation des bacheliers vers les universités publiques et les ISEP. Elle est gérée par la Cyber infrastructure nationale pour l'enseignement supérieur, la recherche et l'innovation (CINERI), selon son directeur général cité par *Le Soleil* ([Kande, 2025](https://lesoleil.sn/actualites/education/orientation-des-nouveaux-bacheliers-demarrage-des-operations-ce-vendredi/)). Un guide d'orientation distingue deux adresses : `campusen.sn` (vitrine, catalogue) et `orientation.campusen.sn` (procédure) ([SenCampus, s. d.](https://www.sencampus.com/dossiers/apres-le-bac-au-senegal/campusen-orientation-bacheliers), source secondaire).

**Étapes** (d'après SenCampus, source secondaire non officielle) : ouverture annoncée par communiqué du ministère ; création du compte et attribution de l'INE (numéro d'identification nationale de l'étudiant) ; saisie des informations et résultats ; formulation des vœux (universités publiques et ISEP) ; classement et validation ; publication de l'affectation ; inscription administrative auprès de l'établissement d'accueil. Le recours à un intermédiaire pour saisir les vœux est présenté comme interdit et sanctionné par la non-orientation.

**Calendrier et volumétrie 2025** ([Kande, 2025](https://lesoleil.sn/actualites/education/orientation-des-nouveaux-bacheliers-demarrage-des-operations-ce-vendredi/)) :

- inscriptions ouvertes dès le 15 mai 2025, plateforme fermée le 30 juin, rouverte du 4 au 11 août après les résultats du bac ;
- 77 388 bacheliers en 2025, dont 74 476 inscrits sur Campusen au 11 août 2025 ;
- orientations lancées le 29 août 2025, avec un email et un SMS envoyés à chaque bachelier.

**Paiement et suivi.** Les bacheliers ayant reçu une proposition définitive doivent régler leurs droits d'inscription « dans un délai de huit jours auprès des opérateurs agréés », faute de quoi ils sont considérés comme ayant renoncé ; les autres restent sur liste d'attente ([Kande, 2025](https://lesoleil.sn/actualites/education/orientation-des-nouveaux-bacheliers-demarrage-des-operations-ce-vendredi/)). Le montant n'a pas été trouvé sur une source primaire **[à confirmer]**.

**Leçons.** (1) Un identifiant étudiant unique dès la candidature, réutilisé ensuite. (2) Double canal de notification email + SMS, adapté à un public dont tous n'ont pas d'email consulté. (3) Délai de paiement court et explicite, avec conséquence annoncée. (4) Afflux de dernière minute : le guide SenCampus mentionne que la plateforme est « prise d'assaut » avant la clôture, ce qui impose de dimensionner pour les pics.

#### CampusFaso (Burkina Faso)

**Fonctionnement.** Le ministère la définit comme une « plateforme intégrée de l'enseignement supérieur », dédiée « à la gestion centralisée et dématérialisée des procédures d'admission et de gestion des dossiers des étudiants (notes, examen, délibération) dans les institutions d'enseignement supérieur publiques et privées conventionnées » ([MESRSI, 2025](https://www.mesrsi.gov.bf/fileadmin/user_upload/storage/fichiers/Declaration_liminaire__Orientation_2025__.pdf)). L'admission se fait par « orientation automatique » ou par « recrutement par test ou sélection sur dossier ».

**Étapes 2025** ([MESRSI, 2025](https://www.mesrsi.gov.bf/fileadmin/user_upload/storage/fichiers/Declaration_liminaire__Orientation_2025__.pdf)) : créer un compte pour obtenir l'INE ; formuler 12 choix au total, dont six au plus dans une même université ; payer les frais une fois orienté. Calendrier : demandes du 28 juillet au 10 août 2025 ; résultats du 10 au 13 septembre ; paiement du 14 au 21 septembre ; session de rattrapage du 22 au 29 septembre ; résultats le 30 septembre ; second paiement du 3 au 10 octobre ; rentrée le 1er octobre 2025. Assistance par numéro vert (80 00 13 80).

**Paiement.** Le mémo officiel décrit un bouton « Payer mes frais d'inscription » visible par le candidat orienté, le choix d'Orange Money, la génération d'un code OTP à 6 chiffres par USSD (`*144*4*6*montant#`), valable 30 minutes, puis l'envoi par email d'une quittance qui reste téléchargeable dans le dossier avec la mention « payé le » et la date ([DGESup, s. d.](https://campusfaso.bf/memoOrangeMoney.pdf)).

**Volumétrie.** Aucun chiffre officiel de candidats n'a été trouvé pour 2025 **[à confirmer]**.

**Leçons.** (1) Un même système couvre l'admission puis la vie académique (notes, délibérations) : c'est le modèle le plus proche de la plateforme visée pour l'ISPT-Bukavu. (2) Le paiement mobile est intégré au dossier et produit une quittance téléchargeable, ce qui supprime le passage au guichet. (3) Une session de rattrapage est prévue d'emblée dans le calendrier.

#### Parcoursup (France), référence

**Fonctionnement et calendrier 2026** ([MENESR, 2025](https://www.enseignementsup-recherche.gouv.fr/sites/default/files/2025-10/bilan-de-la-proc-dure-d-admission-2025-38034.pdf)) : ouverture de la carte des formations le 17 décembre ; inscriptions et vœux à partir du 19 janvier ; date limite des vœux le 12 mars ; confirmation et dossier complet au 1er avril ; phase d'admission principale à partir du 2 juin ; phase complémentaire à partir du 11 juin (jusqu'à 10 nouveaux vœux) ; fin de la phase principale le 11 juillet ; fin de la phase complémentaire le 10 septembre.

**Volumétrie 2025** ([MENESR, 2025](https://www.enseignementsup-recherche.gouv.fr/sites/default/files/2025-10/bilan-de-la-proc-dure-d-admission-2025-38034.pdf)) :

- 980 000 candidats (650 000 lycéens, 183 000 étudiants en réorientation, 112 000 en reprise d'études, 35 000 de scolarité étrangère) ;
- 13 millions de vœux et sous-vœux confirmés ;
- 25 000 formations, dont 11 000 en apprentissage ;
- 4,2 millions de propositions d'admission, dont 2,7 millions dès le premier jour ;
- 835 000 candidats ont reçu au moins une proposition ; 661 294 en ont accepté une ;
- 22 235 candidats sans proposition ont saisi une commission d'accès à l'enseignement supérieur (CAES) ;
- l'outil de simulation des chances d'admission a été utilisé 14,5 millions de fois.

**Perception.** Le baromètre cité dans le bilan indique que la procédure est jugée stressante par 84 % des lycéens, claire par 76 %, transparente par 53 % seulement.

**Frais.** Le livret ministériel de 2019 mentionne la gratuité de la procédure (« pas de frais de dossier ») dans le passage consacré aux instituts de formation en soins infirmiers ([MESRI, 2019](https://www.enseignementsup-recherche.gouv.fr/sites/default/files/content_migration/document/Livret_Parcoursup_-_Janvier_2019_1058633.pdf)). Aucune source primaire récente sur la gratuité générale n'a été consultée **[à confirmer]**.

**Leçons.** (1) Un calendrier stable publié très tôt. (2) Des outils d'aide à la décision (comparateur, simulateur, site d'entraînement). (3) Un dispositif humain pour les candidats sans solution. (4) La transparence reste le point faible perçu : publier les critères et l'état du dossier compte autant que la technique.

#### KUCCPS (Kenya)

**Fonctionnement.** La Kenya Universities and Colleges Central Placement Service place les candidats issus de l'examen KCSE dans les universités et établissements techniques. Les candidats se connectent au portail étudiant avec leur numéro d'index KCSE et l'année d'examen ([Nderi, 2026](https://hapakenya.com/2026/07/09/over-290000-students-placed-as-kuccps-releases-2026-higher-education-results/), source secondaire).

**Paiement.** Frais obligatoires de 1 500 KSh pour le placement en licence et en diplôme, payés via eCitizen (M-Pesa, banque ou carte, Paybill 222222) après la saisie des choix ; la référence eCitizen est exigée pour finaliser la candidature et réutilisable lors d'une révision des choix ou d'une nouvelle fenêtre, sans repayer ([Wanjala, 2026](https://the-star.co.ke/news/2026-04-24-why-you-should-keep-your-kuccps-payment-reference-number), source secondaire relayant KUCCPS).

**Calendrier et volumétrie du cycle 2026** (candidats du KCSE 2025) :

- fenêtre principale ouverte jusqu'au 6 mai 2026 ; date d'ouverture donnée au 7 avril par *The Star* et au 17 avril par HapaKenya **[à confirmer]** ;
- 980 444 candidats éligibles et 322 396 places validées par la CUE selon *The Star* ([Wanjala, 2026](https://the-star.co.ke/news/2026-04-24-why-you-should-keep-your-kuccps-payment-reference-number)), contre 980 535 éligibles et 327 150 places selon HapaKenya ([Nderi, 2026](https://hapakenya.com/2026/07/09/over-290000-students-placed-as-kuccps-releases-2026-higher-education-results/)) ; l'écart n'est pas expliqué **[à confirmer]** ;
- 293 869 étudiants placés, dont 202 133 en licence ; deux fenêtres de révision des choix (16-22 mai et 27-31 mai 2026) ; notification par SMS ([Nderi, 2026](https://hapakenya.com/2026/07/09/over-290000-students-placed-as-kuccps-releases-2026-higher-education-results/)).

**Leçons.** (1) La référence de paiement est un objet de première classe : elle sert de preuve et évite de payer deux fois. (2) Les fenêtres de révision réduisent le nombre de candidats sans affectation. (3) L'identifiant d'examen national sert d'identifiant de connexion, ce qui supprime une étape de création de compte.

#### Autres exemples examinés et écartés

- **Côte d'Ivoire** (préinscriptions via `orientationsup.net` et `bac.mesrs-ci.net`) : seules des sources secondaires ont été trouvées, sans volumétrie ni tarif officiels. Non retenu faute de source primaire.
- **Rwanda** : pas de source primaire exploitable trouvée dans le temps imparti. Non retenu.

### A.3 Synthèse du volet A

Les quatre dispositifs partagent un schéma commun : identifiant unique dès la candidature, dossier en ligne, choix multiples classés, publication des résultats en ligne, paiement dématérialisé lié au dossier, notification multicanale. Les deux plateformes africaines francophones (Campusen, CampusFaso) intègrent explicitement le mobile money et l'INE ; CampusFaso va plus loin en couvrant aussi la gestion académique. Aucune ne publie, dans les sources trouvées, de bilan aussi détaillé que Parcoursup.

---

## Volet B. Systèmes d'information étudiants (SIS) et plateformes d'apprentissage (LMS)

### B.1 Tableau comparatif

| Solution | Nature | Licence | Coût logiciel | Couverture fonctionnelle | Limites pour l'ISPT-Bukavu |
|---|---|---|---|---|---|
| Moodle | LMS | GPL v3 ou ultérieure | Nul (hébergement et maintenance à prévoir) | Cours, devoirs, quiz, forums ; pas de SIS ni de finances (selon l'éditeur d'OpenEduCat) | Ne couvre ni admissions, ni frais, ni valve ciblée ; PHP à maintenir |
| Canvas LMS | LMS | AGPL-3.0 | Nul en auto-hébergement ; version hébergée commerciale (tarifs non examinés) | Cours, évaluations | Même périmètre LMS ; déploiement lourd |
| Open edX | LMS orienté cours à grande échelle | AGPL v3 | Nul en auto-hébergement | Cours en ligne, MOOC | Exploitation complexe (Docker/Tutor, micro-frontends séparés) |
| OpenEduCat | ERP éducatif sur Odoo | LGPL v3 (édition communautaire) ; modules entreprise sous licence séparée | Nul pour l'édition communautaire | SIS, LMS, présences, frais, emplois du temps, examens, admissions | Multi-campus et support réservés à l'offre entreprise ; personnalisation Odoo à maîtriser |
| Fedena (Project Fedena) | Gestion scolaire | Apache 2.0 | Nul | Dossiers, examens, présences, frais (selon sources secondaires) | Dépôt communautaire sans commit sur `master` depuis juillet 2016 |
| PeopleSoft + Amathuba (UCT) | SIS propriétaire + LMS Brightspace (D2L) | Propriétaires | Licences commerciales (montants non publiés) | Inscriptions, frais, résultats ; LMS mobile | Coût et dépendance éditeur hors de portée d'un institut |
| ACMIS + MUELE (Makerere) | SIS développé localement + LMS Moodle | ACMIS : non précisé | Financement public | Inscription, frais, résultats ; cours en ligne | Migration difficile (données financières remises à zéro) |
| Portail Université de Lomé | Préinscription/inscription en ligne | Non précisé | Non précisé | Préinscription et inscription | Peu documenté publiquement |
| Portail UCAD | Préinscription en ligne + paiement | Non précisé | Non précisé | Préinscription, préinscription pédagogique, paiement mobile | Étapes encore physiques (visite médicale, quitus, scolarité) |

### B.2 Fiches

#### Moodle

- **Licence** : GPL, version 3 pour Moodle 2.x et ultérieures, « ou toute version ultérieure » ; la licence ne s'étend pas automatiquement aux plugins, dont la licence est fixée par chaque développeur ([Moodle, 2026](https://moodledev.io/general/license)).
- **Diffusion** : la page de statistiques officielle affiche 145 794 sites enregistrés, 512 985 233 utilisateurs et 235 pays ([Moodle, s. d.](https://stats.moodle.org/)). Il s'agit de sites **enregistrés** ; la page précise que des vérifications périodiques peuvent faire baisser le compte.
- **Exemple africain** : MUELE, le LMS officiel de Makerere, est « customized from the Moodle Open Source software » ([Makerere University, s. d.](https://answers.mak.ac.ug/node/82)).
- **Limites** : Moodle est un LMS ; il ne gère ni admissions, ni frais, ni dossiers académiques. Le tableau comparatif d'OpenEduCat le résume par « LMS only » ([OpenEduCat, s. d.-a](https://openeducat.org/open-source-education-erp/)) — source concurrente, à lire avec prudence.

#### Canvas LMS

- **Licence** : le dépôt officiel `instructure/canvas-lms` est publié sous AGPL-3.0 et se présente comme « The open LMS by Instructure, Inc. » ([Instructure, s. d.](https://github.com/instructure/canvas-lms)).
- **Modèle de coût** : code libre en auto-hébergement ; offre hébergée commerciale par Instructure (tarifs non examinés ici).
- **Limites** : périmètre LMS uniquement ; l'AGPL impose de publier les modifications si la version modifiée est offerte en service réseau.

#### Open edX

- **Licence** : AGPL v3 « unless otherwise noted » ([Open edX, s. d.](https://docs.openedx.org/projects/edx-platform/en/latest/references/docs/README.html)).
- **Exploitation** : la documentation recommande Tutor, distribution communautaire basée sur Docker, pour l'auto-hébergement, et précise que la plupart des interfaces ont migré vers des « micro-frontends » à installer et exécuter séparément ([Open edX, s. d.](https://docs.openedx.org/projects/edx-platform/en/latest/references/docs/README.html)).
- **Limites** : conçu pour des cours à grande échelle ; exploitation trop lourde pour une petite équipe locale.

#### OpenEduCat (Odoo)

- **Licence et coût** : édition communautaire sous LGPL v3, sans frais de licence ; modules entreprise (pointage biométrique, reconnaissance faciale, multi-campus, support avec SLA) sous licence séparée ([OpenEduCat, s. d.-a](https://openeducat.org/open-source-education-erp/)).
- **Socle** : modules éducatifs ajoutés à Odoo, dont l'édition Community est publiée sous LGPLv3 ([OpenEduCat, s. d.-b](https://openeducat.org/glossary/what-is-odoo-erp-education/)).
- **Fonctions** : SIS, LMS, présences, frais, emplois du temps, examens, portail parents, admissions, bibliothèque, RH et paie.
- **Chiffres d'adoption** : « 30 000+ institutions » dans « 130+ pays » ([OpenEduCat, s. d.-a](https://openeducat.org/open-source-education-erp/)) — déclaration commerciale de l'éditeur, non vérifiée de façon indépendante.
- **Limites** : la gestion multi-campus est réservée à l'édition entreprise ; la personnalisation exige de maîtriser Odoo (Python) ; pas de notion native de « valve » ciblée par promotion dans les sources consultées.

#### Fedena (Project Fedena)

- **Nature et licence** : système de gestion scolaire en Ruby on Rails, développé par Foradian Technologies puis ouvert, publié sous Apache License 2.0 ([Project Fedena, s. d.](https://github.com/projectfedena/fedena)).
- **Activité** : d'après l'API GitHub interrogée le 3 novembre 2026, le dernier commit de la branche `master` date du 20 juillet 2016 (dernier `push` sur le dépôt : 18 mai 2020).
- **Limites** : base de code non maintenue activement ; une offre commerciale homonyme existe mais n'a pas été examinée.

#### University of Cape Town (Afrique du Sud)

- **SIS** : PeopleSoft, « online self-service student administration system », géré par Student Systems Support ; l'étudiant y met à jour ses coordonnées, consulte son inscription aux cours et son compte de frais ; ses résultats de fin d'année « will also only be available on this system » ([UCT ICTS, s. d.-a](https://icts.uct.ac.za/node/8183)).
- **LMS** : Amathuba, basé sur D2L Brightspace, hébergé sur Amazon Web Services ; l'application Brightspace Pulse permet de télécharger le contenu des cours pour un accès hors ligne ([UCT ICTS, s. d.-b](https://icts.uct.ac.za/amathuba)). Le déploiement pour l'enseignement de première année a été annoncé en février 2023 ([UCT News, 2023](https://news.uct.ac.za/article/-2023-02-01-preparing-for-first-year-teaching-on-amathuba)).
- **Leçon** : séparation nette SIS / LMS, et attention explicite à l'accès hors ligne sur mobile.

#### Makerere University (Ouganda)

- **SIS** : ACMIS (Academic Management Information System), « locally developed through government support » par la DICTS de Makerere, le COCIS et la DICTS de Kyambogo, en remplacement d'AIMS dont le support public a cessé le 30 juin 2021 ; adopté par les vice-chanceliers des universités publiques et géré par un consortium ([Mugabi, s. d.](https://dicts.mak.ac.ug/articles/acmis-system-can-be-accessed-any-location-globally)).
- **Difficultés de migration** publiées par la DICTS : numéros étudiants non migrés, coordonnées inaccessibles, structures de frais manquantes, résultats erronés, et « all credit balances on ACMIS were set to 0 » faute de migration de l'historique financier ([Mugabi, s. d.](https://dicts.mak.ac.ug/articles/acmis-system-can-be-accessed-any-location-globally)).
- **LMS** : MUELE (Moodle), compte créé en libre-service avec l'adresse email institutionnelle ([DICTS Makerere, s. d.](https://dicts.mak.ac.ug/articles/how-create-your-muele-account)).
- **Leçon** : la reprise des données existantes (soldes, résultats) est un risque majeur ; elle doit être planifiée et vérifiée avant l'ouverture, avec un canal de réclamation.

#### Université de Lomé (Togo)

- Préinscription en ligne via `etu.univ-lome.tg`, puis inscription définitive ; démarches du 15 septembre au 14 novembre pour l'année 2025-2026 ([République togolaise, 2025](https://www.republicoftogo.com/toutes-les-rubriques/education/bien-preparer-la-rentree-universitaire)).
- La Direction des ressources et supports informatiques a présenté la plateforme aux nouveaux bacheliers lors d'une séance d'information, avec « les étapes à suivre, les erreurs à éviter et les outils d'assistance disponibles » ([Université de Lomé, 2025](https://univ-lome.tg/luniversite-de-lome-accueille-ses-nouveaux-bacheliers-lors-dune-seance-dinformation-a-lamphi-prof-seddoh/)).
- **Leçon** : l'outil numérique s'accompagne d'une formation présentielle des usagers.

#### Université Cheikh Anta Diop de Dakar (Sénégal)

Le guide de la DISI pour 2020-2021 ([UCAD DISI, 2020](https://pie.ucad.sn/docs/preinscription_guide_utilisateur_2020_2021_v1.pdf)) décrit quatre étapes :

1. préinscription en ligne sur `preinscriptionenligne.ucad.sn` (état civil, adresse, cursus, emploi, contact, enquête TIC) et préinscription pédagogique (horaires de TD, langues) ;
2. paiement auprès d'InTouch, soit en point physique, soit en ligne via TouchPay (par exemple Orange Money avec code de paiement valable 15 minutes), avec confirmation par SMS et email ;
3. visite médicale auprès d'un médecin agréé listé sur la plateforme ;
4. quitus de la bibliothèque (anciens étudiants).

L'étudiant suit dans son espace les étapes validées ; l'inscription définitive reste faite à la scolarité. Ce guide date de 2020 ; la procédure actuelle n'a pas été vérifiée **[à confirmer]**.

### B.3 Synthèse du volet B

Deux familles coexistent : des LMS matures et libres (Moodle, Canvas, Open edX) qui ne couvrent pas la gestion administrative, et des ERP éducatifs (OpenEduCat, Fedena) qui la couvrent mais dont la personnalisation ou la maintenance pose problème. Les universités africaines étudiées combinent un SIS (souvent propriétaire ou développé localement) et un LMS distinct, avec des portails d'inscription qui laissent subsister des étapes physiques. Aucune des solutions examinées ne propose nativement la « valve numérique » ciblée par promotion avec accusé de lecture, ni la vérification publique de documents par QR code, qui sont deux besoins centraux de l'ISPT-Bukavu.

---

## Volet C. Bonnes pratiques et références de conception

### C.1 Tableau de synthèse

| Domaine | Référence | Exigences ou chiffres clés | Conséquence pour la plateforme |
|---|---|---|---|
| Accessibilité | WCAG 2.2 (W3C, 5 octobre 2023) | 9 nouveaux critères ; cible 24 × 24 px (2.5.8, AA) ; focus non masqué (2.4.11, AA) ; authentification accessible (3.3.8, AA) | Viser le niveau AA ; tests axe automatisés + vérification clavier |
| Coût des données (RDC) | ITU, profil RDC (données 2022) | Panier haut débit mobile = 10,3 % du RNB par habitant ; cible Broadband Commission = 2 % | Chaque mégaoctet compte : budget de poids par page |
| Usage d'internet (RDC) | DataReportal / Kepios, Digital 2026 | 34,7 M d'internautes (30,5 %) ; 64,7 M connexions mobiles (56,9 %) ; 79,6 % « broadband » | Public majoritairement mobile, avec une forte part hors ligne |
| Couverture (RDC) | ITU, profil RDC (2022) | 3G : 55 % de la population ; 4G : 45 % | Concevoir pour la 3G |
| Équipement | GSMA, SOMIC 2025 | Terminal d'entrée de gamme = 16 % du revenu mensuel moyen dans les pays à revenu faible et intermédiaire ; 48 % pour les 20 % les plus pauvres | Téléphones modestes : peu de JavaScript, pas d'application native obligatoire |
| Poids des pages | HTTP Archive, Web Almanac 2025 | Page d'accueil mobile médiane : 2 559 Ko (juillet 2025) | Faire nettement moins que la médiane |
| Hors ligne | MDN, Progressive web apps | Installable, fonctionne hors ligne via service worker | PWA avec cache des données consultées |
| Vérification de diplômes | e-Diplôme (RDC), diplome.gouv.fr, W3C VC 2.0 | Vérification en ligne par code/clé ; standard W3C Recommendation du 15 mai 2025 | QR code + page publique de vérification |
| Sécurité | OWASP Top 10:2025 | A01 Broken Access Control en tête | Contrôle d'accès serveur systématique |

### C.2 Accessibilité : WCAG 2.2

WCAG 2.2 est une Recommandation W3C publiée le 5 octobre 2023 ; elle ajoute 9 critères de succès à WCAG 2.1 et retire le critère 4.1.1 Parsing, devenu obsolète ([W3C WAI, 2023](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)). Les nouveaux critères :

| Critère | Niveau | Exigence résumée |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | L'élément qui reçoit le focus clavier n'est pas entièrement masqué |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Aucune partie de l'élément focalisé n'est masquée |
| 2.4.13 Focus Appearance | AAA | Indicateur de focus d'au moins 2 px de périmètre et contraste 3:1 |
| 2.5.7 Dragging Movements | AA | Alternative sans glisser-déposer |
| 2.5.8 Target Size (Minimum) | AA | Cibles d'au moins 24 × 24 px CSS, ou espacement suffisant |
| 3.2.6 Consistent Help | A | Aide située au même endroit d'une page à l'autre |
| 3.3.7 Redundant Entry | A | Ne pas redemander une information déjà saisie dans le même processus |
| 3.3.8 Accessible Authentication (Minimum) | AA | Pas de test cognitif à la connexion sans alternative (gestionnaire de mots de passe, copier-coller autorisés) |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | Version renforcée du précédent |

Application directe : un formulaire d'admission en plusieurs étapes ne redemande pas l'identité (3.3.7) ; le lien d'aide est fixe (3.2.6) ; les boutons sur mobile font au moins 24 px (2.5.8) ; l'écran de connexion n'empêche pas le collage du mot de passe (3.3.8) ; une barre fixe (bandeau cookies, barre de navigation basse) ne masque pas le focus (2.4.11).

### C.3 Performance et faible connectivité

**Accès à internet en RDC.** Selon DataReportal/Kepios ([Kemp, 2025](https://datareportal.com/reports/digital-2026-democratic-republic-of-the-congo)), à fin 2025 :

- 34,7 millions d'internautes, soit 30,5 % de la population ; 69,5 % de la population hors ligne ;
- 64,7 millions de connexions mobiles cellulaires (56,9 % de la population), dont 79,6 % en 3G, 4G ou 5G (ce qui ne garantit pas un usage effectif des données) ;
- âge médian de 15,8 ans ; 51,2 % de la population rurale.

Le profil ITU de la RDC (données collectées jusqu'en décembre 2023) donne pour 2022 : 75 % de la population couverte par un réseau mobile, 55 % par au moins la 3G, 45 % par au moins la 4G ; 27 % d'internautes ; 26 abonnements haut débit mobile actifs pour 100 habitants ; un trafic moyen de 1 559 Mo par mois et par abonnement haut débit mobile ([ITU, 2023](https://www.itu.int/en/ITU-D/Statistics/Documents/DDD/ddd_COD.pdf)).

**Coût des données.** Le même profil ITU indique pour 2022 un panier haut débit mobile équivalent à **10,3 % du RNB par habitant**, et un panier données et voix (faible consommation) à 19,7 % ([ITU, 2023](https://www.itu.int/en/ITU-D/Statistics/Documents/DDD/ddd_COD.pdf)). À titre de comparaison, la médiane mondiale du panier « data-only » est de 1,4 % du RNB par habitant en 2025, la cible de la Broadband Commission étant de 2 % ; les abonnés des économies à faible revenu consacrent environ 22 fois plus de leur revenu au haut débit mobile que ceux des économies à revenu élevé ([ITU, 2025](https://www.itu.int/itu-d/reports/statistics/2025/10/15/ff25-affordability-of-ict-services/)).

L'Alliance for Affordable Internet (A4AI) a d'abord défini l'objectif « 1 for 2 » (1 Go à 2 % au plus du revenu mensuel moyen), puis l'a relevé en 2021 avec le « Journey from 1 to 5 » : 5 Go de haut débit, mobile ou fixe, à 2 % au plus du revenu mensuel moyen d'ici 2026 ([A4AI, 2021](https://adi.a4ai.org/affordable-internet-journey-from-1-to-5/)). Aucun chiffre A4AI propre à la RDC n'a été trouvé dans les jeux de données accessibles **[à confirmer]** ; le chiffre ITU ci-dessus est utilisé à la place.

**Équipement.** Dans les pays à revenu faible et intermédiaire, un terminal d'entrée de gamme capable d'accéder à internet représente 16 % du revenu mensuel moyen, et 48 % pour les 20 % les plus pauvres ; 38 % de la population mondiale vit sous couverture sans utiliser l'internet mobile (« usage gap »), et le mobile représente 84 % des connexions internet mondiales ([GSMA, 2025](https://www.gsma.com/newsroom/press-release/gsma-calls-for-renewed-focus-on-closing-the-usage-gap-as-more-than-3-billion-people-remain-offline-despite-available-mobile-internet-services/)). Le taux d'équipement en smartphones en RDC n'a pas été trouvé dans une source primaire ; pour l'Afrique subsaharienne, la presse cite des taux d'adoption autour de 51 à 54 % en 2023-2024 d'après la GSMA **[à confirmer]**.

**Poids des pages.** Selon le Web Almanac 2025, la page d'accueil mobile médiane pèse 2 559 Ko en juillet 2025 (contre 505 Ko en octobre 2014), et la page intérieure mobile médiane 1 769 Ko ([HTTP Archive, 2025](https://almanac.httparchive.org/en/2025/page-weight)). Calcul indicatif : à ce poids, 1 Go de forfait correspond à environ 400 chargements de page d'accueil sans cache.

**Applications progressives (PWA).** Une PWA peut, comme une application native, « be installed on the device, can operate while offline and in the background », à partir d'une seule base de code web ; le manifeste et le service worker sont les deux briques principales ([MDN, s. d.](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)). Pour l'ISPT-Bukavu, cela permet de garder consultables hors connexion la valve, l'horaire et le relevé déjà chargés, sans passer par un magasin d'applications.

**Exemple institutionnel.** UCT met en avant l'application Brightspace Pulse qui permet de télécharger le contenu des cours pour un accès hors ligne ([UCT ICTS, s. d.-b](https://icts.uct.ac.za/amathuba)).

### C.4 Vérification de diplômes et de documents

- **RDC, e-Diplôme** : lancement officialisé à l'issue du Conseil des ministres du 18 juillet 2025 ; plateforme reposant sur la blockchain, accessible via Schoolap, pour dématérialiser l'émission des **diplômes d'État** (fin du secondaire) et permettre leur vérification en ligne par diplômés, employeurs, universités et ambassades ([Njoya, 2025](https://osiris.sn/la-rdc-lance-une-solution-numerique-d-emission-et-de-verification-des-diplomes.html) ; [Bulonza, 2025](https://cio-mag.com/rdc-e-diplome-une-plateforme-numerique-pour-la-verification-des-diplomes/)). Le même article de *Cio Mag* rappelle l'exclusion d'au moins 40 étudiants pour fraude à Mbuji-Mayi en 2022. Le dispositif ne couvre pas, d'après ces sources, les diplômes de l'enseignement supérieur.
- **RDC, OptSolution** : solution présentée le 22 août 2024 par les ministres de l'Éducation nationale et de l'Enseignement supérieur pour vérifier en temps réel les diplômes d'État ; un finaliste s'inscrivant à l'université pourrait présenter un code à 14 chiffres au lieu de documents physiques ([Digital Business Africa, 2024](https://www.digitalbusiness.africa/rd-congo-la-plateforme-numerique-optsolution-lancee-pour-verifier-instantanement-les-faux-diplomes), source secondaire). Le lien entre OptSolution et e-Diplôme n'est pas établi **[à confirmer]**.
- **France, diplome.gouv.fr** : attestations certifiées de diplômes nationaux téléchargeables, avec sur demande une « clef de vérification unique » transmissible à un employeur ou à un établissement ; inscription gratuite, connexion possible via FranceConnect ([Cned, 2024](https://www.cned.fr/l-actualite-de-la-formation/blog-formations-social/decouvrez-diplomegouvfr)).
- **Standard** : le modèle de données *Verifiable Credentials 2.0* est une Recommandation W3C depuis le 15 mai 2025 ([W3C, 2025](https://www.w3.org/TR/vc-data-model-2.0/)). Il définit les rôles d'émetteur, de détenteur et de vérificateur.

Pour un institut, le mécanisme le plus simple et le plus robuste est un identifiant de document non devinable, encodé dans un QR code imprimé sur le PDF, qui renvoie vers une page publique du site officiel affichant le minimum nécessaire (nom, type de document, date, statut valide ou révoqué). Une blockchain n'est pas nécessaire tant que le site de l'institut fait foi ; le format W3C VC reste une évolution possible.

### C.5 Sécurité : OWASP Top 10:2025

La liste 2025 ([OWASP, 2025](https://owasp.org/Top10/2025/)) :

1. A01 Broken Access Control
2. A02 Security Misconfiguration
3. A03 Software Supply Chain Failures
4. A04 Cryptographic Failures
5. A05 Injection
6. A06 Insecure Design
7. A07 Authentication Failures
8. A08 Software or Data Integrity Failures
9. A09 Security Logging and Alerting Failures
10. A10 Mishandling of Exceptional Conditions

Pour une plateforme où un étudiant ne doit voir que ses propres notes et frais, A01 est le risque principal : chaque requête doit vérifier côté serveur le rôle **et** la propriété de la ressource. A03 concerne directement un projet Node.js (dépendances npm) ; A09 justifie le journal d'activité et l'alerte sur les échecs de connexion ; A10 rejoint l'exigence de mode dégradé (pas d'écran blanc en cas d'erreur).

---

## Fonctionnalités retenues pour la plateforme ISPT-Bukavu et justification

| # | Fonctionnalité | Justification (source) |
|---|---|---|
| 1 | Identifiant unique attribué dès la candidature et conservé jusqu'au diplôme | INE de Campusen et CampusFaso ; numéro d'index réutilisé par KUCCPS |
| 2 | Admission en ligne en étapes courtes, avec sauvegarde et sans ressaisie | WCAG 3.3.7 Redundant Entry ; afflux de dernière minute observé sur Campusen |
| 3 | Suivi du dossier avec statut visible et motif de décision | Transparence jugée faible sur Parcoursup (53 %) |
| 4 | Calendrier de campagne publié à l'avance, avec session de rattrapage | Calendriers CampusFaso et Parcoursup |
| 5 | Notification multicanale (email, et SMS en perspective) | Campusen (email + SMS), KUCCPS (SMS) |
| 6 | Paiement v1 : saisie par la caisse d'un paiement reçu, référence unique, reçu PDF téléchargeable ; module conçu pour accueillir le mobile money (M-Pesa, Airtel Money, Orange Money) | Quittance CampusFaso ; référence de paiement KUCCPS ; paiement mobile UCAD |
| 7 | Valve numérique : communiqués ciblés par institut, section, option et promotion, avec accusé de lecture | Besoin propre à l'ISPT ; absent des LMS et ERP examinés |
| 8 | Espace étudiant : cours, horaire, notes publiées, solde et reçus, demandes de documents | Périmètre PeopleSoft (UCT) et ACMIS (Makerere) |
| 9 | Espace enseignant : supports, devoirs, saisie et validation des notes | Fonctions LMS de base (Moodle, Canvas) sans leur complexité d'exploitation |
| 10 | Documents PDF avec QR code renvoyant à une page publique de vérification | e-Diplôme et OptSolution (RDC), diplome.gouv.fr ; fraude documentaire signalée en RDC |
| 11 | PWA installable avec consultation hors ligne de la valve, de l'horaire et du relevé déjà chargés | Couverture 3G de 55 % et 4G de 45 % en RDC (ITU) ; MDN ; exemple UCT |
| 12 | Budget de poids par page nettement inférieur à la médiane mobile (2 559 Ko) | Panier haut débit mobile à 10,3 % du RNB/hab. en RDC (ITU) ; Web Almanac 2025 |
| 13 | Conformité visée WCAG 2.2 niveau AA, vérifiée par tests automatisés et manuels | W3C |
| 14 | Contrôle d'accès vérifié côté serveur à chaque requête, journal d'activité, gestion des erreurs sans écran blanc | OWASP A01, A09, A10 |
| 15 | Reprise des données existantes planifiée, testée, avec canal de réclamation | Difficultés de migration documentées par Makerere |
| 16 | Accompagnement des usagers (guide, démonstration, aide toujours au même endroit) | Séance de démonstration de l'Université de Lomé ; WCAG 3.2.6 |

**Choix d'architecture découlant du volet B.** Adopter Moodle ou Open edX couvrirait seulement le LMS et laisserait de côté admissions, frais, valve et documents vérifiables ; OpenEduCat couvrirait davantage, mais au prix d'une personnalisation Odoo et sans valve ciblée ; Fedena n'est plus maintenu. Une application web sur mesure, limitée aux besoins de l'institut et construite sur des composants libres courants, est donc retenue. Ses fonctions LMS restent volontairement simples (supports, devoirs), et l'intégration d'un LMS externe reste possible plus tard si le besoin apparaît.

**Ce qui n'est pas retenu en v1.** Blockchain pour les diplômes (le site officiel fait foi) ; application mobile native (la PWA suffit et évite les magasins d'applications) ; paiement mobile intégré en temps réel (dépend d'un contrat avec un agrégateur, à négocier par l'institut).

---

## Bibliographie (APA 7)

Toutes les ressources en ligne ont été consultées le 3 novembre 2026.

### Rapports et documents institutionnels

Alliance for Affordable Internet. (2021). *Setting a vision for affordable access: A4AI's new global price benchmarks (Journey from 1 to 5)*. https://adi.a4ai.org/affordable-internet-journey-from-1-to-5/

Direction générale de l'enseignement supérieur. (s. d.). *Mémo sur le processus de paiement des frais d'inscription par OrangeMoney*. Ministère de l'Enseignement supérieur, de la Recherche scientifique et de l'Innovation, Burkina Faso. https://campusfaso.bf/memoOrangeMoney.pdf

GSMA. (2025, 9 septembre). *GSMA calls for renewed focus on closing the Usage Gap as more than 3 billion people remain offline despite available mobile internet services* [Communiqué de presse]. https://www.gsma.com/newsroom/press-release/gsma-calls-for-renewed-focus-on-closing-the-usage-gap-as-more-than-3-billion-people-remain-offline-despite-available-mobile-internet-services/

HTTP Archive. (2025). Page weight. Dans *Web Almanac 2025*. https://almanac.httparchive.org/en/2025/page-weight

International Telecommunication Union. (2023). *Digital Development Dashboard: Dem. Rep. of the Congo*. https://www.itu.int/en/ITU-D/Statistics/Documents/DDD/ddd_COD.pdf

International Telecommunication Union. (2025). Affordability of ICT services. Dans *Facts and Figures 2025*. https://www.itu.int/itu-d/reports/statistics/2025/10/15/ff25-affordability-of-ict-services/

Ministère de l'Enseignement supérieur, de la Recherche et de l'Innovation. (2019). *Livret Parcoursup, janvier 2019*. https://www.enseignementsup-recherche.gouv.fr/sites/default/files/content_migration/document/Livret_Parcoursup_-_Janvier_2019_1058633.pdf

Ministère de l'Enseignement supérieur, de la Recherche scientifique et de l'Innovation. (2025). *Déclaration liminaire de la conférence de presse sur l'orientation des nouveaux bacheliers, session 2025*. https://www.mesrsi.gov.bf/fileadmin/user_upload/storage/fichiers/Declaration_liminaire__Orientation_2025__.pdf

Ministère de l'Éducation nationale, de l'Enseignement supérieur et de la Recherche [MENESR]. (2025). *Parcoursup : bilan de la procédure d'admission 2025*. https://www.enseignementsup-recherche.gouv.fr/sites/default/files/2025-10/bilan-de-la-proc-dure-d-admission-2025-38034.pdf

Université Cheikh Anta Diop de Dakar, Direction informatique et des systèmes d'information. (2020). *Procédure d'inscription à l'UCAD, année universitaire 2020-2021*. https://pie.ucad.sn/docs/preinscription_guide_utilisateur_2020_2021_v1.pdf

### Normes et référentiels

OWASP Foundation. (2025). *OWASP Top 10:2025*. https://owasp.org/Top10/2025/

W3C. (2025). *Verifiable Credentials Data Model v2.0* (W3C Recommendation, 15 mai 2025). https://www.w3.org/TR/vc-data-model-2.0/

W3C Web Accessibility Initiative. (2023). *What's new in WCAG 2.2*. https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

### Documentation technique et sites officiels

DICTS Makerere University. (s. d.). *How to create your MUELE account*. https://dicts.mak.ac.ug/articles/how-create-your-muele-account

Instructure. (s. d.). *canvas-lms: The open LMS by Instructure, Inc.* [Dépôt de code]. GitHub. https://github.com/instructure/canvas-lms

Makerere University. (s. d.). *MUELE* [Page d'aide]. https://answers.mak.ac.ug/node/82

MDN. (s. d.). *Progressive web apps*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

Moodle. (s. d.). *Statistics*. https://stats.moodle.org/

Moodle. (2026). *License*. Moodle Developer Resources. https://moodledev.io/general/license

Mugabi, S. (s. d.). *ACMIS system can be accessed from any location globally*. DICTS, Makerere University. https://dicts.mak.ac.ug/articles/acmis-system-can-be-accessed-any-location-globally

Open edX. (s. d.). *Open edX Platform* [Documentation]. https://docs.openedx.org/projects/edx-platform/en/latest/references/docs/README.html

OpenEduCat. (s. d.-a). *Open source education ERP, free for schools & universities*. https://openeducat.org/open-source-education-erp/

OpenEduCat. (s. d.-b). *What is Odoo ERP for education?* https://openeducat.org/glossary/what-is-odoo-erp-education/

Project Fedena. (s. d.). *fedena: Fedena SIS* [Dépôt de code]. GitHub. https://github.com/projectfedena/fedena

University of Cape Town ICTS. (s. d.-a). *What is PeopleSoft?* https://icts.uct.ac.za/node/8183

University of Cape Town ICTS. (s. d.-b). *Amathuba*. https://icts.uct.ac.za/amathuba

University of Cape Town News. (2023, 1er février). *Preparing for first-year teaching on Amathuba*. https://news.uct.ac.za/article/-2023-02-01-preparing-for-first-year-teaching-on-amathuba

Université de Lomé. (2025, 17 septembre). *L'Université de Lomé accueille ses nouveaux bacheliers lors d'une séance d'information à l'amphi Prof. Seddoh*. https://univ-lome.tg/luniversite-de-lome-accueille-ses-nouveaux-bacheliers-lors-dune-seance-dinformation-a-lamphi-prof-seddoh/

### Presse et ressources en ligne

Bulonza, E. (2025, 21 juillet). RDC : « e-Diplôme », une plateforme numérique dédiée à la vérification des diplômes. *Cio Mag*. https://cio-mag.com/rdc-e-diplome-une-plateforme-numerique-pour-la-verification-des-diplomes/

Cned. (2024, 5 juin). *Découvrez diplome.gouv.fr*. https://www.cned.fr/l-actualite-de-la-formation/blog-formations-social/decouvrez-diplomegouvfr

Digital Business Africa. (2024). *RD Congo : la plateforme numérique « OptSolution » lancée pour vérifier instantanément les faux diplômes*. https://www.digitalbusiness.africa/rd-congo-la-plateforme-numerique-optsolution-lancee-pour-verifier-instantanement-les-faux-diplomes

Kande, A. (2025, 28 août). Orientation des nouveaux bacheliers : démarrage des opérations ce vendredi. *Le Soleil*. https://lesoleil.sn/actualites/education/orientation-des-nouveaux-bacheliers-demarrage-des-operations-ce-vendredi/

Kemp, S. (2025, 8 novembre). *Digital 2026: The Democratic Republic of the Congo*. DataReportal. https://datareportal.com/reports/digital-2026-democratic-republic-of-the-congo

Nderi, S. (2026, 9 juillet). Over 290,000 students placed as KUCCPS releases 2026 higher education results. *HapaKenya*. https://hapakenya.com/2026/07/09/over-290000-students-placed-as-kuccps-releases-2026-higher-education-results/

Njoya, S. (2025, 21 juillet). La RDC lance une solution numérique d'émission et de vérification des diplômes. *OSIRIS* (reprise de *We Are Tech Africa*). https://osiris.sn/la-rdc-lance-une-solution-numerique-d-emission-et-de-verification-des-diplomes.html

République togolaise. (2025, 24 juillet). *Bien préparer la rentrée universitaire*. https://www.republicoftogo.com/toutes-les-rubriques/education/bien-preparer-la-rentree-universitaire

SenCampus. (s. d.). *Campusen : la plateforme qui décide de votre orientation*. https://www.sencampus.com/dossiers/apres-le-bac-au-senegal/campusen-orientation-bacheliers

Wanjala, E. (2026, 24 avril). Why you should keep your KUCCPS payment reference number. *The Star*. https://the-star.co.ke/news/2026-04-24-why-you-should-keep-your-kuccps-payment-reference-number

---

## Points à confirmer avant intégration au mémoire

1. Montant des droits d'inscription Campusen et nombre de vœux autorisés (communiqué MESRI Sénégal ou `orientation.campusen.sn`).
2. Volumétrie officielle CampusFaso 2025.
3. Gratuité générale de Parcoursup (page officielle `parcoursup.gouv.fr`).
4. Écarts entre sources sur KUCCPS (date d'ouverture, nombre d'éligibles, capacités CUE) : chercher le communiqué officiel KUCCPS ou du ministère kényan.
5. Chiffre A4AI spécifique à la RDC et taux d'équipement en smartphones en RDC (rapport GSMA *Mobile Economy Sub-Saharan Africa*, accès sur inscription).
6. Données ITU de prix plus récentes que 2022 pour la RDC (base ICT Price Baskets).
7. Lien entre e-Diplôme et OptSolution, et existence d'un dispositif équivalent pour les diplômes de l'enseignement supérieur en RDC (ministère de l'ESU).
8. Procédure UCAD actuelle (le guide consulté date de 2020).
