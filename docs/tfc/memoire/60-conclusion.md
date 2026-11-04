# CONCLUSION GÉNÉRALE

**Rappel de la problématique.** Notre point de départ était un constat : à l'ISPT-Bukavu, l'information officielle n'atteint directement que les personnes présentes à l'institut, les démarches se font sur papier et au guichet, et les documents délivrés ne peuvent pas être vérifiés à distance. Nous nous sommes donc demandé comment doter l'institut d'un outil numérique unique, fiable et adapté à la faible connectivité de Bukavu, capable de diffuser l'information officielle de façon ciblée et vérifiable, de dématérialiser les principaux processus académiques et administratifs, et de rester administrable par le personnel sans compétence technique.

**Démarche suivie.** Pour y répondre, nous avons adopté la démarche de la recherche par la conception, qui consiste à construire un artefact puis à l'évaluer, en la combinant avec une analyse systémique de l'institut et un développement itératif et incrémental. Le premier chapitre a présenté l'ISPT-Bukavu et analysé cinq de ses processus ; il en a tiré neuf besoins. Le deuxième chapitre a défini les concepts mobilisés, montré qu'aucune solution existante, à l'étranger comme en République démocratique du Congo, ne répondait à l'ensemble de ces besoins à un coût soutenable, et exposé le cadre réglementaire et normatif auquel la plateforme doit se conformer. Le troisième chapitre a traduit les besoins en un modèle précis, décrit par dix-sept diagrammes UML, une base de données de soixante-trois tables principales et un modèle de droits fondé sur les rôles. Le quatrième chapitre a présenté la plateforme réalisée, les tests qui en vérifient la conformité et sa mise en production.

**Résultats obtenus.** Le principal résultat de ce travail est une plateforme opérationnelle, en ligne à l'adresse www.isptbukavu.org. Elle réunit dans un même outil :

- un site institutionnel entièrement administrable par l'institut ;
- des admissions en ligne, du dépôt du dossier à l'inscription de l'admis ;
- une valve numérique de communiqués ciblés, avec accusé de lecture ;
- des espaces pour les candidats, les étudiants et les enseignants, utilisables sur téléphone, dont les pages déjà consultées restent lisibles hors connexion pour les étudiants et les enseignants ;
- la gestion des horaires, des notes, des délibérations, des examens, des frais, des stages et des offres d'insertion ;
- des documents officiels vérifiables par code QR ;
- une administration avec gestion des rôles, journal d'activité et tableau de bord de pilotage.

Sa qualité a été mesurée : 150 tests unitaires et 95 tests de bout en bout réussis, dont des tentatives délibérées d'accès interdits ; aucune violation des règles d'accessibilité WCAG 2.2 de niveau AA sur les pages analysées ; des pages publiques de 320 à 602 Ko à la première visite, affichées en moins de trois secondes en réseau mobile lent simulé ; une sauvegarde complète restaurée sans aucune perte.

**Vérification des hypothèses.** La première hypothèse, selon laquelle une application web progressive, légère et consultable hors connexion conviendrait mieux au contexte de Bukavu qu'une application mobile native, est vérifiée en conditions simulées ; elle reste à confirmer sur le réseau d'un opérateur local. La deuxième hypothèse, selon laquelle une plateforme unique organisée autour de la valve et de circuits de validation pourrait couvrir les processus de l'institut avec des droits vérifiés côté serveur, est vérifiée sur le plan technique ; son adoption par les usagers reste à évaluer. La troisième hypothèse, relative à une architecture portable et complémentaire de la plateforme ministérielle, n'est que partiellement vérifiée : la portabilité des données est démontrée, mais les exports au format attendu par le ministère et l'hébergement en République démocratique du Congo restent à réaliser.

**Apports du travail.** Pour l'institut, ce travail apporte un outil qu'il peut administrer lui-même, qui rend l'information officielle accessible à distance, devrait réduire les déplacements des étudiants et rend ses documents vérifiables. Sur le plan méthodologique, il montre comment des contraintes concrètes (connectivité, coût, cadre réglementaire) se traduisent en exigences de conception vérifiables. Il illustre aussi l'intérêt d'écrire chaque règle de calcul une seule fois et de la tester : le moteur de délibération reproduit les seize décisions d'un jury réel tout en appliquant un calcul de moyenne unique, là où le classeur d'origine en mélangeait trois.

**Limites.** Ce travail comporte des limites, détaillées au chapitre 4. Aucune évaluation par les usagers n'a pu être menée ; les mesures de performance ont été réalisées en conditions simulées ; les données sont hébergées hors du pays ; plusieurs informations officielles, comme les montants des frais, le programme des cours et les règles d'évaluation en vigueur, doivent encore être fournies par l'institut.

**Perspectives.** Plusieurs prolongements découlent de ces limites :

1. **évaluer la plateforme auprès de ses usagers**, à l'aide du questionnaire et du guide d'entretien préparés, quelques mois après la mise en service ;
2. **mesurer la performance sur place**, depuis des téléphones d'entrée de gamme connectés aux réseaux des opérateurs de Bukavu ;
3. **rapatrier l'hébergement des données en République démocratique du Congo** dès qu'une offre adaptée existera, ou obtenir l'autorisation de l'autorité de protection des données ;
4. **produire des exports au format de la plateforme ministérielle**, puis un échange automatique lorsque son interface sera ouverte aux établissements ;
5. **intégrer le paiement par monnaie mobile**, en partenariat avec un agrégateur de paiement ;
6. **installer une surveillance de la disponibilité et des erreurs**, et activer la sauvegarde nocturne en production ;
7. **étendre l'interface au swahili et à l'anglais**, et évaluer l'intérêt d'une plateforme d'apprentissage en ligne plus complète.

Au-delà de l'ISPT-Bukavu, la démarche suivie peut intéresser d'autres établissements d'enseignement supérieur de la région, confrontés aux mêmes contraintes. Nous espérons que ce travail contribuera, à sa mesure, à la modernisation de la gestion académique et de la communication institutionnelle dans l'enseignement supérieur congolais.
