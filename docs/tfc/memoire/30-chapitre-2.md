# CHAPITRE 2. CADRE CONCEPTUEL ET ÉTAT DE L'ART

## Introduction

Le chapitre précédent a montré les limites d'un fonctionnement fondé sur le papier et la présence physique. Avant de concevoir une solution, ce chapitre fixe le sens des concepts employés dans ce travail, examine les solutions qui existent déjà, à l'étranger comme en République démocratique du Congo, et expose le cadre réglementaire et normatif auquel la plateforme doit se conformer. Il se termine par les choix technologiques qui découlent de ces constats.

## 2.1. Définition des concepts clés

**Système d'information.** Un système d'information est un ensemble organisé de ressources (personnes, données, procédures, matériels et logiciels) qui permet d'acquérir, de traiter, de stocker et de communiquer les informations utiles au fonctionnement et au pilotage d'une organisation [@reix2016]. Il ne se réduit pas à l'informatique : un registre papier ou une valve d'affichage en font partie. La partie informatisée en est le support technique, qui automatise certains traitements et rend l'information disponible à ceux qui en ont besoin [@laudon2022].

**Plateforme web intégrée.** Nous appelons plateforme web intégrée une application unique, accessible par un navigateur, qui réunit des services jusque-là séparés (site public, démarches en ligne, espaces personnels, administration) autour d'une même base de données et d'une même gestion des comptes. L'intégration évite la ressaisie, garantit que tous les écrans montrent la même information et permet d'appliquer partout les mêmes règles d'accès.

**Gestion académique.** La gestion académique regroupe les processus qui accompagnent l'étudiant de sa candidature à son diplôme : admission, inscription, organisation des enseignements et des horaires, évaluation, délibération, délivrance des relevés et attestations. Dans le système LMD, elle s'organise autour des unités d'enseignement et des crédits [@decret22-39].

**Communication institutionnelle.** Elle désigne l'information que l'établissement adresse, en son nom, à ses publics internes (étudiants, enseignants, personnel) et externes (candidats, parents, partenaires). Elle se distingue des échanges informels par son caractère officiel : un communiqué engage l'institution, il doit donc être daté, attribué et vérifiable.

**Valve numérique.** Par analogie avec la valve d'affichage, nous appelons valve numérique un espace de publication des communiqués officiels où chaque message est daté, signé par le service émetteur, adressé à un public précis (tout l'institut, une section, une filière ou une promotion), archivé, et accompagné d'un accusé de lecture.

**Système de gestion des étudiants et progiciel éducatif.** Un système de gestion des étudiants (en anglais *student information system*) conserve les données administratives et académiques des étudiants : inscriptions, notes, frais, résultats. Lorsqu'il s'étend à l'ensemble des fonctions de l'établissement, on parle de progiciel de gestion intégré (*ERP*) éducatif [@openeducat-b].

**Plateforme d'apprentissage en ligne.** Une plateforme d'apprentissage en ligne (*learning management system*, LMS) organise les cours, les supports, les devoirs et les échanges pédagogiques ; Moodle en est l'exemple le plus répandu [@moodle-stats].

**Application web progressive.** Une application web progressive (*progressive web app*, PWA) est un site web qui, grâce à un fichier manifeste et à un programme d'arrière-plan appelé *service worker*, peut être installé sur un appareil comme une application et continuer à fonctionner sans connexion pour les contenus déjà chargés [@mdn-pwa]. Le *service worker* agit comme un intermédiaire entre l'application et le réseau : il peut intercepter les requêtes et répondre à partir d'un cache lorsque le réseau est indisponible [@mdn-service-worker].

**Contrôle d'accès basé sur les rôles.** Dans ce modèle (*role-based access control*, RBAC), les permissions ne sont pas attribuées directement aux utilisateurs mais à des rôles, eux-mêmes attribués aux utilisateurs selon leurs fonctions dans l'organisation [@sandhu1996]. Ce modèle simplifie l'administration de la sécurité et a fait l'objet d'une proposition de norme par le NIST [@ferraiolo2001]. Il s'applique naturellement à un établissement dont l'organigramme définit déjà qui peut publier, valider ou encaisser.

