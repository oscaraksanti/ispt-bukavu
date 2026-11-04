# INTRODUCTION GÉNÉRALE

## 0.1. Contexte et état de la question

L'Institut Supérieur Pédagogique et Technique de Bukavu (ISPT-Bukavu) est un établissement public d'enseignement supérieur et universitaire créé par l'arrêté ministériel n° 219/MINESU/CAB.MIN/MML/KOB/2010 du 8 novembre 2010 et opérationnel depuis 2011 [@ispt-depliant]. Installé sur l'avenue de l'Hippodrome, dans la commune d'Ibanda, il a pour mission de former des ingénieurs en techniques appliquées, capables d'intégrer les entreprises comme d'enseigner dans les établissements techniques. Ses études sont organisées selon le système Licence-Master-Doctorat (LMD) : quatre années réparties en huit semestres, conduisant au diplôme de Licence [@ispt-donnees2026].

Comme beaucoup d'établissements congolais, l'institut fonctionne encore largement sur des supports physiques. Les communiqués officiels (horaires, calendriers, résultats, convocations) sont affichés à la valve de l'institut, puis relayés de manière informelle dans des groupes de messagerie. Le dossier de candidature est constitué de pièces papier réunies dans une farde, ou envoyé par courrier électronique ; les registres d'étudiants sont tenus sous forme de tableaux [@ispt-donnees2026], et l'exemple de bulletin transmis par l'institut est calculé dans un classeur de tableur. Ce fonctionnement, que nous avons pu observer en tant qu'étudiant de l'institut, impose des déplacements, laisse circuler des copies dont l'authenticité ne peut pas être vérifiée et rend l'information inaccessible à qui n'est pas sur place.

Ce constat rejoint les orientations nationales. Le *Plan national sous-sectoriel du numérique de l'enseignement supérieur et universitaire* (PNSN-ESU) relève, parmi les dérives à combattre, l'émission de faux documents académiques et la modification des cotes hors des jurys ; il prévoit l'informatisation de la gestion des inscriptions, des cotes, des délibérations et des relevés [@pnsn-esu2021]. L'instruction académique n° 025 du 13 novembre 2023 demande aux établissements de numériser les dossiers de scolarité et fait obligation aux établissements publics d'utiliser la solution ministérielle OptSolution pour leur gestion financière, académique et administrative [@instruction025-2023]. Sur le plan continental, la stratégie de l'Union africaine pour l'éducation numérique encourage l'usage du numérique pour l'enseignement, l'évaluation et l'administration, au moyen de plateformes sûres et respectueuses de la vie privée [@ua2022].

Les conditions d'accès au réseau restent cependant contraignantes. À la fin de 2025, environ 30,5 % de la population congolaise utilisait internet [@kemp2025]. En 2022, un panier de données mobiles représentait 10,3 % du revenu national brut par habitant, loin de la médiane mondiale [@itu2023; @itu2025]. Toute solution destinée aux étudiants de Bukavu doit donc rester légère, utilisable sur un téléphone d'entrée de gamme et tolérante aux coupures. La protection des données personnelles est un autre impératif : l'ordonnance-loi n° 23/010 portant Code du numérique soumet leur traitement à des obligations précises, dont l'hébergement en République démocratique du Congo sauf autorisation de l'autorité compétente [@code-numerique2023]. Le rapport mondial de suivi sur l'éducation de l'UNESCO souligne d'ailleurs que seuls 16 % des pays garantissent explicitement par la loi la confidentialité des données dans l'éducation [@unesco2023resume].

**État de la question.** Les solutions existantes se répartissent en trois familles. Les plateformes d'apprentissage en ligne, comme Moodle ou Open edX, sont conçues pour l'enseignement : elles gèrent les cours et les supports, mais ni les admissions, ni la communication officielle, ni les frais [@moodle-stats; @openedx]. Les progiciels de gestion scolaire, comme OpenEduCat, couvrent un périmètre plus large, au prix d'une adaptation de la plateforme Odoo sur laquelle ils reposent [@openeducat-b]. Les plateformes nationales d'admission, telles que Parcoursup en France ou Campusen au Sénégal, traitent l'orientation à l'échelle d'un pays et non la vie interne d'un établissement [@parcoursup2025; @sencampus]. En République démocratique du Congo, la plateforme OptSolution sert à l'inscription et à la vérification des diplômes dans plusieurs universités [@dba2024]. L'étude comparative de neuf établissements congolais et des plateformes du ministère, que nous présentons au chapitre 2 montre des services en ligne partiels, souvent inaccessibles ou contradictoires, et aucun établissement réunissant dans un même outil le site public, les admissions, une valve numérique et les espaces des étudiants et des enseignants. C'est cet espace que le présent travail entend occuper, en complément des obligations ministérielles et non en concurrence avec elles.

