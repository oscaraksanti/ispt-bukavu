# Préparation de la soutenance : questions probables et répétition

Toutes les réponses s'appuient sur le mémoire (chapitre et section indiqués). Les apprendre **dans ses propres mots** : le jury attend une compréhension, pas une récitation. Une bonne réponse tient en trois temps : la réponse directe, la justification, et la limite éventuelle.

## 1. Problématique et méthodologie

**Pourquoi une plateforme propre à l'institut, alors qu'OptSolution est obligatoire ?**
OptSolution répond aux besoins de l'État : inscription, contrôle, homologation des diplômes. Elle ne prend en charge ni la communication interne (valve), ni la vie pédagogique, ni le site de l'institut. La plateforme se positionne en complément, et doit pouvoir lui transmettre ses données par des exports (ch. 1.4 et 2.2.4). Les exports au format ministériel restent une perspective : c'est pourquoi H3 n'est que partiellement vérifiée.

**Pourquoi la recherche par la conception ?**
Parce que le travail produit un artefact, la plateforme, et l'évalue par des mesures. Nous avons suivi les six étapes de Peffers et al. (2007) : problème, objectifs, conception, démonstration, évaluation, communication (introduction, 0.6.1).

**Vous n'avez pas fait d'enquête. Comment connaissez-vous les besoins ?**
Par l'analyse documentaire (dépliant, données et documents transmis par l'institut, textes officiels), l'observation directe en tant qu'étudiant, les échanges avec la direction et le support technique, et l'étude de neuf établissements congolais. Le questionnaire est prêt (annexe 1) mais n'a pas été administré : nous ne présentons donc aucun résultat d'enquête, et l'évaluation par les usagers figure en première perspective.

**Quelle différence entre méthode et technique ?**
La méthode est la démarche d'ensemble (recherche par la conception, approche systémique, développement itératif) ; les techniques sont les outils concrets de collecte et de traitement (analyse documentaire, observation, étude comparative, tests) (0.6, d'après Van Campenhoudt et al.).

**Vos hypothèses sont-elles vraiment vérifiées ?**
H1 est vérifiée en conditions simulées : il faut encore mesurer sur le réseau d'un opérateur de Bukavu. H2 est vérifiée sur le plan technique : l'adoption par les usagers reste à évaluer. H3 n'est que partiellement vérifiée (tableau 4.4).

## 2. Choix techniques

**Pourquoi une application web progressive plutôt qu'une application mobile ?**
Un seul code au lieu de deux (Android et iOS), aucune installation par un magasin d'applications, des mises à jour immédiates, et une consultation hors connexion des pages déjà vues grâce au *service worker* (2.4.3). C'est ce que mesure H1.

**Pourquoi Next.js ?**
Il produit les pages côté serveur : un contenu s'affiche même si les scripts ne se chargent pas, défaut observé sur un site universitaire congolais. Les pages publiques sont préparées à l'avance et mises en cache, donc rapides sur une connexion lente. Le même projet sert le site et les espaces, en un seul langage, TypeScript (2.4).

**Pourquoi PostgreSQL ?**
Base relationnelle libre, standard et hébergeable partout : c'est la condition de la portabilité, que nous déduisons de l'exigence d'hébergement en RDC du Code du numérique : elle permet de rapatrier les données en RDC sans réécrire l'application (2.3.2, 2.4.1).

**Pourquoi Argon2id pour les mots de passe ?**
C'est la fonction de hachage recommandée par la RFC 9106 ; elle est conçue pour résister aux attaques par force brute sur matériel spécialisé (2.3.3 et tableau 2.3).