**Base de données relationnelle.** Une base de données relationnelle organise les données en relations (tables) liées par des valeurs communes, et permet de les interroger indépendamment de leur organisation physique [@codd1970]. Elle garantit la cohérence des données grâce aux contraintes d'intégrité et aux transactions [@elmasri2016].

**Accessibilité numérique.** L'accessibilité numérique désigne la possibilité, pour toute personne, y compris en situation de handicap, de percevoir, comprendre et utiliser un contenu web. Elle est définie par les règles WCAG du W3C, dont la version 2.2 est la référence actuelle [@w3c-wcag22].

## 2.2. État de l'art

L'état de l'art présenté ici repose sur la consultation, en novembre 2026, des sites officiels et de la documentation des solutions étudiées. Il examine trois familles : les systèmes de gestion académique, les plateformes d'apprentissage en ligne et les pratiques des établissements congolais.

### 2.2.1. Systèmes de gestion académique

**Plateformes nationales d'admission.** Plusieurs pays ont centralisé l'admission dans l'enseignement supérieur. En France, Parcoursup a traité en 2025 les candidatures d'environ 980 000 personnes, pour plus de treize millions de vœux et sous-vœux [@parcoursup2025]. Au Sénégal, la plateforme Campusen oriente les bacheliers vers les universités publiques [@sencampus; @kande2025]. Au Burkina Faso, CampusFaso couvre l'orientation des nouveaux bacheliers et le paiement en ligne des frais d'inscription par monnaie mobile [@mesrsi-bf2025; @campusfaso]. Ces dispositifs partagent un schéma commun : un identifiant unique attribué dès la candidature, un dossier en ligne, des notifications et un paiement lié au dossier. Ils opèrent toutefois à l'échelle d'un pays et ne gèrent pas la vie interne d'un établissement.

**Systèmes des universités africaines.** L'Université du Cap combine un progiciel commercial de gestion des étudiants, PeopleSoft, et une plateforme d'apprentissage distincte appelée Amathuba [@uct-peoplesoft; @uct-amathuba]. L'Université Makerere, en Ouganda, utilise un système de gestion développé localement, ACMIS, accessible à distance, et une plateforme Moodle adaptée, MUELE [@mugabi-acmis; @makerere-muele]. L'Université Cheikh Anta Diop de Dakar propose une préinscription en ligne avec paiement mobile, mais conserve des étapes physiques [@ucad2020]. Ces exemples montrent que les grandes universités juxtaposent souvent plusieurs outils, au prix d'un coût et d'une complexité hors de portée d'un institut de taille moyenne.

**Progiciels éducatifs libres.** OpenEduCat, construit sur Odoo, couvre l'admission, les présences, les examens, les emplois du temps et les frais dans son édition communautaire [@openeducat-a; @openeducat-b]. Son adaptation exige cependant de maîtriser le cadre de développement Odoo, et certaines fonctions sont réservées à l'offre commerciale. Fedena, autre logiciel libre de gestion scolaire, n'est plus maintenu dans son dépôt public [@fedena].

### 2.2.2. Plateformes d'apprentissage en ligne

Moodle est la plateforme d'apprentissage libre la plus diffusée : son site de statistiques recense plus de 145 000 sites enregistrés dans 235 pays [@moodle-stats]. Il est distribué sous licence GPL version 3 [@moodle-licence]. Canvas et Open edX sont également libres, le second étant orienté vers les cours en ligne à grande échelle [@canvas-lms; @openedx].

Ces plateformes couvrent bien la dimension pédagogique (cours, supports, devoirs, forums), mais pas l'administration académique : elles ne gèrent ni les admissions, ni les frais, ni la délibération, ni la communication officielle ciblée. Le tableau 2.1 résume la comparaison de ces familles de solutions.

