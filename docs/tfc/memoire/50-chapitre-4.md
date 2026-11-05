# CHAPITRE 4. RÉALISATION, TESTS ET DÉPLOIEMENT

## Introduction

Ce dernier chapitre présente la plateforme telle qu'elle a été réalisée. Il décrit d'abord l'environnement de développement, puis les principaux écrans, organisés selon les espaces des utilisateurs. Il expose ensuite les tests qui vérifient la conformité de la plateforme aux exigences du chapitre 3, puis sa mise en production et son exploitation. Il se termine par la confrontation des résultats aux hypothèses de départ et par les limites du travail.

Les captures d'écran de ce chapitre ont été réalisées sur une instance de démonstration ou sur la base de test, qui ne contiennent que des données fictives : les noms d'étudiants, les notes, les paiements et les communiqués qui y figurent ont été générés pour l'illustration et ne concernent aucune personne réelle.

## 4.1. Environnement de développement

Le code de la plateforme est conservé dans un dépôt Git hébergé sur GitHub. Chaque modification fait l'objet d'un enregistrement (*commit*) décrit selon une convention commune, ce qui permet de retracer l'historique de chaque fonction. L'application est développée avec Node.js 22 et une base PostgreSQL locale ; les données de développement et de test sont séparées de celles de la production.

La qualité du code est contrôlée par des outils automatiques : un formateur impose une présentation uniforme, un analyseur statique signale les erreurs courantes, et le compilateur TypeScript, en mode strict, vérifie la cohérence des types [@typescript-handbook]. À chaque envoi de code sur GitHub, un processus d'intégration continue enchaîne ces contrôles, les tests unitaires, la préparation d'une base de données éphémère, la compilation de l'application et les tests de bout en bout dans un navigateur. Une modification qui fait échouer l'une de ces étapes est immédiatement signalée.

Le schéma de la base de données a évolué en quatorze migrations successives, appliquées automatiquement lors de chaque déploiement. Une instance de démonstration, alimentée par un script qui ne s'exécute jamais sur la base de production, permet de présenter la plateforme et de former les utilisateurs sans exposer de données réelles.

## 4.2. Présentation de la plateforme

### 4.2.1. Site institutionnel

La page d'accueil (figure 4.1) présente l'institut à partir de ses photographies et des informations de son dépliant : filières, organisation des études, stages, autorités et contacts. Tous les textes et toutes les images sont modifiables depuis l'administration.