**Que se passe-t-il si l'hébergeur ferme ou devient payant ?**
L'application ne dépend de l'hébergeur que par des composants standard (PostgreSQL) ou remplaçables (le stockage d'objets), et une sauvegarde complète a été restaurée sans aucune perte dans une base neuve (4.4.3). On peut donc changer d'hébergeur.

## 3. Conception et données

**Combien de tables, et pourquoi autant ?**
75 tables principales, plus 2 tables de liaison créées automatiquement, réparties en onze domaines : comptes, contenus, structure académique, évaluation, valve, admissions, finances, documents et stages, insertion, messagerie, Campus et notifications sur le téléphone (tableau 3.7).

**Comment le moteur de délibération a-t-il été validé ?**
Sur les notes réelles d'une promotion, préalablement anonymisées : il reproduit les seize décisions du jury (ADM, COMP, rattrapage). Le classeur d'origine mélangeait trois calculs de moyenne ; le règlement par défaut retient une moyenne pondérée par les crédits, à confirmer par l'institut (4.3.2, annexe 4 et 4.6).

**Les règles de notation sont-elles figées dans le code ?**
Non. L'arrêté du 28 août 2023 sur l'évaluation n'a pas pu être consulté ; le seuil, l'arrondi, les mentions et les règles de décision sont donc des paramètres que l'institut ajuste. Le règlement appliqué est figé dans chaque délibération à sa clôture, pour qu'un bulletin émis ne change plus (2.3.1, fig. 3.11).

**Pourquoi des identifiants aléatoires plutôt que des numéros ?**
Un numéro séquentiel révèle le nombre d'enregistrements et permet d'en deviner d'autres. Les identifiants opaques suppriment ce risque (3.4.2).

## 4. Sécurité

**Comment garantissez-vous qu'un étudiant ne voit pas les notes d'un autre ?**
Chaque page et chaque action vérifient sur le serveur l'identité, la permission et le droit sur la ressource visée, à partir de la session, jamais d'une valeur envoyée par le navigateur. Les tests de bout en bout tentent délibérément ces accès interdits et vérifient le refus (3.5.3, 4.3.3).

**Un document à code QR peut-il être falsifié ?**
On peut photocopier ou retoucher un papier, mais pas la page de vérification : le code renvoie aux données conservées par l'institut. Si le papier a été modifié, ce qu'il affiche ne correspond plus à la page de vérification. Un document peut aussi être révoqué ; la vérification l'indique alors (fig. 3.7).

**Pourquoi activer la sécurité au niveau des lignes sans aucune règle ?**
Pour fermer complètement l'interface de programmation publique de l'hébergeur : elle ne peut lire aucune donnée. Seule l'application, connectée par un canal serveur, accède à la base (3.4.2).

**Qu'a donné la revue de sécurité ?**
Deux revues. La première, sur l'ensemble du code : douze constats, dont un de gravité élevée (un gestionnaire pouvait obtenir un lien de réinitialisation pour un compte déjà actif) ; onze corrigés, le douzième vérifié sans correction. La seconde, sur les modules ajoutés ensuite (messagerie, Campus, notifications sur le téléphone, exports) : neuf constats, dont un élevé (un appareil continuait de recevoir les notifications après la déconnexion), tous corrigés (4.3.3).

**Votre politique de sécurité du contenu autorise les scripts intégrés. Pourquoi ?**
C'est un compromis nécessaire au fonctionnement du cadre d'application et au maintien du cache (4.6). Explication technique, à donner oralement : une protection par nonce rendrait toutes les pages dynamiques et supprimerait leur mise en cache, essentielle sur une connexion lente.

## 5. Tests et performance

**Que vérifient vos 320 tests ?**
203 tests unitaires sur les règles métier (moyennes, délibérations, soldes, transitions d'état, conflits d'examens, droits de la messagerie et du Campus, sécurité) et 117 tests de bout en bout sur les parcours complets et les accès interdits. Ils s'exécutent automatiquement à chaque modification du code (tableau 4.1).

**Vos mesures de performance sont simulées. Sont-elles représentatives ?**
Elles utilisent un profil de réseau mobile lent (150 ms de latence, 1,6 Mbit/s) et un processeur ralenti quatre fois. Elles donnent un ordre de grandeur : l'accueil pèse 602 Ko, environ quatre fois moins que la médiane du web mobile. Mais elles ne remplacent pas une mesure sur un téléphone à Bukavu, qui est en perspective (4.3.5, 4.6).

**Combien d'utilisateurs simultanés la plateforme supporte-t-elle ?**
Un test de charge léger a été mené sur le site en production : 280 requêtes, dix à la fois, sans aucune erreur ; une fois les pages en cache, 95 % des réponses arrivent en moins de 0,6 s, soit environ quarante pages par seconde (4.3.5). Cela dépasse largement la fréquentation attendue, mais ne remplace pas une observation lors d'un vrai pic, comme une publication de résultats.

**Qu'est-ce que WCAG 2.2 AA, et pourquoi ?**
Ce sont les règles internationales d'accessibilité du web. Niveau AA : contrastes suffisants, navigation au clavier, libellés des formulaires, etc. 74 pages analysées, aucune violation après corrections ; une vérification manuelle au clavier a complété l'analyse (4.3.4).

## 6. Cadre réglementaire

**Les données sont hébergées dans l'Union européenne. Est-ce légal ?**
L'article 201 du Code du numérique exige un hébergement en RDC, sauf autorisation de l'autorité compétente. L'institut a accepté cet hébergement faute d'offre professionnelle équivalente en RDC. C'est une limite assumée : il faut une autorisation de l'autorité de protection des données ou, à terme, une migration, que l'architecture portable rend possible (4.4.1, 4.6).

**La licence dure 4 ans à l'institut, mais 3 ans selon le décret LMD. Comment gérez-vous cela ?**
Le mémoire retient l'organisation communiquée par l'institut (4 ans, BAC1 à BAC4) et signale l'écart. Dans la plateforme, les niveaux sont des données paramétrables, pas des constantes du code.

**Comment respectez-vous les droits des personnes sur leurs données ?**
Chacun consulte ses propres données et en télécharge l'export complet depuis « Mon compte » (droit d'accès et de portabilité). Une erreur de nom, de matricule ou d'adresse est corrigée par le secrétariat (droit de rectification), et la correction est inscrite au journal avec l'état avant et après. La politique de confidentialité publiée sur le site énumère les données traitées, leurs finalités, leurs durées de conservation, les hébergeurs et ces droits (Code du numérique, articles 209 à 215). Les sauvegardes sont chiffrées et les rapports d'erreur ne contiennent aucune donnée personnelle.