::tableau Tableau 2.1 : Comparaison des familles de solutions existantes
| Solution | Nature | Licence | Couverture | Limite pour l'ISPT-Bukavu |
|---|---|---|---|---|
| Moodle, Canvas, Open edX | Plateformes d'apprentissage | Libres (GPL, AGPL) | Cours, supports, devoirs, forums | Ni admissions, ni frais, ni délibérations, ni valve ciblée |
| OpenEduCat | Progiciel éducatif sur Odoo | Libre (édition communautaire) | Admission, présences, examens, horaires, frais | Adaptation exigeant la maîtrise d'Odoo ; pas de valve ciblée |
| Fedena | Gestion scolaire | Libre | Dossiers, examens, présences, frais | Dépôt public non maintenu |
| PeopleSoft avec Amathuba (Université du Cap) | Progiciel commercial et plateforme d'apprentissage | Propriétaires | Inscriptions, frais, résultats, cours | Coût des licences et dépendance à l'éditeur |
| ACMIS avec MUELE (Makerere) | Système local et Moodle adapté | Non précisée | Inscriptions, frais, résultats, cours | Développé pour une grande université ; non disponible pour d'autres établissements |

::source Production personnelle, d'après la documentation des solutions citées.

### 2.2.3. Pratiques des établissements de la RDC

Pour situer l'ISPT-Bukavu dans son environnement, nous avons examiné le 3 novembre 2026 les services en ligne de neuf établissements congolais et du ministère de tutelle. Chaque site a été consulté depuis ses pages publiques ; aucun espace protégé par mot de passe n'a été ouvert. Le tableau 2.2 en présente la synthèse.

