# CHAPITRE 3. ANALYSE ET CONCEPTION DU SYSTÈME

## Introduction

Les deux chapitres précédents ont établi les besoins de l'ISPT-Bukavu et les choix qui en découlent. Ce chapitre traduit ces besoins en un modèle précis du système à construire. Il présente d'abord la démarche suivie, puis la spécification des besoins, la modélisation fonctionnelle (cas d'utilisation, séquences, activités et états), la modélisation statique (classes et données), l'architecture et la sécurité, et enfin la conception des interfaces.

Les diagrammes présentés ici ont été confrontés au code de la plateforme une fois celle-ci réalisée : ils décrivent le système tel qu'il fonctionne, et non une intention initiale.

## 3.1. Démarche de modélisation

### 3.1.1. Processus de développement itératif

Le développement a suivi un processus itératif et incrémental inspiré du processus unifié [@jacobson1999; @larman2005]. Plutôt que de tout concevoir avant de tout réaliser, le travail a été découpé en phases courtes. Chacune ajoutait un ensemble cohérent de fonctions (par exemple les admissions en ligne, puis la valve numérique, puis les délibérations) et se terminait par des tests, une vérification visuelle sur ordinateur et sur téléphone, puis une mise en ligne. Les premières phases ont posé les fondations : dépôt du code, intégration continue, base de données, authentification et gestion des droits. Les phases suivantes ont construit les modules métier sur ces fondations.

Cette démarche présente deux avantages dans notre contexte. Elle permet de livrer tôt des fonctions utilisables et de les corriger à partir de l'usage réel. Elle limite aussi le risque : une erreur de conception est découverte au plus tard à la fin de la phase où elle a été commise, et non à la fin du projet. Elle s'inscrit dans le cycle de la recherche par la conception présenté en introduction, où chaque itération enchaîne conception, démonstration et évaluation [@peffers2007].

### 3.1.2. Langage de modélisation UML

La modélisation utilise le langage UML (*Unified Modeling Language*), norme publiée par l'Object Management Group [@omg-uml251]. Parmi ses diagrammes, nous retenons ceux qui répondent à une question utile pour ce projet [@roques2018] :

- les **diagrammes de cas d'utilisation**, pour délimiter ce que chaque acteur peut faire ;
- les **diagrammes de séquence**, pour décrire l'enchaînement des échanges dans les processus critiques ;
- les **diagrammes d'activité**, pour représenter un parcours qui traverse plusieurs services ;
- les **diagrammes d'états**, pour fixer le cycle de vie des objets qui changent de statut (candidature, évaluation, délibération) ;
- les **diagrammes de classes**, pour structurer les données ;
- les **diagrammes de déploiement et de composants**, pour l'architecture.

Les diagrammes sont écrits sous forme de texte avec l'outil PlantUML et conservés avec le code de la plateforme, ce qui permet de les mettre à jour en même temps que lui.

## 3.2. Spécification des besoins

### 3.2.1. Acteurs du système

Le tableau 3.1 présente les acteurs qui interagissent avec la plateforme.

::tableau Tableau 3.1 : Acteurs du système
| Acteur | Description |
|---|---|
| Visiteur | Toute personne qui consulte le site public sans compte : futur étudiant, parent, partenaire, employeur |
| Vérificateur | Visiteur qui contrôle l'authenticité d'un document en lisant son code QR |
| Candidat | Personne qui crée un compte pour déposer un dossier de candidature en première année |
| Étudiant | Personne inscrite dans une promotion pour l'année académique en cours |
| Enseignant | Titulaire d'un ou de plusieurs cours offerts à une promotion |
| Personnel | Agent de l'institut disposant d'un ou de plusieurs rôles d'administration : direction, secrétariat académique, secrétariat administratif, appariteur ou secrétariat de section, caisse, communication, support |
| Administrateur technique | Personne qui configure la plateforme, les rôles et les permissions |
| Système | Tâches automatiques : envoi des courriers électroniques, notifications, sauvegardes |

::source Production personnelle.

### 3.2.2. Besoins fonctionnels

Les besoins identifiés au chapitre 1 ont été détaillés en besoins fonctionnels, regroupés par module au tableau 3.2.

::tableau Tableau 3.2 : Besoins fonctionnels par module
| Module | Principaux besoins fonctionnels |
|---|---|
| Site institutionnel | Présenter l'institut, les filières, les autorités, les partenaires, les actualités, l'agenda et la galerie ; recevoir des messages ; vérifier un document |
| Admissions | Ouvrir des campagnes ; créer un compte candidat confirmé par courrier électronique ; remplir le dossier, déposer les pièces, déclarer les frais ; suivre l'état du dossier ; instruire, décider et inscrire l'admis |
| Valve numérique | Publier des communiqués ciblés (public, institut, filière, promotion, cours) avec pièces jointes ; valider les communiqués de portée générale ; accuser lecture |
| Structure académique | Gérer années, filières, niveaux, promotions, unités d'enseignement et cours ; affecter les enseignants ; importer les étudiants ; construire l'horaire |
| Enseignement | Déposer des supports ; publier et corriger des devoirs ; faire l'appel des séances |
| Notes et délibérations | Saisir, transmettre, valider et publier les notes ; paramétrer le règlement ; calculer les résultats ; conduire la délibération ; publier les résultats et les bulletins |
| Examens | Planifier les sessions et les épreuves ; détecter les conflits de salle, de promotion et de surveillant ; publier et notifier |
| Frais académiques | Définir les barèmes ; enregistrer les paiements et émettre des reçus numérotés ; accorder des exonérations ; consulter les soldes |
| Documents officiels | Demander et émettre des documents vérifiables par code QR ; révoquer un document |
| Stages et insertion | Gérer les lieux et les affectations de stage ; publier des offres ; tenir un annuaire volontaire des anciens |
| Administration | Gérer les comptes, les rôles et les permissions ; modifier les contenus du site ; consulter le journal d'activité et le tableau de bord |

::source Production personnelle.

### 3.2.3. Besoins non fonctionnels

Le tableau 3.3 fixe les exigences de qualité et la manière de les vérifier. Elles découlent des contraintes de connectivité, du cadre réglementaire et des normes présentés au chapitre 2.

::tableau Tableau 3.3 : Besoins non fonctionnels
| Exigence | Formulation | Vérification |
|---|---|---|
| Performance | Pages utilisables sur une connexion mobile lente, poids de la première visite nettement inférieur à la médiane du web mobile | Mesure en réseau mobile lent simulé |
| Mobilité | Toutes les fonctions utilisables sur un écran de téléphone d'environ 390 pixels de large | Vérification visuelle sur écran de téléphone |
| Hors connexion | Pages personnelles déjà consultées lisibles sans réseau | Test avec le réseau coupé |
| Accessibilité | Conformité aux règles WCAG 2.2, niveau AA | Analyse automatique et parcours au clavier |
| Sécurité | Droits vérifiés côté serveur à chaque requête ; mots de passe hachés ; tentatives limitées | Tests d'intrusion entre rôles, revue de code |
| Confidentialité | Données minimales, consentement pour les traitements facultatifs, accès journalisés | Revue des formulaires et du journal |
| Disponibilité | Sauvegardes régulières et restauration testée | Restauration complète sur une base vide |
| Portabilité | Base PostgreSQL standard et stockage d'objets remplaçable | Revue de l'architecture |
| Administrabilité | Aucun contenu institutionnel figé dans le code | Inventaire des contenus administrables |
| Maintenabilité | Code typé, règles métier isolées et testées, intégration continue | Tests automatisés à chaque modification |

::source Production personnelle.

## 3.3. Modélisation fonctionnelle

### 3.3.1. Diagrammes de cas d'utilisation

Un cas d'utilisation représente un service rendu par le système à un acteur [@roques2018]. Nous les avons regroupés en trois diagrammes, un par grande famille d'acteurs.

La figure 3.1 présente les cas d'utilisation du site public et des admissions. Le visiteur consulte l'institut, vérifie un document ou écrit à l'institut sans créer de compte ; le candidat crée un compte puis remplit sa candidature, ce qui inclut le dépôt des pièces et la déclaration du paiement. L'instruction du dossier par le secrétariat peut être prolongée par une demande de complément ou par l'inscription de l'admis.

![Figure 3.1 : Cas d'utilisation des visiteurs et des candidats](../conception/figures/cas-utilisation-public.png){largeur=15}

::source Production personnelle.

La figure 3.2 présente les espaces de l'étudiant et de l'enseignant. L'étudiant consulte l'information qui le concerne (valve, horaire, examens, supports, notes, résultats, frais) et effectue quelques démarches (remise de devoir, demande de document, rapport de stage). L'enseignant gère ce qui relève de ses propres cours : supports, devoirs, appel, saisie et transmission des notes, communiqués à ses étudiants.

![Figure 3.2 : Cas d'utilisation des étudiants et des enseignants](../conception/figures/cas-utilisation-academique.png){largeur=14}

::source Production personnelle.

La figure 3.3 présente l'administration. Chaque acteur y correspond à un rôle de l'organigramme ; un même agent peut cumuler plusieurs rôles.

![Figure 3.3 : Cas d'utilisation de l'administration](../conception/figures/cas-utilisation-administration.png){largeur=14}

::source Production personnelle.

### 3.3.2. Description des cas d'utilisation principaux

Trois cas d'utilisation concentrent les enjeux de la plateforme. Les tableaux 3.4 à 3.6 les décrivent sous forme textuelle.

::tableau Tableau 3.4 : Description du cas « Déposer une candidature »
| Élément | Description |
|---|---|
| Acteur principal | Candidat |
| Préconditions | Une campagne d'admission est ouverte ; le candidat a créé un compte |
| Scénario nominal | 1. Le candidat confirme son adresse électronique par le lien reçu. 2. Il remplit son identité, ses études secondaires et la filière souhaitée. 3. Il téléverse les pièces exigées. 4. Il indique le mode et la référence du paiement des frais de dossier. 5. Il dépose le dossier ; le système vérifie qu'il est complet et lui attribue un numéro. |
| Scénarios alternatifs | Dossier incomplet : le système liste les éléments manquants et le dossier reste modifiable. Paiement refusé par la caisse : le candidat corrige la référence. Complément demandé par le secrétariat : le candidat complète puis redépose. |
| Postconditions | La candidature est à l'état « Soumise » ; le candidat suit son évolution dans son espace et reçoit un courrier électronique à chaque décision |

::source Production personnelle.

::tableau Tableau 3.5 : Description du cas « Publier un communiqué »
| Élément | Description |
|---|---|
| Acteur principal | Auteur : personnel de section, direction ou enseignant |
| Préconditions | L'auteur est connecté et dispose d'un droit de publication pour la cible choisie |
| Scénario nominal | 1. L'auteur rédige le communiqué et joint éventuellement un fichier. 2. Il choisit la cible : le public, tout l'institut, une filière, une promotion ou l'un de ses cours. 3. Le système vérifie que l'auteur peut viser cette cible. 4. Le communiqué est publié et les destinataires sont notifiés. 5. L'ouverture du communiqué par un destinataire enregistre un accusé de lecture. |
| Scénarios alternatifs | Cible « institut » ou « public » choisie par un auteur qui n'est pas validateur : le communiqué passe à l'état « En validation » et la direction est notifiée ; il n'est publié qu'après approbation. |
| Postconditions | Le communiqué est visible des seuls destinataires concernés ; l'auteur voit le nombre de lectures |

::source Production personnelle.

::tableau Tableau 3.6 : Description du cas « Conduire une délibération »
| Élément | Description |
|---|---|
| Acteur principal | Secrétariat académique |
| Préconditions | Le règlement de l'année est paramétré ; les notes des cours de la promotion sont publiées |
| Scénario nominal | 1. Le secrétariat ouvre la délibération d'une promotion pour un semestre ou pour l'année. 2. Le système calcule pour chaque étudiant la moyenne, les crédits validés, la mention et la décision proposée. 3. Le secrétariat saisit la composition du jury et, le cas échéant, une décision du jury différente, toujours motivée. 4. Il clôture la délibération ; le système fige le règlement appliqué. 5. Il proclame les résultats ; les bulletins vérifiables sont émis et les étudiants notifiés. |
| Scénarios alternatifs | Contrôle bloquant à la clôture (notes non publiées, jury non renseigné, décision sans motif) : la clôture est refusée avec la liste des problèmes. Erreur constatée après proclamation : la proclamation est annulée et les bulletins sont révoqués. |
| Postconditions | Les résultats sont consultables par chaque étudiant ; le procès-verbal et l'export des résultats sont disponibles |

::source Production personnelle.

### 3.3.3. Diagrammes de séquence

Un diagramme de séquence montre, dans l'ordre chronologique, les messages échangés entre les acteurs et les composants du système. Nous en présentons quatre, correspondant aux processus où une erreur aurait les conséquences les plus lourdes.

La figure 3.4 décrit le dépôt et l'instruction d'une candidature. Deux détails de conception y apparaissent. À la création du compte, le message renvoyé est le même que l'adresse soit déjà connue ou non : un tiers ne peut donc pas s'en servir pour savoir qui a un compte. À chaque étape d'instruction, le serveur vérifie la permission de l'agent et la validité de la transition demandée avant d'écrire en base.

![Figure 3.4 : Séquence du dépôt et de l'instruction d'une candidature](../conception/figures/sequence-candidature.png){largeur=15.5}

::source Production personnelle.

La figure 3.5 décrit la publication d'un communiqué ciblé et son accusé de lecture.

![Figure 3.5 : Séquence de la publication d'un communiqué ciblé](../conception/figures/sequence-communique.png){largeur=15}

::source Production personnelle.

La figure 3.6 décrit le circuit des notes. La règle centrale est qu'un étudiant ne voit une note qu'une fois l'évaluation publiée ; l'enseignant ne peut transmettre ses notes que s'il a indiqué une note ou une absence pour chaque étudiant.

![Figure 3.6 : Séquence de la saisie, de la validation et de la publication des notes](../conception/figures/sequence-notes.png){largeur=15}

::source Production personnelle.

La figure 3.7 décrit l'émission et la vérification d'un document officiel. L'identifiant contenu dans le code QR est tiré au hasard et suffisamment long pour ne pas pouvoir être deviné ; la page de vérification n'affiche que le minimum nécessaire.

![Figure 3.7 : Séquence de l'émission et de la vérification d'un document officiel](../conception/figures/sequence-verification.png){largeur=14}

::source Production personnelle.

### 3.3.4. Diagrammes d'activité et d'états

Le diagramme d'activité de la figure 3.8 suit le parcours d'admission à travers les trois acteurs concernés : le candidat, la caisse et le secrétariat.

![Figure 3.8 : Activité du parcours d'admission en première année](../conception/figures/activite-admission.png){largeur=12}

::source Production personnelle.

Les objets qui changent de statut ont été modélisés par des diagrammes d'états. Ces diagrammes ne sont pas seulement descriptifs : les transitions autorisées sont codées dans des règles centralisées, que le serveur consulte avant toute modification, et celles des candidatures et des évaluations sont vérifiées par des tests automatiques. Une transition absente du diagramme est donc refusée par le système.

La figure 3.9 présente les états d'une candidature, la figure 3.10 ceux d'une évaluation et de ses notes, et la figure 3.11 ceux d'une délibération.

![Figure 3.9 : États d'une candidature](../conception/figures/etats-candidature.png){largeur=10}

::source Production personnelle.

![Figure 3.10 : États d'une évaluation et de ses notes](../conception/figures/etats-note.png){largeur=10}

::source Production personnelle.

![Figure 3.11 : États d'une délibération](../conception/figures/etats-deliberation.png){largeur=10}

::source Production personnelle.

La délibération illustre l'intérêt de cette approche. Tant qu'elle est en préparation, les résultats sont recalculés avec le règlement en vigueur. À la clôture, le règlement appliqué est copié dans la délibération : une modification ultérieure du règlement de l'année ne change plus des résultats déjà arrêtés. Ce choix répond directement à la fragilité observée au chapitre 1, où une même moyenne était calculée de plusieurs manières.

## 3.4. Modélisation statique

### 3.4.1. Diagramme de classes

Le modèle de données compte une soixantaine de classes. Pour rester lisible, il est présenté en quatre diagrammes thématiques.

La figure 3.12 présente la structure académique et l'évaluation. Elle reprend l'organisation du système LMD : une filière comprend des unités d'enseignement, chacune portant des crédits et rattachée à un niveau et à un semestre ; une promotion réunit une filière, un niveau et une année académique ; un cours offert est l'instance d'un cours pour une promotion donnée, avec ses enseignants, ses séances, ses supports et ses évaluations.

![Figure 3.12 : Diagramme de classes de la structure académique et de l'évaluation](../conception/figures/classes-academique.png){largeur=15}

::source Production personnelle.

La figure 3.13 présente les admissions, la valve, les frais et les documents officiels.

![Figure 3.13 : Diagramme de classes des admissions, de la valve, des frais et des documents](../conception/figures/classes-admissions-valve.png){largeur=15.5}

::source Production personnelle.

La figure 3.14 présente les délibérations, les examens, les devoirs et les présences. Le résultat d'une délibération conserve le détail figé de chaque cours et peut être lié au bulletin vérifiable émis lors de la proclamation.

![Figure 3.14 : Diagramme de classes des délibérations, des examens, des devoirs et des présences](../conception/figures/classes-deliberations-examens.png){largeur=13}

::source Production personnelle.

La figure 3.15 présente les contenus du site, les droits d'accès et la traçabilité. Les utilisateurs reçoivent des rôles, et les rôles regroupent des permissions, selon le modèle de contrôle d'accès basé sur les rôles [@ferraiolo2001].

![Figure 3.15 : Diagramme de classes des contenus, des accès et de la traçabilité](../conception/figures/classes-contenu.png){largeur=14}

::source Production personnelle.

### 3.4.2. Modèle physique des données

Le modèle de classes est traduit en un schéma de base de données relationnelle PostgreSQL, décrit dans un fichier unique et versionné à l'aide de Prisma [@prisma-docs]. Chaque évolution du schéma fait l'objet d'une migration, c'est-à-dire d'un script SQL conservé avec le code, qui permet de reconstruire la base à l'identique sur n'importe quel serveur. Le tableau 3.7 répartit les tables par domaine.

::tableau Tableau 3.7 : Répartition des tables de la base de données
| Domaine | Tables | Nombre |
|---|---|---|
| Comptes et sécurité | Utilisateur, Role, Permission, liaisons rôle-permission et utilisateur-rôle, Session, JetonReinitialisation, TentativeConnexion, JournalActivite, Notification | 10 |
| Contenus du site | Reglage, Media, Page, BlocPage, Actualite, Evenement, Album, AlbumMedia, Partenaire, Autorite, QuestionFrequente, MessageContact | 12 |
| Structure académique | AnneeAcademique, Filiere, Niveau, Promotion, ProfilEtudiant, Inscription, ProfilEnseignant, UniteEnseignement, Cours, CoursOffert, CoursEnseignant, Seance, Support | 13 |
| Évaluation | Evaluation, Note, ReglementAcademique, Deliberation, ResultatDeliberation, SessionExamen, Epreuve, EpreuveSurveillant, Devoir, Remise, Presence | 11 |
| Valve | Communique, PieceJointe, Lecture | 3 |
| Admissions | CampagneAdmission, PieceExigee, Candidature, PieceDeposee, HistoriqueCandidature | 5 |
| Finances | BaremeFrais, Paiement, Exoneration | 3 |
| Documents et stages | DemandeDocument, DocumentOfficiel, LieuStage, Stage | 4 |
| Insertion | Ancien, OffreInsertion | 2 |
| Total | | 63 |

::source Production personnelle, d'après le schéma de la base de données.

À ces 63 tables s'ajoutent deux tables de liaison créées automatiquement par l'outil d'accès aux données pour des relations simples entre campagnes et filières, et entre offres et filières.

Plusieurs choix de conception protègent l'intégrité des données :

- **des identifiants opaques**, générés aléatoirement, plutôt que des numéros séquentiels qui révéleraient le nombre d'enregistrements ou permettraient d'en deviner d'autres ;
- **des contraintes d'unicité** sur les données qui doivent l'être : matricule d'un étudiant, code de vérification d'un document, numéro de dossier, promotion définie par le triplet filière, niveau et année ;
- **des types décimaux** pour les notes et les montants, afin d'éviter les erreurs d'arrondi des nombres à virgule flottante ;
- **des copies figées** au format JSON lorsque l'historique doit être conservé : règlement appliqué à une délibération, détail des notes d'un résultat, données imprimées sur un document officiel ;
- **des suppressions en cascade** limitées aux données dépendantes (les notes d'une évaluation supprimée), jamais aux documents officiels ni aux paiements ;
- **des empreintes au lieu des secrets** : les jetons de session, de réinitialisation et de confirmation ne sont stockés que sous forme d'empreinte, de sorte qu'une fuite de la base ne permet pas de les réutiliser.

Enfin, la sécurité au niveau des lignes est activée sur toutes les tables, sans aucune règle d'accès : l'interface de programmation publique de l'hébergeur ne peut lire aucune donnée, et seule l'application, connectée par un canal serveur, y accède [@supabase-rls].

## 3.5. Architecture du système

### 3.5.1. Architecture logique

La figure 3.16 présente l'architecture logique en trois couches. La couche de présentation regroupe les cinq interfaces : site public, espaces candidat, étudiant et enseignant, administration. La couche applicative, exécutée sur le serveur, contient les modules métier et le contrôle d'accès. La couche d'infrastructure regroupe l'accès aux données, le stockage des fichiers, l'envoi des courriers électroniques et la production des pages imprimables avec code QR.

![Figure 3.16 : Architecture logique de l'application](../conception/figures/composants.png){largeur=15.5}

::source Production personnelle.

Dans le code, chaque module métier est organisé de la même façon : un fichier de **règles** contient les fonctions de calcul et de décision, sans accès à la base ni au réseau, ce qui permet de les tester isolément ; un fichier d'**actions** contient les opérations déclenchées par l'utilisateur, qui vérifient les droits, valident les données, appliquent les règles puis écrivent en base ; un fichier de **requêtes** contient les lectures. Cette séparation rend les règles métier lisibles et vérifiables, ce qui compte pour des calculs aussi sensibles que les moyennes ou les soldes.

### 3.5.2. Architecture physique et déploiement

La figure 3.17 présente le déploiement. Le navigateur de l'utilisateur, éventuellement installé comme application, communique en HTTPS avec l'hébergeur web, qui sert les pages statiques depuis son réseau de diffusion et exécute les fonctions serveur. Celles-ci accèdent à la base de données et au stockage d'objets, hébergés dans l'Union européenne, et au service de courrier électronique. Le code est conservé sur GitHub : chaque nouvelle version déclenche les tests puis le déploiement, et une tâche planifiée est prévue pour produire chaque nuit une sauvegarde chiffrée de la base et des fichiers.

![Figure 3.17 : Diagramme de déploiement](../conception/figures/deploiement.png){largeur=13}

::source Production personnelle.

### 3.5.3. Sécurité et contrôle des accès

La sécurité a été conçue à partir des risques recensés par l'OWASP [@owasp2025]. Le tableau 3.8 présente les mesures retenues.

::tableau Tableau 3.8 : Mesures de sécurité de la plateforme
| Risque | Mesures |
|---|---|
| Contrôle d'accès défaillant | Chaque page et chaque action vérifient côté serveur l'identité, la permission et le droit sur la ressource visée (son cours, sa promotion, ses propres données) ; fichiers privés servis par des routes contrôlées |
| Défaillances cryptographiques | HTTPS imposé ; mots de passe hachés avec Argon2id ; jetons stockés sous forme d'empreinte, à durée limitée et à usage unique |
| Injection | Requêtes paramétrées par l'outil d'accès aux données ; validation de toutes les entrées |
| Conception non sécurisée | Règles de transition centralisées et testées ; principe du moindre privilège |
| Mauvaise configuration | Politique de sécurité du contenu, en-têtes de protection, secrets uniquement dans les variables d'environnement |
| Chaîne d'approvisionnement | Dépendances limitées et auditées |
| Authentification | Tentatives limitées par identifiant et par adresse IP ; temps de réponse identique que le compte existe ou non ; sessions de sept jours révocables |
| Journalisation | Journal des actions sensibles avec auteur, date, état avant et après |
| Conditions exceptionnelles | Pages d'erreur génériques, sans détail technique ; mode hors connexion |

::source Production personnelle.

**Le modèle de droits.** La plateforme définit 21 permissions élémentaires (par exemple « valider et publier les notes » ou « enregistrer les paiements ») regroupées dans 11 rôles par défaut, calqués sur l'organigramme : administrateur technique, direction générale, secrétariat général académique, secrétariat général administratif, appariteur ou secrétariat de section, caisse, communication, support technique, enseignant, étudiant et candidat. Les rôles du personnel restent modifiables dans l'administration. Pour éviter qu'un gestionnaire ne s'accorde plus de pouvoir qu'il n'en a, un rôle ne peut être attribué que par une personne qui détient déjà toutes ses permissions, et nul ne peut modifier ses propres rôles.

**Les droits sur les ressources.** La permission ne suffit pas : un enseignant qui peut saisir des notes ne peut le faire que pour les cours qui lui sont confiés, et un étudiant ne voit que ses propres notes, frais et documents. Ces vérifications de propriété sont faites sur le serveur à partir de l'identité de la session, jamais à partir d'une valeur fournie par le navigateur.

**Les sessions.** À la connexion, le serveur crée une session en base et remet au navigateur un jeton aléatoire dans un cookie inaccessible aux scripts de la page. Seule l'empreinte de ce jeton est conservée ; la session peut être révoquée à tout moment, par exemple à la désactivation d'un compte.

## 3.6. Conception des interfaces

### 3.6.1. Charte graphique

L'identité visuelle de la plateforme part du blason de l'institut. Les couleurs principales en sont tirées : un bleu nuit dit « encre » (#141B4A) pour les fonds et les titres, un jaune dit « chantier » (#FEF200) réservé aux accents rares, et des neutres chauds pour les fonds et les textes secondaires, dont un fond « papier » (#F7F6F2). Les couleurs de retour (succès, attention, erreur) sont réservées aux messages de l'interface et choisies pour respecter les rapports de contraste exigés.

La typographie associe trois familles libres, auto-hébergées pour ne dépendre d'aucun service externe : Newsreader pour les titres, IBM Plex Sans pour le texte et l'interface, IBM Plex Mono pour les données techniques comme les matricules et les codes de vérification. Les animations restent sobres et sont désactivées lorsque l'utilisateur a demandé à son système de réduire les mouvements.

### 3.6.2. Architecture de l'information

Le site public s'organise autour de cinq entrées principales (l'institut, les formations, les admissions, les actualités, le contact), complétées par la valve publique, la galerie, l'annuaire des anciens, les offres de stage et d'emploi, la vérification des documents et le centre d'aide.

Chaque espace personnel présente sa propre navigation. L'espace étudiant donne accès à l'accueil, à la valve, à l'horaire, aux examens, aux cours, aux notes, aux résultats, aux frais, aux stages et aux documents ; l'espace enseignant à ses cours, à l'horaire, aux examens, à la valve et aux stages. L'administration regroupe ses écrans en huit rubriques : général, site public, académique, finances, admissions, communication, personnes et système. Un agent ne voit que les entrées correspondant à ses permissions.

### 3.6.3. Accessibilité

Les règles WCAG 2.2 ont été appliquées dès la conception plutôt que vérifiées à la fin [@w3c-wcag22]. Les choix suivants en découlent :

- un lien d'évitement permet d'atteindre directement le contenu au clavier, et le focus reste toujours visible ;
- chaque champ de formulaire a une étiquette, et chaque image porte une description, dont l'absence est signalée dans l'administration ;
- les contrastes respectent le niveau AA, y compris pour la couleur d'attention ;
- les cibles tactiles ont une taille suffisante pour être utilisées au doigt ;
- le collage du mot de passe est autorisé, et une information déjà saisie n'est jamais redemandée ;
- l'aide est accessible au même endroit dans tous les espaces.

Ces exigences sont vérifiées par les tests automatiques et manuels présentés au chapitre suivant.

## Conclusion partielle

Ce chapitre a présenté la conception de la plateforme. La démarche itérative et le langage UML ont permis de passer des besoins à un modèle précis : 17 diagrammes décrivent les acteurs, les processus critiques, le cycle de vie des objets, les données, l'architecture et le déploiement. Le modèle de données compte 63 tables principales, protégées par des contraintes d'intégrité et des copies figées là où l'historique doit être conservé. La sécurité repose sur un contrôle d'accès basé sur les rôles, vérifié côté serveur jusqu'au niveau de chaque ressource. L'interface, enfin, part de l'identité de l'institut et intègre l'accessibilité dès la conception.

Le chapitre suivant présente la réalisation de ce modèle, les tests qui en vérifient la conformité et la mise en production de la plateforme.