## 0.2. Problématique

La question centrale de ce travail se formule ainsi :

> Comment doter l'ISPT-Bukavu d'un outil numérique unique, fiable et adapté à la faible connectivité de Bukavu, qui diffuse l'information officielle de façon ciblée et vérifiable, dématérialise les principaux processus académiques et administratifs, et reste administrable par le personnel de l'institut sans compétence technique ?

Elle se décline en trois questions spécifiques :

1. Quelle forme technique donner à cet outil pour qu'il reste utilisable sur un téléphone d'entrée de gamme, avec une connexion lente ou intermittente ?
2. Comment organiser, dans une même plateforme, la communication officielle et les processus académiques (admission, inscription, cotes, délibération, frais, documents) tout en garantissant que chaque utilisateur n'accède qu'aux données qui le concernent ?
3. Comment inscrire cette plateforme dans le cadre réglementaire congolais, notamment l'obligation d'utiliser la solution ministérielle et les règles de protection des données personnelles ?

## 0.3. Hypothèses

En réponse provisoire à ces questions, nous formulons trois hypothèses :

1. **Une application web progressive**, rendue côté serveur, légère et consultable hors connexion pour les données déjà chargées, est mieux adaptée au contexte de Bukavu qu'une application mobile native : elle ne demande aucune installation depuis un magasin d'applications et reste utilisable en 3G sur un téléphone d'entrée de gamme.
2. **Une plateforme unique**, organisée autour d'une valve numérique ciblée et de circuits de validation (dossier de candidature, cotes, délibération, documents), peut couvrir les principaux processus de l'institut, à condition que les droits de chaque rôle, calqués sur l'organigramme, soient vérifiés côté serveur à chaque requête.
3. **Une architecture portable**, positionnée en complément de la plateforme ministérielle et dotée d'exports de données, permet de respecter le cadre réglementaire sans dupliquer les obligations nationales et de rapatrier l'hébergement en République démocratique du Congo le moment venu.

Ces hypothèses sont éprouvées au chapitre 4 par des mesures objectives : poids des pages et temps d'affichage en réseau mobile lent simulé, tests automatisés des règles métier et des accès entre rôles, contrôle d'accessibilité et revue de sécurité.

## 0.4. Objectifs du travail

### 0.4.1. Objectif général

L'objectif général de ce travail est de concevoir, réaliser et mettre en production une plateforme web intégrée de gestion académique et de communication institutionnelle pour l'ISPT-Bukavu.

### 0.4.2. Objectifs spécifiques

Pour l'atteindre, nous poursuivons les objectifs spécifiques suivants :

- analyser le fonctionnement actuel de l'institut et les besoins de ses différents publics : candidats, étudiants, enseignants, personnel administratif et direction ;
- situer le projet par rapport aux solutions existantes et au cadre réglementaire congolais ;
- modéliser le système avec le langage UML et concevoir une interface centrée sur l'utilisateur ;
- réaliser les modules de la plateforme : site institutionnel, admissions en ligne, valve numérique, espaces étudiant, enseignant et candidat, gestion des cotes et des délibérations, frais académiques, documents vérifiables par code QR et administration ;
- tester la plateforme (règles métier, contrôle des accès, accessibilité, performance, sécurité), la déployer en ligne et documenter son exploitation.

## 0.5. Choix et intérêt du sujet

Le choix de ce sujet procède d'un constat vécu : en tant qu'étudiant de l'institut, nous avons éprouvé les difficultés liées à une information disponible seulement sur place et à des démarches entièrement physiques. Il nous a paru utile de mettre notre formation en Génie Informatique au service de notre propre établissement.

Ce travail présente un triple intérêt :