**Qui a rédigé les mentions légales, la politique de confidentialité et les règles du Campus ?**
Ce travail en propose une première rédaction, établie d'après le fonctionnement réel de la plateforme et les informations transmises par l'institut. Elles sont publiées et modifiables dans l'administration ; leur validation juridique revient à l'institut (4.6, annexe 7).

## 7. Exploitation et pérennité

**Combien coûte la plateforme à l'institut ?**
La base de données, le code, les sauvegardes et la surveillance utilisent des offres gratuites, suffisantes pour le trafic d'un institut. L'hébergement de l'application utilise aujourd'hui l'offre Pro de Vercel de l'auteur, partagée avec d'autres projets ; à la passation, l'institut la reprendra ou en choisira une autre. S'y ajoutent le nom de domaine (abonnement annuel) et le courrier électronique, qui passe par le compte Resend de l'auteur (tableau 4.3). *[Oscar : compléter avec les montants réels.]*

**Qui maintiendra la plateforme après vous ?**
Le contenu (pages, filières, communiqués, rôles, règlement) est administré par le personnel, sans compétence technique. Pour le code : un seul langage, typé, des règles métier isolées et testées, des tests qui s'exécutent à chaque modification, et, dans le dépôt du projet, une documentation d'exploitation (sauvegarde, restauration, démonstration). Pour la mise en service, un guide illustré explique au personnel comment créer les comptes (invitations, listes, registre des étudiants, codes d'activation) ; il se télécharge depuis l'administration. Une passation à l'institut est prévue après la soutenance.

**Que se passe-t-il en cas de coupure d'internet ?**
Les pages personnelles déjà consultées restent lisibles hors connexion, et un bandeau signale l'absence de réseau. Les actions qui modifient des données (déposer une pièce, publier) nécessitent la connexion.

## 8. Questions pièges : rester honnête

- **« La plateforme est-elle déjà utilisée par l'institut ? »** Elle est en ligne, mais attend les données officielles (frais, programme des cours, textes juridiques) pour entrer pleinement en service. Ne pas prétendre à des utilisateurs réels.
- **« Le paiement en ligne fonctionne-t-il ? »** Non : les paiements sont enregistrés par la caisse ; la monnaie mobile est une perspective.
- **« Les sauvegardes tournent-elles ? »** Oui, chaque nuit depuis le 5 novembre 2026 : la première archive de production a été téléchargée et déchiffrée avec succès, et une restauration complète a été testée dans une base neuve.
- **« Une messagerie ne risque-t-elle pas de dériver ? »** Les annonces officielles restent sur la valve. Le Campus impose des règles acceptées avant la première publication ; un contenu signalé par trois personnes est masqué en attendant la modération, qui ne voit que les contenus signalés. Ces règles sont proposées et doivent être validées par l'institut.

## 9. Répétition

### Minutage cible (20 minutes)

| Diapositives | Partie | Durée | Cumul |
|---|---|---|---|
| 1 à 2 | Ouverture et plan | 0:50 | 0:50 |
| 3 à 5 | Contexte, contraintes, problématique | 2:30 | 3:20 |
| 6 à 7 | Hypothèses et méthodologie | 1:45 | 5:05 |
| 8 à 9 | Existant, besoins, état de l'art | 2:00 | 7:05 |
| 10 à 13 | Solution, conception, architecture, sécurité | 3:30 | 10:35 |
| 14 à 15 | Réalisation et démonstration | 5:30 | 16:05 |
| 16 à 17 | Tests et hypothèses | 2:00 | 18:05 |
| 18 à 19 | Limites, perspectives, conclusion | 1:45 | 19:50 |

Si la répétition dépasse 20 minutes, raccourcir les diapositives 3 à 9, jamais la démonstration ni la conclusion.

### Programme

1. **Première répétition, seul, chronomètre en main** : lire les notes du présentateur (dans PowerPoint, mode Présentateur), noter les diapositives trop longues.
2. **Deuxième répétition, sans notes**, à voix haute, avec la démonstration réelle.
3. **Troisième répétition devant une ou deux personnes**, qui posent des questions de la liste ci-dessus au hasard.
4. **La veille** : une répétition complète en conditions réelles (projecteur si possible), puis la liste de « La veille » du scénario de démonstration.

### Le jour J

- Arriver tôt ; tester le projecteur, le son de l'ordinateur coupé, la connexion.
- Ouvrir le diaporama en mode Présentateur ; garder le PDF sur une clé USB en secours.
- Avoir le mémoire imprimé à portée de main, pour citer une page si le jury le demande.
- Noter les questions du jury sur une feuille, et y répondre dans l'ordre.