![Figure 4.1 : Page d'accueil du site institutionnel](figures/ch4-accueil.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, capture sur ordinateur.

Chaque filière dispose d'une fiche détaillée (figure 4.2) reprenant sa présentation, ses métiers et ses débouchés, tels que transmis par l'institut.

![Figure 4.2 : Fiche d'une filière](figures/ch4-filiere.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, capture sur ordinateur.

Le site comprend également les actualités et l'agenda, une galerie de photographies, la valve publique, un annuaire volontaire des anciens étudiants, les offres de stage et d'emploi, un centre d'aide et une page de vérification des documents.

### 4.2.2. Admissions en ligne

Le candidat crée un compte, confirme son adresse électronique, puis remplit son dossier en plusieurs étapes (figure 4.3). L'écran indique en permanence ce qui manque encore ; les pièces sont téléversées depuis un téléphone ou un ordinateur, et le dossier ne peut être déposé que lorsqu'il est complet. Le candidat suit ensuite son évolution et reçoit un courrier électronique à chaque décision.

![Figure 4.3 : Dossier de candidature dans l'espace candidat](figures/ch4-candidat.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives.

Côté administration, la caisse vérifie les frais de dossier déclarés et émet un reçu numéroté ; le secrétariat examine chaque pièce, demande un complément motivé si nécessaire, décide, puis inscrit l'admis en lui attribuant un matricule. Un tableau de suivi de la campagne affiche le nombre de dossiers déposés, le délai de traitement et la répartition par filière.

### 4.2.3. Espace étudiant

L'espace étudiant a été conçu d'abord pour le téléphone. La figure 4.4 en montre trois écrans : l'accueil, qui résume les communiqués non lus et les cours de l'année ; les notes, présentées par semestre avec la moyenne et les crédits acquis ; et la valve, où chaque communiqué indique sa cible et son état de lecture.

![Figure 4.4 : Espace étudiant sur téléphone : accueil, notes et valve](figures/ch4-etudiant-mobile.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives, captures sur un écran de 390 pixels de large.

L'horaire de la semaine (figure 4.5) reprend la structure de l'horaire papier de l'institut (deux plages par jour, du lundi au samedi), mais ne montre à chaque étudiant que les cours de sa promotion, avec la salle et l'enseignant. Une séance déplacée ou annulée y est signalée.

![Figure 4.5 : Horaire hebdomadaire de l'étudiant](figures/ch4-horaire.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives.

La page des frais (figure 4.6) présente le barème applicable, les paiements enregistrés par la caisse, les éventuelles exonérations et le solde ; chaque paiement donne accès à un reçu imprimable.

![Figure 4.6 : Situation financière de l'étudiant](figures/ch4-frais.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives.

L'étudiant consulte aussi ses supports de cours, remet ses devoirs, suit le calendrier de ses examens, qu'il peut ajouter à l'agenda de son téléphone, consulte ses résultats après délibération et demande ses documents officiels.

### 4.2.4. Espace enseignant

L'enseignant accède aux seuls cours qui lui sont confiés (figure 4.7). Pour chacun, il dépose des supports, publie et corrige des devoirs, fait l'appel des séances de l'horaire, crée des évaluations et saisit les notes, puis les transmet au secrétariat académique.

![Figure 4.7 : Espace enseignant](figures/ch4-enseignant.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives.

### 4.2.5. Administration

Le tableau de bord de pilotage (figure 4.8) répond aux priorités exprimées par la direction. Calculé en temps réel, il présente les effectifs par filière et par niveau, la part des notes publiées au-dessus du seuil de réussite, la part des étudiants en règle financièrement, l'état des admissions, les encaissements et l'activité de la plateforme (communiqués, lectures, documents délivrés).

![Figure 4.8 : Tableau de bord de pilotage de la direction](figures/ch4-pilotage.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives.

Le secrétariat académique valide et publie les notes transmises par les enseignants (figure 4.9). Il conduit ensuite la délibération de chaque promotion (figure 4.10) : la plateforme calcule les moyennes, les crédits, les mentions et les décisions selon le règlement de l'année, signale les anomalies, enregistre la composition du jury et ses éventuelles décisions motivées, puis produit le procès-verbal.

![Figure 4.9 : Validation et publication des notes](figures/ch4-validation-notes.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives.

![Figure 4.10 : Délibération d'une promotion](figures/ch4-deliberation.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives de test.

La planification des examens (figure 4.11) détecte automatiquement les conflits : une même promotion, une même salle ou un même surveillant occupés sur des créneaux qui se chevauchent. La publication du calendrier reste bloquée tant qu'un conflit subsiste ; une fois publié, chaque modification est notifiée aux étudiants et aux enseignants concernés.

![Figure 4.11 : Planification des examens et détection des conflits](figures/ch4-examens.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives de test.

L'administration couvre enfin la gestion du site (pages, filières, autorités, partenaires, médiathèque, galerie), la valve, les admissions, la structure académique et l'horaire, les finances, les stages et les offres, les exports de données, les comptes, les rôles et le journal d'activité. Une page de mise en service liste les informations que l'institut doit encore fournir, comme les montants des frais ou le programme officiel des cours.

### 4.2.6. Documents officiels vérifiables

Les documents officiels (attestations, relevés de notes, bulletins) sont produits sous forme de pages imprimables au format A4, enregistrables en PDF depuis le navigateur. Chacun porte un code QR qui renvoie vers la page publique de vérification du site (figure 4.12). Un employeur ou un autre établissement peut ainsi vérifier en quelques secondes qu'un document a bien été délivré par l'institut et qu'il n'a pas été révoqué.

![Figure 4.12 : Bulletin vérifiable (à gauche) et page publique de vérification d'un document (à droite)](figures/ch4-bulletin-verification.jpg){largeur=15.5}

::source Plateforme ISPT-Bukavu, données fictives.

### 4.2.7. Communication et vie de la communauté

La valve reste le canal des annonces officielles. La plateforme y ajoute trois outils d'échange, qui répondent à l'usage informel des groupes de messagerie relevé au chapitre 1.

La **messagerie** crée automatiquement un groupe par promotion et un groupe par cours, dont les membres sont recalculés à partir des inscriptions et des affectations ; un étudiant qui abandonne ou un enseignant retiré d'un cours n'y a plus accès. Les conversations privées suivent des règles explicites : un étudiant écrit aux membres de sa promotion, à ses enseignants et aux services de l'institut, mais pas à n'importe quel autre étudiant. Chacun peut joindre une photo, réduite avant l'envoi, ou un document PDF, mettre une conversation en sourdine, bloquer une personne ou signaler un message. L'enseignant peut réserver l'écriture de son groupe de cours aux annonces.

Le **Campus** est un fil de publications ouvert à la communauté de l'institut. Chaque publication, avec ou sans photos, est destinée à tout l'institut, à une filière ou à une promotion ; on peut y réagir, la commenter, y répondre, la partager, l'enregistrer et y mentionner une personne. Avant sa première publication, chaque utilisateur accepte des règles de conduite, proposées ici et à faire valider par l'institut. Un contenu signalé par trois personnes est masqué en attendant l'examen de la modération, et l'institut peut exiger la validation préalable des publications des étudiants. Les modérateurs ne voient que les contenus signalés, jamais le reste des conversations.

Enfin, chaque utilisateur peut recevoir les **notifications sur son téléphone**, même lorsque le site est fermé : nouvelles notes, résultats, communiqués, messages et mentions. Ce réglage se fait appareil par appareil ; il est coupé à la déconnexion, ce qui protège les appareils partagés. Sur téléphone, une barre de navigation en bas de l'écran donne accès aux rubriques principales d'un seul geste. La page « Mon compte » permet de changer son mot de passe et de déconnecter les autres appareils, et la page « Mes données » remet à chaque utilisateur, sur demande, l'ensemble des données qui le concernent, conformément au droit d'accès prévu par le Code du numérique [@code-numerique2023].

## 4.3. Tests et validation

### 4.3.1. Stratégie de test

Un logiciel n'est jamais prouvé correct par des tests ; les tests ont pour but d'y trouver des erreurs [@myers2011]. Nous avons donc cherché à couvrir en priorité les erreurs les plus coûteuses pour l'institut : un calcul de moyenne ou de solde erroné, un étudiant qui accéderait aux données d'un autre, une page inutilisable au clavier ou sur une connexion lente. La stratégie repose sur quatre niveaux, présentés au tableau 4.1.

::tableau Tableau 4.1 : Stratégie de test
| Niveau | Outil | Objet | Volume |
|---|---|---|---|
| Tests unitaires | Vitest | Règles métier : moyennes, délibérations, soldes, transitions d'état, conflits d'examens, droits de la messagerie et du Campus, sécurité des mots de passe et des redirections | 198 tests, 23 fichiers |
| Tests de bout en bout | Playwright | Parcours complets dans un vrai navigateur et tentatives d'accès interdites entre rôles | 115 tests, 13 fichiers |
| Accessibilité | axe-core | Règles WCAG 2.2 niveau AA, sur ordinateur et sur téléphone | Inclus dans les tests de bout en bout |
| Performance | Lighthouse et mesures du navigateur | Poids des pages et temps d'affichage en réseau mobile lent simulé | 7 pages publiques |

::source Production personnelle.

Tous ces tests, à l'exception des mesures de performance, s'exécutent automatiquement à chaque modification du code.

### 4.3.2. Tests unitaires

Les règles métier ont été isolées dans des fonctions sans accès à la base de données, ce qui permet de les tester rapidement et de manière reproductible [@vitest-docs]. Les 198 tests unitaires réussissent. Ils vérifient notamment :

- le calcul de la moyenne pondérée d'un cours à partir de ses évaluations publiées, et l'arrondi au demi-point ;
- le moteur de délibération, testé sur les notes réelles d'une promotion, préalablement anonymisées : il reproduit les seize décisions prises par le jury ;
- le calcul du solde des frais, en tenant compte des paiements et des exonérations ;
- les transitions autorisées pour les candidatures et les évaluations ;
- la détection des conflits d'examens et la production du calendrier au format iCalendar [@rfc5545] ;
- les règles de la messagerie et du Campus : qui peut écrire à qui, qui voit quelle publication, retenue des seules mentions valides ;
- la neutralisation des formules dans les exports de tableur et le masquage des jetons secrets dans les rapports d'erreur ;
- les règles de sécurité : limitation des tentatives de connexion, validation des adresses de redirection, attribution des rôles.

### 4.3.3. Tests de bout en bout et contrôle des accès

Les tests de bout en bout pilotent un navigateur réel sur la version compilée de l'application, connectée à une base de test dédiée [@playwright-docs]. Les 115 tests réussissent. Ils rejouent les parcours critiques (dépôt et instruction d'une candidature, circuit des notes, délibération et proclamation, planification des examens, devoirs et présences, notifications, messagerie, Campus, exports et gestion du compte) et tentent délibérément des accès interdits, par exemple :

- un étudiant qui tente d'ouvrir le reçu, le relevé ou le bulletin d'un autre étudiant ;
- un enseignant qui tente de saisir des notes dans un cours qui ne lui est pas confié ;
- un agent sans la permission requise qui tente d'atteindre un écran d'administration ;
- un visiteur non connecté qui tente d'atteindre un espace personnel ou un fichier privé ;
- un étudiant qui tente de lire une conversation dont il n'est pas membre ou une publication réservée à une autre promotion.

Dans chaque cas, le refus est vérifié côté serveur, et pas seulement par l'absence d'un bouton dans l'interface.

Une revue de sécurité de l'ensemble du code a complété ces tests. Elle a relevé douze constats : un de gravité élevée, cinq de gravité moyenne et six de faible gravité. Le constat de gravité élevée concernait la possibilité, pour un gestionnaire de comptes, d'obtenir un lien de réinitialisation pour un compte déjà actif ; il a été corrigé, comme dix autres constats. Le douzième, relatif au cloisonnement du stockage des fichiers, a été vérifié sans nécessiter de correction. Une seconde revue, menée sur les modules ajoutés ensuite (messagerie, Campus, notifications sur téléphone, exports, gestion du compte, surveillance des erreurs), a relevé neuf constats : un de gravité élevée, quatre de gravité moyenne et quatre de faible gravité, tous corrigés. Le constat de gravité élevée concernait les notifications sur téléphone, qui restaient actives sur un appareil après la déconnexion ; chaque abonnement est désormais rattaché à la session qui l'a activé et disparaît avec elle. L'analyse des dépendances ne signale aucune vulnérabilité dans le code déployé.

### 4.3.4. Accessibilité

L'outil axe-core a analysé 74 pages (site public, espaces étudiant et enseignant, administration, documents imprimables), sur ordinateur et sur un écran de téléphone [@axe-core]. L'analyse initiale a relevé 6 violations sur ordinateur et 41 sur téléphone, dues notamment à un contraste insuffisant de la couleur d'attention et à des tableaux défilants inaccessibles au clavier. Après correction, l'analyse ne relève plus aucune violation des règles WCAG 2.2 de niveau AA. Les dix-sept écrans capturés lors de la préparation de ce chapitre ont été analysés à nouveau sur l'instance de démonstration, sans violation.

Une vérification manuelle au clavier a complété l'analyse automatique : un lien d'évitement est proposé à la première tabulation, le focus reste visible sur chaque élément parcouru, et le menu mobile s'ouvre au clavier et se ferme par la touche Échap. Une analyse automatique ne détecte qu'une partie des problèmes d'accessibilité ; un test avec des utilisateurs de lecteurs d'écran reste souhaitable.

### 4.3.5. Performance en connexion lente

Les pages publiques ont été mesurées sur le site en ligne avec un profil de réseau mobile lent (latence de 150 ms, débit de 1,6 Mbit/s), un processeur ralenti quatre fois et un écran de téléphone, en désactivant le cache hors connexion pour mesurer une véritable première visite. Le tableau 4.2 présente les résultats.

::tableau Tableau 4.2 : Performance des pages publiques en réseau mobile lent simulé
| Page | Poids à la première visite | Affichage du contenu principal | Visite suivante |
|---|---|---|---|
| Accueil | 602 Ko | 2,0 s | 18 Ko, 0,3 s |
| Formations | 510 Ko | 1,3 s | 11 Ko, 0,4 s |
| Admissions | 387 Ko | 2,9 s | 10 Ko, 0,3 s |
| Actualités | 321 Ko | 1,8 s | 9 Ko, 0,6 s |
| Valve | 320 Ko | 2,0 s | 8 Ko, 0,6 s |
| Contact | 326 Ko | 1,5 s | 10 Ko, 0,2 s |
| Connexion | 365 Ko | 1,9 s | 7 Ko, 0,6 s |

::source Production personnelle, mesures réalisées le 4 novembre 2026.

La première visite comprend les polices et le code commun, téléchargés une seule fois. La page la plus lourde, l'accueil, pèse 602 Ko, soit environ quatre fois moins que la page d'accueil mobile médiane du web, qui atteignait 2 559 Ko en 2025 [@httparchive2025]. Les visites suivantes ne transfèrent que quelques kilo-octets. Le contenu principal s'affiche en moins de trois secondes sur toutes les pages mesurées ; la page des admissions, la plus lente, dépasse toutefois de peu 2,5 secondes. Enfin, les pages des espaces personnels déjà consultées restent lisibles sans connexion grâce au *service worker*.

Un test de charge léger a complété ces mesures le 5 novembre 2026 : 280 requêtes vers les sept pages publiques, dix à la fois, envoyées vers le site en production. Aucune requête n'a échoué. Lorsque les pages étaient déjà en cache sur le réseau de l'hébergeur, la moitié des réponses sont arrivées en moins de 165 ms et 95 % en moins de 0,6 s, pour un débit d'environ quarante pages par seconde ; une page dynamique qui interroge la base de données a répondu en 0,43 s en moyenne. Ces volumes dépassent largement la fréquentation attendue d'un institut, mais ce test ne remplace pas une mesure en période d'affluence réelle, comme une publication de résultats.

## 4.4. Déploiement et exploitation

### 4.4.1. Hébergement

La plateforme est hébergée sur Vercel, qui reconstruit et publie automatiquement chaque nouvelle version validée [@vercel-docs]. La base de données PostgreSQL et le stockage des fichiers sont hébergés par Supabase, dans l'Union européenne. Les fichiers privés (pièces de candidature, copies, rapports de stage) sont conservés dans un espace de stockage privé et ne sont servis qu'après vérification des droits. Lors de chaque déploiement, les migrations de la base sont appliquées automatiquement.

Ce choix d'hébergement a été accepté par l'institut, faute d'offre professionnelle équivalente en République démocratique du Congo. Il s'écarte de l'exigence d'hébergement local posée par l'article 201 du Code du numérique [@code-numerique2023], ce qui impose une autorisation de l'autorité de protection des données ou, à terme, une migration ; l'architecture, fondée sur des standards, rend cette migration possible.

### 4.4.2. Nom de domaine et messagerie

La plateforme est accessible à l'adresse www.isptbukavu.org, en HTTPS. Les courriers électroniques automatiques (confirmation d'adresse, réinitialisation du mot de passe, décisions d'admission, matricule de l'admis) sont envoyés depuis ce domaine par le service Resend, après vérification du domaine par les enregistrements DNS requis. En l'absence de configuration, les messages sont seulement consignés dans le journal du serveur, ce qui évite toute panne de l'application.

### 4.4.3. Sauvegardes et restauration

Une tâche planifiée sur GitHub sauvegarde chaque nuit la totalité de la base de données et des fichiers déposés. La sauvegarde est chiffrée avant de quitter la machine qui la produit, puis conservée trente jours. La fréquence prévue dépasse l'exigence minimale exprimée par l'institut, qui est d'une sauvegarde hebdomadaire.

La restauration a été testée : une sauvegarde complète a été restaurée dans une base neuve, puis comparée ligne par ligne à l'originale au moyen d'une empreinte de chaque ligne. La comparaison n'a révélé aucune différence, et les fichiers restaurés étaient identiques octet pour octet. Une seconde restauration sur une base non vide a été refusée, comme prévu, pour éviter d'écraser des données par erreur. La sauvegarde de production est active depuis le 5 novembre 2026 : la première exécution a sauvegardé 77 tables, et l'archive chiffrée qu'elle a produite a été téléchargée puis déchiffrée avec succès, tandis qu'une phrase secrète erronée était refusée. Elle se connecte avec un compte de base de données qui lui est réservé et qui ne peut que lire : une fuite de ce paramètre ne permettrait aucune modification des données.

### 4.4.4. Surveillance des erreurs

Les erreurs qui surviennent en production, sur le serveur comme dans le navigateur des utilisateurs, sont transmises au service Sentry, qui les regroupe et prévient l'administrateur. Pour respecter la vie privée des usagers, aucune donnée personnelle ne lui est transmise : ni identité, ni cookie, ni contenu de formulaire, ni paramètre d'adresse, et les jetons secrets présents dans certaines adresses, comme ceux des liens de réinitialisation, sont masqués avant l'envoi. Le module chargé dans le navigateur, d'environ 30 Ko compressés, n'est téléchargé qu'après l'affichage de la page, pour ne pas pénaliser les connexions lentes. La surveillance de la disponibilité du site, qui doit alerter en cas d'interruption, reste à mettre en place.

### 4.4.5. Coûts d'exploitation

L'exploitation repose essentiellement sur des offres gratuites, suffisantes pour le trafic d'un institut, et sur des logiciels libres. Le tableau 4.3 en fait la synthèse.

::tableau Tableau 4.3 : Coûts d'exploitation
| Poste | Fournisseur | Offre retenue |
|---|---|---|
| Hébergement de l'application | Vercel | Offre gratuite |
| Base de données et fichiers | Supabase | Offre gratuite |
| Code, intégration continue et sauvegardes | GitHub | Offre gratuite |
| Surveillance des erreurs | Sentry | Offre gratuite |
| Courrier électronique | Resend | Compte de l'auteur |
| Nom de domaine isptbukavu.org | Vercel | Abonnement annuel |
| Logiciels (Next.js, PostgreSQL, Prisma, etc.) | Communautés libres | Gratuits |

::source Production personnelle.

Les offres gratuites comportent des limites : la base gratuite est suspendue après une semaine sans activité, ce que la sauvegarde nocturne empêche en l'interrogeant chaque nuit. Si la fréquentation venait à croître fortement, le passage à des offres payantes resterait possible sans modifier l'application.

## 4.5. Vérification des hypothèses

Le tableau 4.4 confronte les résultats aux trois hypothèses formulées en introduction.

::tableau Tableau 4.4 : Vérification des hypothèses
| Hypothèse | Résultats | Conclusion |
|---|---|---|
| 1. Une application web progressive, légère et consultable hors connexion, convient au contexte de Bukavu | Premières visites de 320 à 602 Ko ; visites suivantes de 7 à 18 Ko ; contenu principal affiché en moins de 3 s en réseau mobile lent simulé ; pages personnelles lisibles hors connexion ; installation sans magasin d'applications | Vérifiée en conditions simulées ; à confirmer sur le réseau d'un opérateur local, avec de vrais téléphones |
| 2. Une plateforme unique, organisée autour de la valve et de circuits de validation, couvre les processus de l'institut avec des droits vérifiés côté serveur | Admissions, valve, horaires, notes, délibérations, examens, frais, documents et stages réunis dans un même outil ; 198 tests unitaires et 115 tests de bout en bout réussis, dont des tentatives d'accès interdites ; deux revues de sécurité, constats corrigés | Vérifiée sur le plan technique ; l'adoption par les usagers reste à évaluer après la mise en service |
| 3. Une architecture portable, complémentaire de la plateforme ministérielle, respecte le cadre réglementaire | Base PostgreSQL standard et stockage d'objets remplaçable ; sauvegarde restaurée sans perte dans une base neuve ; exports en tableur du registre des inscriptions, des effectifs, des notes et des résultats proclamés | Partiellement vérifiée : la portabilité est démontrée, mais les exports au format attendu par la plateforme ministérielle et l'hébergement en RDC restent à réaliser |

::source Production personnelle.

## 4.6. Limites du travail

Ce travail présente plusieurs limites, qu'il convient d'énoncer clairement :

- **l'absence d'évaluation par les usagers** : le questionnaire préparé n'a pas pu être administré dans le temps du travail ; la satisfaction des étudiants, des enseignants et du personnel reste à mesurer après la mise en service ;
- **des mesures de performance simulées** : elles ont été réalisées depuis un serveur, et non depuis un téléphone connecté au réseau d'un opérateur de Bukavu ;
- **l'hébergement hors de la RDC**, accepté par l'institut mais contraire au principe posé par le Code du numérique, en l'absence d'autorisation de l'autorité de protection des données ;
- **les données officielles en attente** : les montants des frais, le programme officiel des cours, les règles d'évaluation fixées par l'arrêté en vigueur et les textes juridiques de la plateforme doivent être fournis par l'institut ; les règles de délibération reprennent la pratique observée dans un classeur de bulletins, en attendant leur confirmation ;
- **l'interopérabilité avec la plateforme ministérielle**, limitée à des exports tabulaires, sans échange automatique ;
- **le paiement par monnaie mobile**, non intégré : les paiements sont enregistrés par la caisse ;
- **la surveillance de la disponibilité**, prévue dès la conception mais pas encore installée, alors que celle des erreurs est en service ;
- **les règles de la communauté** (règles de conduite du Campus, droits d'écriture de la messagerie, choix des modérateurs), proposées par la plateforme mais à faire valider par l'institut ;
- **une politique de sécurité du contenu** qui autorise les scripts intégrés aux pages, compromis nécessaire au fonctionnement du cadre d'application et au maintien du cache.

## Conclusion partielle

Ce chapitre a présenté la plateforme réalisée : un site institutionnel administrable, des admissions en ligne de bout en bout, une valve numérique ciblée, une messagerie et un espace d'échange modérés, des espaces pour les candidats, les étudiants et les enseignants, la gestion des notes, des délibérations, des examens et des frais, des documents vérifiables par code QR et une administration complète. Les tests automatisés, la revue de sécurité, l'analyse d'accessibilité et les mesures de performance montrent que la plateforme répond pour l'essentiel aux exigences fixées au chapitre 3. Elle est en ligne à l'adresse www.isptbukavu.org, sauvegardée chaque nuit et surveillée ; pour entrer pleinement en service, elle attend les données officielles de l'institut.

Les deux premières hypothèses sont vérifiées sur le plan technique, la troisième partiellement. Les limites relevées, en particulier l'absence d'évaluation par les usagers et l'hébergement hors de la RDC, ouvrent les perspectives présentées dans la conclusion générale.