::tableau Tableau 2.2 : Services en ligne d'établissements congolais observés le 3 novembre 2026
| Établissement | Inscription en ligne | Portail étudiant | Cours en ligne | Observation principale |
|---|---|---|---|---|
| Université de Kinshasa | Partielle (OptSolution) | Oui (OptSolution) | Non trouvé | Formulaire annoncé ouvert sur le site, fermé sur le portail |
| Université Catholique de Bukavu | Non trouvée | Oui (évaluations, frais) | Inaccessible | Sous-domaine d'enseignement en ligne en erreur |
| Université Officielle de Bukavu | Inaccessible | Inaccessible | Non trouvé | Préinscription annoncée, portail refusant l'accès |
| Institut Supérieur Pédagogique de Bukavu | Inaccessible | Partiel | Oui (Moodle) | Erreur technique exposée ; témoignages non modérés |
| Institut Supérieur des Techniques Appliquées (Kinshasa) | Non trouvée | Non trouvé | Non trouvé | Site inaccessible |
| Institut Supérieur Pédagogique Technique de Kinshasa | Partielle | Non trouvé | Non trouvé | Dossier envoyé par courrier électronique ; contenus de gabarit |
| Université de Lubumbashi | Partielle (OptSolution) | Oui (OptSolution) | Oui (Moodle) | Trois adresses d'inscription aux messages contradictoires |
| Université Libre des Pays des Grands Lacs | Partielle | Partiel (suivi des travaux de fin d'études) | Non trouvé | Page vide sans JavaScript |
| Université Protestante au Congo | Non (dossier physique) | Partiel (espace enseignant) | Non trouvé | Site soigné, démarches au guichet |

::source Production personnelle, d'après les sites officiels des établissements.

Plusieurs enseignements se dégagent de cette observation.

- **Le circuit d'inscription reste hybride.** Même les établissements les plus avancés imposent un paiement en banque et le dépôt d'un dossier physique. À l'Université de Kinshasa, le candidat imprime un formulaire portant un code QR, paie à la banque et téléverse ses pièces au format PDF [@unikin; @unikin-optsolution]. À l'ISPT de Kinshasa, le dossier numérisé est envoyé par courrier électronique sous forme d'archive [@isptkin].
- **La solution ministérielle est en place.** Les universités de Kinshasa et de Lubumbashi utilisent OptSolution pour l'inscription et l'espace étudiant [@unikin-optsolution; @unilu], conformément à l'obligation faite aux établissements publics [@instruction025-2023]. L'éditeur présente cette solution comme la numérisation de l'ensemble des services académiques [@optsolution].
- **La fiabilité fait souvent défaut.** Portails inaccessibles, messages contradictoires d'une page à l'autre, erreurs techniques affichées au public et formulaires non modérés envahis de liens indésirables ont été observés dans plusieurs établissements, y compris à Bukavu [@uob2026; @ispbukavu-etudiant].
- **Un site rendu uniquement côté navigateur est fragile.** Le site de l'Université Libre des Pays des Grands Lacs n'affiche qu'une page vide lorsque le script ne se charge pas [@ulpgl2026] : avec une connexion instable, un rendu côté serveur est préférable.
- **Les portails étudiants sont spécialisés.** L'Université Catholique de Bukavu propose un portail pour les évaluations et les frais [@ucb-akhademie], l'Université Protestante au Congo un espace enseignant, mais l'inscription s'y fait encore au guichet [@upc2026].
- **Le ministère numérise ses propres services.** Il déploie notamment une carte nationale des étudiants à code QR [@minesursi-carte], et une plateforme de vérification des diplômes d'État a été lancée en 2025 [@dba2025].

### 2.2.4. Synthèse et positionnement

Aucune des solutions examinées ne réunit, dans un même outil adapté à un institut de taille moyenne, le site public, l'admission en ligne, une valve numérique ciblée avec accusé de lecture, les espaces des étudiants et des enseignants, la délibération et la vérification publique des documents. Les plateformes d'apprentissage ne couvrent pas l'administration ; les progiciels éducatifs la couvrent au prix d'une adaptation lourde ; les solutions des grandes universités ne sont pas transférables ; la solution ministérielle, enfin, répond aux besoins de l'État en matière d'inscription et de contrôle, sans prendre en charge la communication interne ni la vie pédagogique de l'établissement.

Nous retenons donc une application web conçue pour l'institut, construite sur des composants libres et courants. Elle reprend les bonnes pratiques observées (identifiant unique, dossier en ligne avec suivi, notifications, documents à code QR) et évite les défauts constatés (adresses multiples, messages contradictoires, pages vides sans script, formulaires non modérés). Ses fonctions pédagogiques restent volontairement simples (supports de cours, devoirs, présences) ; l'intégration d'une plateforme comme Moodle reste possible si le besoin apparaît. Enfin, elle se positionne en complément de la solution ministérielle et doit pouvoir lui transmettre ses données.

## 2.3. Cadre réglementaire et normatif

### 2.3.1. Enseignement supérieur et système LMD en RDC

**La loi-cadre de l'enseignement national.** La loi-cadre n° 14/004 du 11 février 2014 organise l'ensemble du système éducatif. Elle confie au ministre de l'Enseignement supérieur la fixation des frais académiques des établissements publics et prévoit l'entérinement et l'homologation des titres par l'État [@loi14-004].

**Le décret LMD.** Le décret n° 22/39 du 8 décembre 2022 organise le système Licence-Maîtrise-Doctorat. Les enseignements y sont déclinés en domaines, filières, mentions, parcours, semestres, unités d'enseignement et éléments constitutifs. À chaque unité d'enseignement est affectée une valeur en crédits ; un crédit représente vingt-cinq heures de travail de l'étudiant, et un semestre vaut trente crédits. Le décret fixe aussi parmi ses objectifs l'intégration des technologies de l'information dans l'enseignement [@decret22-39].

**L'instruction académique annuelle.** Chaque année, une instruction du ministre précise les règles de l'année académique. L'instruction n° 025 du 13 novembre 2023, que nous avons pu consulter, contient plusieurs dispositions qui concernent directement la plateforme [@instruction025-2023] :

- l'inscription peut se faire en présentiel ou en ligne, et la qualité d'étudiant s'acquiert par le paiement des frais d'études ;
- les établissements doivent numériser le dossier de scolarité de chaque étudiant, le système manuel coexistant avec le système numérique ;
- les établissements publics ont l'obligation d'utiliser la solution OptSolution pour leur gestion financière, académique et administrative, et un étudiant absent de la base de données du ministère ne peut obtenir l'homologation de son diplôme ;
- les frais sont fixés en dollars et payés en francs congolais, et il est interdit de percevoir des frais non prévus par l'instruction ;
- les résultats des finalistes doivent être transmis par voie électronique dans les soixante-douze heures qui suivent la proclamation, et la proclamation de fin d'année se fait par affichage aux valves.

Les règles d'évaluation et de progression sont fixées par un arrêté ministériel du 28 août 2023 auquel l'instruction renvoie ; son texte n'a pas pu être consulté. Pour cette raison, la plateforme ne fige aucune règle de notation : le seuil de validation, l'arrondi, les mentions et les règles de décision sont des paramètres que l'institut peut ajuster.

**Le plan sous-sectoriel du numérique.** Le PNSN-ESU prévoit, dans son axe consacré à la gestion académique, des modules d'admission, d'inscription, de gestion des cotes avec saisie sécurisée, de délibération et de production sécurisée des relevés ; il prévoit aussi la protection des diplômes par signature électronique et code QR [@pnsn-esu2021]. Ces orientations rejoignent directement les fonctions de la plateforme.

### 2.3.2. Numérique et protection des données personnelles

L'ordonnance-loi n° 23/010 du 13 mars 2023 portant Code du numérique consacre un titre entier aux données personnelles [@code-numerique2023]. Plusieurs de ses dispositions s'appliquent à une plateforme académique :

- les données de facturation et de paiement font partie des données personnelles (article 183), si bien que le module des frais est concerné au même titre que le dossier académique ;
- le traitement doit être déclaré à l'autorité de protection des données (article 186) ; certains traitements, dont le transfert de données vers un pays tiers, exigent une autorisation préalable (article 187) ;
- le traitement est licite lorsqu'il est nécessaire à l'exécution d'une obligation légale (article 192), ce qui couvre la gestion de la scolarité ; le consentement, réservé aux traitements facultatifs, doit pouvoir être démontré et retiré aussi facilement qu'il a été donné (article 196) ;
- les données personnelles doivent être stockées ou hébergées en République démocratique du Congo, sauf autorisation de l'autorité compétente (article 201) ;
- les personnes disposent de droits d'accès, de rectification et d'effacement (articles 209 à 215) ;
- le responsable du traitement doit assurer la sécurité des données, y compris leur sauvegarde et leur restauration (article 221), et notifier sans délai toute violation (article 244).

Dans l'attente de l'installation effective de l'autorité de protection des données, ses missions ont été confiées à titre transitoire à l'autorité de régulation des postes, des télécommunications et des technologies de l'information et de la communication, un choix dont la légalité est discutée [@kandolo2024]. Une proposition de loi modifiant le Code du numérique était en outre examinée au Sénat en novembre 2026 [@lutete2026] ; les numéros d'articles cités ici pourraient donc évoluer.

L'exigence d'hébergement en RDC pèse sur le choix de l'infrastructure. Faute d'offre d'hébergement professionnelle adaptée en RDC au moment de ce travail, l'institut a accepté un hébergement de la base de données dans l'Union européenne. Nous en tirons une exigence de conception : l'architecture doit rester portable, c'est-à-dire reposer sur des standards (base PostgreSQL, stockage compatible avec le protocole S3) qui permettent de migrer vers un hébergeur établi en RDC sans réécrire l'application.

Sur le plan international, la stratégie de l'Union africaine pour l'éducation numérique appelle à des plateformes sûres et respectueuses de la vie privée [@ua2022], et l'UNESCO souligne que la protection des données dans l'éducation reste rarement garantie par la loi [@unesco2023resume].

### 2.3.3. Normes d'accessibilité et de sécurité du web

**Accessibilité.** Les règles pour l'accessibilité des contenus web (WCAG) 2.2 sont une recommandation du W3C [@w3c-wcag22]. Par rapport à la version précédente, elles ajoutent notamment des exigences sur la taille minimale des cibles tactiles, la visibilité du focus clavier, l'aide placée au même endroit sur chaque page, l'interdiction de redemander une information déjà saisie et une authentification qui n'impose pas d'effort de mémoire, ce qui suppose par exemple d'autoriser le collage du mot de passe [@w3c-wcag22-nouveautes]. Nous visons le niveau AA, qui est le niveau de référence le plus courant.

**Sécurité.** Le classement OWASP Top 10 recense les risques les plus critiques des applications web. Dans son édition 2025, le contrôle d'accès défaillant occupe la première place, suivi de la mauvaise configuration et des défaillances de la chaîne d'approvisionnement logicielle [@owasp2025]. Pour une plateforme où un étudiant ne doit jamais voir les notes ou les frais d'un autre, le premier risque est central : chaque requête doit vérifier, côté serveur, à la fois le rôle de l'utilisateur et son droit sur la ressource demandée.

**Stockage des mots de passe.** Les mots de passe ne doivent jamais être conservés en clair ni simplement chiffrés, mais transformés par une fonction de hachage lente et résistante aux attaques par matériel spécialisé. Argon2, décrit par la RFC 9106, en est la référence actuelle ; sa variante Argon2id est celle dont la prise en charge est obligatoire [@rfc9106].

**Vérification des documents.** Le W3C a publié en 2025 un modèle de données pour les attestations vérifiables, qui distingue l'émetteur, le détenteur et le vérificateur d'une attestation [@w3c-vc2025]. Sans aller jusqu'à ce modèle, un mécanisme plus simple suffit pour un institut : un identifiant de document impossible à deviner, imprimé sous forme de code QR, qui renvoie vers une page de vérification hébergée sur le site officiel.

**Calendriers.** Pour permettre aux étudiants d'ajouter leurs examens à l'agenda de leur téléphone, la plateforme peut produire des fichiers au format iCalendar, normalisé par la RFC 5545 [@rfc5545].

## 2.4. Choix technologiques

### 2.4.1. Critères de choix

Les constats précédents conduisent à six critères de choix :

1. **la sobriété** : des pages légères, rendues côté serveur, utilisables sur une connexion mobile lente et un téléphone d'entrée de gamme ;
2. **la fiabilité** : un mode dégradé sans écran blanc, des tests automatisés et un déploiement contrôlé ;
3. **la sécurité** : un contrôle d'accès vérifié côté serveur, des mots de passe hachés selon l'état de l'art et des en-têtes de sécurité ;
4. **la portabilité** : des standards ouverts permettant de changer d'hébergeur, en particulier pour rapatrier les données en RDC ;
5. **la maintenabilité** : un seul langage de programmation pour l'interface et le serveur, typé et documenté, afin qu'une petite équipe puisse reprendre le projet ;
6. **le coût** : des composants libres et des services d'hébergement disposant d'offres gratuites suffisantes pour le trafic d'un institut.

### 2.4.2. Architecture retenue

Nous retenons une architecture web à trois niveaux. Le navigateur de l'utilisateur affiche des pages produites par un serveur d'application, qui applique les règles métier et les contrôles d'accès, puis lit et écrit dans une base de données relationnelle. Les fichiers (pièces de candidature, supports de cours, photographies) sont conservés dans un service de stockage d'objets, et les courriers électroniques sont envoyés par un service spécialisé.

Les pages publiques sont préparées à l'avance et mises en cache, ce qui les rend rapides même sur une connexion lente ; les pages personnelles sont produites à chaque demande, après vérification de l'identité. Un *service worker* conserve les pages personnelles déjà consultées pour permettre leur lecture hors connexion. L'ensemble forme une seule application : le site public et les espaces personnels partagent le même code, la même base de données et les mêmes règles. Le chapitre 3 détaille cette architecture.

### 2.4.3. Outils et technologies

Le tableau 2.3 présente les technologies retenues et la raison de chaque choix.

::tableau Tableau 2.3 : Technologies retenues
| Couche | Technologie | Raison du choix |
|---|---|---|
| Cadre d'application | Next.js 16 et React 19 | Rendu côté serveur, pages publiques préparées à l'avance, un seul projet pour le site et les espaces |
| Langage | TypeScript en mode strict | Un seul langage pour l'interface et le serveur ; erreurs détectées avant l'exécution |
| Mise en forme | Tailwind CSS 4 | Feuilles de style réduites au strict nécessaire |
| Base de données | PostgreSQL 17 | Base relationnelle libre et standard, hébergeable partout |
| Accès aux données | Prisma 7 | Schéma typé et migrations versionnées |
| Validation | Zod | Mêmes règles de validation pour les formulaires et le serveur |
| Mots de passe | Argon2id | Fonction de hachage recommandée par la RFC 9106 |
| Stockage des fichiers | Supabase Storage | Stockage d'objets privé, compatible avec un remplacement par un autre fournisseur |
| Courrier électronique | Resend | Envoi des notifications et des liens de confirmation |
| Codes QR | qrcode | Génération des codes de vérification des documents |
| Tests | Vitest, Playwright et axe-core | Tests des règles métier, des parcours, des accès et de l'accessibilité |
| Hébergement | Vercel, base Supabase | Déploiement continu à chaque version, offres gratuites suffisantes |

::source Production personnelle.

Next.js est un cadre d'application fondé sur React qui permet de produire les pages côté serveur et de les mettre en cache [@nextjs-docs; @react-docs]. TypeScript ajoute à JavaScript un système de types vérifié avant l'exécution [@typescript-handbook]. PostgreSQL est un système de gestion de bases de données relationnelles libre, développé par une communauté internationale [@postgresql17], auquel l'application accède par l'intermédiaire de Prisma, qui génère un accès typé aux données et gère les migrations du schéma [@prisma-docs]. La base est hébergée par Supabase ; son interface de programmation publique, inutile ici, est fermée par l'activation de la sécurité au niveau des lignes sur toutes les tables [@supabase-rls]. L'application est déployée sur Vercel, qui reconstruit et publie automatiquement chaque nouvelle version [@vercel-docs].

Pour les tests, Vitest exécute les tests unitaires des règles métier [@vitest-docs] ; Playwright pilote un vrai navigateur pour tester les parcours complets et les accès entre rôles [@playwright-docs] ; axe-core vérifie automatiquement les règles d'accessibilité [@axe-core].

Ce choix écarte deux options. Une application mobile native aurait imposé deux développements (Android et iOS), une distribution par les magasins d'applications et des mises à jour à télécharger ; l'application web progressive offre l'installation et la consultation hors ligne avec un seul code. Une application rendue uniquement dans le navigateur aurait affiché une page vide en cas d'échec du chargement des scripts, défaut observé dans l'état de l'art ; le rendu côté serveur garantit qu'un contenu s'affiche toujours.

## Conclusion partielle

Ce chapitre a défini les concepts mobilisés par ce travail, de la notion de système d'information à celle d'application web progressive et de contrôle d'accès basé sur les rôles. L'état de l'art a montré qu'aucune solution existante ne répond, dans un même outil et à un coût soutenable, à l'ensemble des besoins de l'ISPT-Bukavu, et que les services en ligne des établissements congolais restent partiels et souvent peu fiables. Le cadre réglementaire impose de compléter la solution ministérielle plutôt que de s'y substituer, de protéger les données personnelles et de prévoir leur hébergement en RDC ; les normes WCAG 2.2 et OWASP fixent les exigences d'accessibilité et de sécurité.

Ces constats justifient une application web sur mesure, sobre, sécurisée et portable, construite sur des technologies libres et standard. Le chapitre suivant en présente l'analyse et la conception détaillées.