- **sur le plan personnel**, il nous permet de mobiliser l'ensemble des connaissances acquises durant notre formation (analyse, modélisation, bases de données, programmation web, réseaux et sécurité) dans un projet complet, mené de l'étude préalable jusqu'à la mise en production ;
- **sur le plan scientifique**, il documente la conception d'un système d'information académique sous de fortes contraintes de connectivité et de coût, et montre comment un cadre réglementaire national (réforme LMD, Code du numérique) se traduit en règles de conception vérifiables ; il pourra servir de base aux chercheurs qui aborderont des sujets voisins ;
- **sur le plan institutionnel et social**, il offre à l'ISPT-Bukavu un outil administrable par son propre personnel, qui réduit les déplacements des étudiants, rend les documents officiels vérifiables en ligne et améliore la visibilité de l'institut auprès des futurs candidats, des parents et des partenaires.

## 0.6. Méthodologie

### 0.6.1. Méthodes

Une méthode désigne la démarche d'ensemble qui conduit la recherche, tandis que les techniques sont les outils concrets de collecte et de traitement des données [@vancampenhoudt2017]. Trois méthodes ont guidé ce travail :

- **la recherche par la conception** (*design science research*), qui produit une connaissance en construisant puis en évaluant un artefact destiné à résoudre un problème réel [@hevner2004]. Nous en suivons le processus en six étapes : identification du problème, définition des objectifs de la solution, conception et développement, démonstration, évaluation, communication [@peffers2007] ;
- **la méthode systémique**, qui considère l'institut comme un ensemble de services en interaction (direction, secrétariats, caisse, sections, enseignants, étudiants) et son système d'information comme le support de leurs échanges [@reix2016] ;
- **le développement itératif et incrémental**, hérité du processus unifié : la plateforme est construite par phases successives, chacune livrant des fonctions utilisables, testées et déployées [@jacobson1999; @larman2005]. La modélisation s'appuie sur le langage UML [@omg-uml251; @roques2018].

### 0.6.2. Techniques

Les techniques suivantes ont servi à la collecte et au traitement des données :

- **l'analyse documentaire** : textes légaux et réglementaires de l'enseignement supérieur congolais, dépliant officiel de l'institut, données et documents transmis par l'institut (organisation des études, filières, pièces du dossier d'admission, exemple d'horaire, exemple de bulletin), rapports nationaux et internationaux ;
- **l'observation directe**, menée en tant qu'étudiant de l'institut, des circuits d'information et des démarches administratives ;
- **les échanges avec la direction et le support technique** de l'institut, qui ont permis de recueillir et de faire valider les règles de gestion (comptes du personnel, autorisations, fréquence des sauvegardes, priorités du tableau de bord) ;
- **l'étude comparative** (*benchmark*) des services en ligne de neuf établissements d'enseignement supérieur congolais et du ministère de tutelle, ainsi que de plusieurs plateformes africaines et internationales ;
- **les tests** : tests unitaires des règles métier, tests de bout en bout des parcours et des accès entre rôles, contrôle automatique d'accessibilité et mesures de performance en réseau mobile lent simulé.

Un questionnaire destiné aux étudiants et aux enseignants a été préparé, mais il n'a pas été administré dans le temps de ce travail. Aucune donnée d'enquête n'est donc présentée ; le questionnaire figure en annexe et pourra servir à évaluer la satisfaction des usagers après la mise en service.

## 0.7. Délimitation du travail

Sur le plan spatial, ce travail porte sur l'ISPT-Bukavu, situé dans la ville de Bukavu, province du Sud-Kivu, en République démocratique du Congo.

Sur le plan temporel, il est rattaché à l'année académique 2025-2026. Les sources, les observations et l'état de la plateforme décrits sont ceux arrêtés en novembre 2026.

Sur le plan thématique, il couvre la conception, la réalisation, les tests et le déploiement d'une première version de la plateforme. Il ne traite pas le paiement en ligne par monnaie mobile, la synchronisation automatique avec la plateforme ministérielle ni le passage d'examens en ligne. Les montants des frais, le programme officiel des cours et les textes juridiques de la plateforme relèvent de l'institut : ils sont paramétrables dans l'administration et ne sont pas fixés par ce travail.

## 0.8. Subdivision du travail

Hormis l'introduction et la conclusion générales, ce travail comprend quatre chapitres :

- le **premier chapitre** présente l'ISPT-Bukavu et analyse son fonctionnement actuel ;
- le **deuxième chapitre** définit les concepts clés, dresse l'état de l'art des plateformes académiques et expose le cadre réglementaire et les choix technologiques ;
- le **troisième chapitre** est consacré à l'analyse et à la conception du système : besoins, modélisation UML, modèle de données, architecture et sécurité ;
- le **quatrième chapitre** décrit la réalisation de la plateforme, ses tests et son déploiement.
