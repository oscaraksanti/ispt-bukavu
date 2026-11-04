# CHAPITRE 1. PRÉSENTATION DE L'ISPT-BUKAVU ET ANALYSE DE L'EXISTANT

## Introduction

Avant de concevoir un système d'information, il faut comprendre l'organisation qu'il doit servir. Un système d'information n'est pas seulement un ensemble de programmes : c'est l'ensemble des ressources qui permettent à une organisation de recueillir, traiter, conserver et diffuser l'information dont elle a besoin pour fonctionner [@reix2016]. Ce chapitre présente d'abord l'ISPT-Bukavu, son statut, sa mission et son offre de formation. Il décrit ensuite la manière dont l'institut fait aujourd'hui circuler l'information et conduit ses principaux processus, puis en dégage les forces, les faiblesses et les besoins qui orienteront la conception de la plateforme.

Toutes les informations de ce chapitre proviennent des documents remis par l'institut (dépliant officiel, données transmises pour la plateforme, horaire hebdomadaire, classeur de bulletins), des textes réglementaires et de notre observation directe. Les éléments que l'institut n'a pas communiqués sont signalés comme tels.

## 1.1. Présentation de l'institut

### 1.1.1. Historique et statut juridique

L'Institut Supérieur Pédagogique et Technique de Bukavu, en sigle ISPT-Bukavu, est un établissement public d'enseignement supérieur et universitaire. Il a été créé par l'arrêté ministériel n° 219/MINESU/CAB.MIN/MML/KOB/2010 du 8 novembre 2010. Cet arrêté a été entériné par le Professeur MASHAKO MAMBA, et la création de l'institut répond à la demande de Monseigneur François-Xavier Maroyi Rusengo, archevêque de Bukavu. L'institut est opérationnel depuis 2011 [@ispt-depliant].

En tant qu'établissement public, l'ISPT-Bukavu relève du ministère ayant l'enseignement supérieur et universitaire dans ses attributions et applique les textes qui organisent ce secteur : la loi-cadre n° 14/004 du 11 février 2014 de l'enseignement national [@loi14-004], le décret n° 22/39 du 8 décembre 2022 portant organisation et fonctionnement du système Licence-Maîtrise-Doctorat [@decret22-39] et les instructions académiques publiées chaque année par le ministère [@instruction025-2023].

Son blason, reproduit à la figure 1.1, porte la devise *Scientia splendet et conscientia*.

![Figure 1.1 : Blason de l'ISPT-Bukavu](ressources/blason.png){largeur=4}

::source ISPT-Bukavu (version vectorisée du blason officiel).

### 1.1.2. Mission

Selon son dépliant, l'institut a pour mission essentielle de former des ingénieurs en techniques appliquées aptes à intégrer les entreprises pour contribuer au développement technologique et industriel, mais aussi capables d'enseigner dans les établissements techniques afin de renforcer la qualité de l'éducation professionnelle [@ispt-depliant]. Cette double vocation, technique et pédagogique, explique son nom et la présence, dans le parcours des étudiants, de deux types de stages décrits plus loin.

### 1.1.3. Situation géographique

L'ISPT-Bukavu est situé sur l'avenue de l'Hippodrome n° 102, dans le quartier Nyawera, commune d'Ibanda, à Bukavu, chef-lieu de la province du Sud-Kivu, à proximité de la place Mulamba [@ispt-depliant]. Ses coordonnées géographiques sont 2°30'09'' de latitude sud et 28°52'18'' de longitude est [@ispt-donnees2026]. Son adresse postale est B.P. 1334 Bukavu ; l'institut est joignable par courrier électronique (ispt.bk@gmail.com), par téléphone et par WhatsApp [@ispt-depliant].

### 1.1.4. Organisation et autorités

Le dépliant cite trois autorités académiques : le Directeur Général, le Secrétaire Général Académique et le Secrétaire Général Administratif. Les enseignements sont organisés en sections, elles-mêmes subdivisées en options. La figure 1.2 reprend ces éléments. L'organigramme détaillé des services (secrétariats de section, apparitorat, caisse, bibliothèque) ne nous a pas été communiqué ; il n'est donc pas représenté.

![Figure 1.2 : Autorités académiques et sections de l'ISPT-Bukavu](figures/ch1-autorites.png){largeur=15}

::source Production personnelle, d'après le dépliant de l'institut [@ispt-depliant].

Pour la plateforme, l'institut a désigné deux personnes chargées de l'administration : le Directeur Général, qui détient le niveau le plus élevé de droits, et le CT Eric BYUMANINE, qui assure aussi le support technique aux étudiants, la formation du personnel à l'outil et le suivi des incidents. Ce sont également les deux personnes autorisées à enregistrer les paiements [@ispt-donnees2026].

### 1.1.5. Offre de formation

Le dépliant de l'institut présente quatre sections et sept options, reprises au tableau 1.1.

::tableau Tableau 1.1 : Sections et options organisées
| Section | Options |
|---|---|
| Génie Civil | Bâtiment et travaux publics (BTP) |
| Électricité | Électromécanique ; Électrotechnique |
| Électronique et Informatique | Électronique et Télécommunications ; Génie Informatique |
| Mécanique | Mécanique Générale ; Mécanique Automobile |

::source ISPT-Bukavu [@ispt-depliant].

Les études sont organisées selon le système LMD : quatre années, réparties en huit semestres, conduisent au diplôme de Licence après validation de l'ensemble des enseignements et des crédits requis [@ispt-donnees2026]. Les années d'études sont désignées par les codes BAC1 à BAC4, comme le montre l'horaire hebdomadaire reproduit plus loin [@ispt-horaire2026]. Notons que le décret n° 22/39 fixe la durée de la licence à trois ans, soit six semestres de trente crédits chacun [@decret22-39] ; l'organisation en quatre ans communiquée par l'institut est celle que nous retenons, la plateforme laissant la durée des cycles paramétrable.

Pour la plateforme, l'institut a transmis une présentation détaillée de quatre filières LMD, résumée au tableau 1.2.

::tableau Tableau 1.2 : Filières LMD présentées par l'institut
| Filière | Domaines couverts | Exemples de métiers |
|---|---|---|
| Électromécanique | Électricité industrielle, machines électriques, mécanique, automatisme, maintenance industrielle | Technicien de maintenance industrielle, technicien en automatisme, technicien en énergie solaire |
| Génie Informatique | Programmation, développement d'applications, bases de données, réseaux, systèmes d'exploitation, maintenance | Développeur web et mobile, administrateur réseaux et systèmes, gestionnaire de bases de données |
| Électronique et Télécommunications | Électronique analogique et numérique, télécommunications, fibre optique, radiocommunications | Technicien en télécommunications, technicien en fibre optique, technicien en vidéosurveillance |
| Génie Civil (BTP) | Bâtiment, routes, topographie, matériaux, géotechnique, métrés et devis, gestion de chantier | Chef de chantier, métreur, dessinateur-projeteur, technicien en topographie |

::source ISPT-Bukavu [@ispt-donnees2026].

L'écart entre les sept options du dépliant et les quatre filières détaillées s'explique par le passage progressif au système LMD ; il confirme que la liste des formations doit rester modifiable par l'institut sans intervention technique.

### 1.1.6. Stages et partenariats

L'institut organise deux types de stages [@ispt-depliant] :

- **le stage pédagogique**, effectué dans des établissements d'enseignement technique, notamment le Collège Sainte-Anne à Mbobero, le Complexe scolaire La Lune à Bagira et le Complexe scolaire Lapereaux ;
- **le stage professionnel**, obligatoire pour chaque promotion, effectué dans des entreprises et institutions telles que l'Office des Routes, la BRALIMA, le laboratoire ITFM, la centrale hydroélectrique de la SNEL, l'atelier mécanique BRAPRO et des hôpitaux.

L'institut conclut à cet effet des contrats de partenariat avec des entreprises, des usines et des ateliers pour le stage professionnel, et avec des établissements d'enseignement technique pour le stage pédagogique. Selon le dépliant, ses anciens étudiants exercent notamment à la SNEL, à la REGIDESO, dans des bureaux d'études, des réseaux de télécommunications, des banques, des hôtels, des ONG, des usines et des ministères, ainsi que dans l'enseignement technique [@ispt-depliant].

## 1.2. Analyse de l'existant

### 1.2.1. Démarche d'analyse

L'analyse de l'existant décrit le fonctionnement actuel d'une organisation afin d'en mesurer les forces et les faiblesses avant de proposer un changement. Dans une approche systémique, l'institut est considéré comme un ensemble de services (direction, secrétariats, sections, caisse, enseignants) qui échangent des informations avec leurs publics : candidats, étudiants, parents et partenaires [@reix2016].

Notre analyse repose sur trois sources :

- **les documents de l'institut** : dépliant, données transmises pour la plateforme, horaire hebdomadaire et classeur de bulletins d'une promotion ;
- **les textes réglementaires** qui encadrent l'inscription, l'évaluation et les frais ;
- **l'observation directe**, menée en tant qu'étudiant de l'institut.

Cinq processus ont été retenus parce qu'ils concernent tous les étudiants et engagent la responsabilité de l'institut : la communication officielle, les admissions et inscriptions, les horaires et l'évaluation, les frais académiques, et les documents officiels.

### 1.2.2. Communication institutionnelle

Les communiqués officiels (horaires, calendriers, convocations, listes et résultats) sont imprimés et affichés à la valve de l'institut. Ceux qui ne peuvent pas se déplacer en prennent généralement connaissance par des relais informels, dans des groupes de messagerie. La figure 1.3 schématise ce circuit.

![Figure 1.3 : Circuit actuel de diffusion d'un communiqué officiel](figures/ch1-circuit-communique.png){largeur=15.5}

::source Production personnelle, d'après notre observation.

Ce circuit présente trois limites. L'information n'atteint directement que les personnes présentes à l'institut. Les copies qui circulent en ligne ne portent aucune marque d'authenticité, si bien qu'un communiqué périmé ou modifié peut se propager sans que personne ne puisse le vérifier. Enfin, l'institut ne sait pas qui a effectivement reçu un communiqué.

L'affichage aux valves reste toutefois une exigence réglementaire pour certains actes : l'instruction académique n° 025 prévoit par exemple la proclamation des résultats de fin d'année par voie d'affichage aux valves de l'établissement [@instruction025-2023]. Un outil numérique ne peut donc pas supprimer la valve physique ; il doit la compléter.

L'institut a précisé deux règles de communication que la plateforme devra respecter : seule l'administration centrale publie les annonces adressées à tout l'institut, et la direction souhaite suivre en priorité les effectifs par filière, les taux de réussite, les revenus et impayés par période, puis l'activité de la plateforme [@ispt-donnees2026].

### 1.2.3. Admissions et inscriptions

Le dossier de candidature en première année comprend les pièces énumérées au tableau 1.3. L'institut reçoit aussi des candidatures par courrier électronique, à l'adresse ispt.bk@gmail.com [@ispt-donnees2026].

::tableau Tableau 1.3 : Pièces du dossier de candidature
| N° | Pièce |
|---|---|
| 1 | Frais d'inscription de 10 $ |
| 2 | Bulletins de 5e et 6e années des humanités |
| 3 | Diplôme d'État ou extrait du journal (palmarès) |
| 4 | Une farde chemise |
| 5 | Attestation de bonne vie et mœurs |
| 6 | Attestation de nationalité |
| 7 | Attestation d'aptitude physique |
| 8 | Attestation de naissance |

::source ISPT-Bukavu [@ispt-donnees2026].

Le dossier est constitué sur papier et déposé à l'institut, ou envoyé par courrier électronique sous forme de pièces jointes. Ces deux voies ne permettent pas au candidat de suivre l'état de son dossier ni de savoir s'il est complet ; l'institut, de son côté, doit vérifier chaque pièce à la main et ne dispose d'aucune vue d'ensemble des candidatures reçues par filière.

Les registres d'étudiants sont tenus sous forme de tableaux comportant le numéro d'ordre, le nom, le post-nom et le prénom, le sexe et le matricule [@ispt-donnees2026]. Le cadre réglementaire, quant à lui, fixe les conditions d'admission et demande aux établissements de constituer pour chaque étudiant un dossier de scolarité numérisé, le système manuel devant coexister avec le système numérique [@instruction025-2023].

### 1.2.4. Horaires, notes et délibérations

**Horaires.** L'horaire est préparé chaque semaine avec un traitement de texte. La figure 1.4 en reproduit un extrait.

![Figure 1.4 : Extrait de l'horaire hebdomadaire du 2 au 7 novembre 2026](figures/ch1-horaire.png){largeur=15.5}

::source ISPT-Bukavu [@ispt-horaire2026].

L'horaire comporte une ligne par promotion et une colonne par jour, du lundi au samedi, avec deux plages : de 8 h à 12 h et de 13 h à 16 h ; chaque case contient l'intitulé d'un cours [@ispt-horaire2026]. Ce format est lisible une fois imprimé, mais il ne permet ni à un étudiant de retrouver rapidement l'horaire de sa seule promotion, ni de détecter automatiquement un conflit de salle ou d'enseignant, ni de signaler une modification intervenue après la diffusion.

**Notes et délibérations.** Le classeur de bulletins d'une promotion de BAC1 en Électromécanique pour l'année 2023-2024, remis par l'institut, permet d'observer les règles de calcul appliquées [@ispt-bulletins]. Chaque cours (unité d'enseignement) reçoit une note sur 20 et porte un nombre de crédits, à raison de 30 crédits par semestre et 60 par année ; un cours est validé lorsque sa note atteint 10. Les moyennes sont arrondies au demi-point, et chaque note est associée à une mention, présentée au tableau 1.4.

::tableau Tableau 1.4 : Mentions observées dans les bulletins
| Mention | Note minimale | Appréciation |
|---|---|---|
| A | 18 | Excellent |
| B | 16 | Très bien |
| C | 14 | Bien |
| D | 12 | Assez bien |
| E | 10 | Passable |
| F | 8 | Insuffisant |
| G | moins de 8 | Insatisfaisant |

::source Production personnelle, d'après le classeur de bulletins de l'institut [@ispt-bulletins].

Le jury prend l'une des trois décisions suivantes : admis sans dette (ADM), admis avec dette de crédits (COMP) ou renvoyé au rattrapage. En comparant les décisions inscrites dans le classeur aux notes, nous avons dégagé une règle qui les reproduit toutes pour les seize étudiants de la promotion : l'étudiant est admis s'il n'a aucun crédit non validé ; sinon, il est admis avec dette si sa moyenne annuelle atteint 10 ; dans le cas contraire, il passe au rattrapage. Un cours non présenté compte pour zéro.

L'examen du classeur révèle aussi une fragilité. La moyenne d'un étudiant y est calculée à plusieurs endroits, selon trois formules différentes ; pour douze des seize étudiants, la moyenne du procès-verbal ne coïncide pas avec celle du bulletin. Ces écarts ne sont pas des erreurs de saisie : ils viennent de la structure même du classeur, où chaque document recalcule la moyenne à sa manière. Ils montrent qu'une règle de calcul doit être écrite une seule fois, testée, puis réutilisée par tous les documents qui en dépendent. Les règles exactes d'évaluation fixées par l'arrêté ministériel en vigueur restent à confirmer auprès du Secrétariat Général Académique.

### 1.2.5. Frais académiques

Les frais académiques des établissements publics sont fixés par le ministre ayant l'enseignement supérieur dans ses attributions [@loi14-004]. Pour l'année 2023-2024, l'instruction académique n° 025 fixait par exemple les frais d'inscription au rôle à 10 $, payables en francs congolais au compte de l'établissement, et interdisait de percevoir d'autres frais que ceux qu'elle énumère [@instruction025-2023]. Les montants applicables à l'ISPT-Bukavu pour l'année en cours ne nous ont pas été communiqués ; seuls les frais d'inscription de 10 $ figurent dans le dossier de candidature [@ispt-donnees2026].

Le suivi des paiements relève de deux personnes désignées par l'institut [@ispt-donnees2026]. Sans outil partagé, un étudiant ne peut connaître son solde qu'en se présentant à l'institut, et la direction ne dispose pas d'une vue consolidée des encaissements et des impayés, alors qu'elle en a fait l'une de ses priorités.

### 1.2.6. Documents officiels

Les relevés de cotes, attestations et autres documents académiques sont délivrés sur support papier. Le ministère exige l'usage d'imprimés et de documents sécurisés pour lutter contre la fraude et la falsification [@instruction025-2023], et le plan sous-sectoriel du numérique relève, parmi les dérives à combattre, l'émission de faux documents académiques ; il prévoit la certification des diplômes par signatures électroniques et codes QR [@pnsn-esu2021]. Aujourd'hui, un employeur ou un autre établissement qui reçoit un document de l'ISPT-Bukavu ne peut en vérifier l'authenticité qu'en s'adressant directement à l'institut.

## 1.3. Critique de l'existant

### 1.3.1. Points forts

L'analyse fait apparaître plusieurs atouts sur lesquels la plateforme pourra s'appuyer :

- **des documents de référence clairs** : le dépliant, le dossier de candidature et l'horaire suivent des formats stables, faciles à reprendre dans un outil numérique ;
- **des décisions de jury cohérentes** : les décisions observées obéissent à une règle constante, qu'il est possible de formaliser et de tester ;
- **des responsabilités identifiées** : l'institut a désigné nommément les personnes chargées de l'administration, des paiements, du support et des incidents ;
- **une exigence de sauvegarde exprimée** : l'institut demande une sauvegarde au minimum hebdomadaire et une conservation de longue durée des données des anciens étudiants [@ispt-donnees2026] ;
- **une volonté de changement** : l'institut a demandé un lancement simultané de tous les espaces dès que la plateforme serait disponible [@ispt-donnees2026].

### 1.3.2. Points faibles

Le tableau 1.5 résume les limites constatées pour chaque processus.

::tableau Tableau 1.5 : Synthèse des limites de l'existant
| Processus | Fonctionnement actuel | Limites constatées |
|---|---|---|
| Communication officielle | Affichage à la valve, relais informel en ligne | Information réservée aux personnes présentes ; copies non vérifiables ; aucune trace de réception |
| Admissions | Dossier papier ou pièces envoyées par courrier électronique | Pas de suivi pour le candidat ; vérification manuelle ; pas de vue d'ensemble par filière |
| Horaires | Document hebdomadaire de traitement de texte | Pas de vue par promotion ; conflits non détectés ; modifications non signalées |
| Notes et délibérations | Classeur de tableur par promotion | Moyennes calculées par plusieurs formules ; écarts entre procès-verbal et bulletin |
| Frais académiques | Enregistrement par deux personnes désignées | Solde inconnu de l'étudiant sans déplacement ; pas de vue consolidée pour la direction |
| Documents officiels | Délivrance sur papier | Authenticité vérifiable seulement auprès de l'institut |

::source Production personnelle.

À ces limites s'ajoutent deux contraintes transversales. D'une part, l'information publique sur l'institut repose essentiellement sur son dépliant imprimé, difficile à obtenir pour un futur candidat ou un partenaire éloigné. D'autre part, les données personnelles des étudiants circulent dans des fichiers et des messages sans contrôle d'accès, alors que le Code du numérique impose des mesures de sécurité, dont la sauvegarde et la restauration, à tout responsable de traitement [@code-numerique2023].

### 1.3.3. Besoins identifiés

De cette critique découlent les besoins auxquels la plateforme doit répondre :

1. publier en ligne les communiqués officiels, ciblés par promotion, filière ou public, datés, archivés et accompagnés d'un accusé de lecture, sans supprimer l'affichage réglementaire ;
2. permettre aux candidats de déposer leur dossier en ligne, de suivre son état et de recevoir la décision, et donner au personnel une vue d'ensemble des candidatures ;
3. présenter à chaque étudiant et à chaque enseignant son propre horaire, et signaler toute modification ;
4. calculer les moyennes et les décisions selon une règle unique, paramétrable et testée, avec un circuit de saisie, de validation et de publication des notes ;
5. permettre à chaque étudiant de consulter sa situation financière et ses reçus, et à la direction de suivre les encaissements et les impayés ;
6. délivrer des documents officiels vérifiables en ligne par un code QR ;
7. donner à l'institut un site public qu'il administre lui-même ;
8. protéger les données par des droits d'accès fondés sur les rôles, un journal des actions sensibles et des sauvegardes régulières ;
9. rester utilisable sur un téléphone d'entrée de gamme et avec une connexion lente.

## 1.4. Solution proposée

Pour répondre à ces besoins, nous proposons une plateforme web intégrée, accessible depuis un navigateur et installable sur un téléphone sous la forme d'une application web progressive. Elle réunit dans un même outil :

- un **site institutionnel** administrable, avec les formations, les actualités, l'agenda et les contacts ;
- un module d'**admissions en ligne**, du dépôt du dossier à l'inscription de l'admis ;
- une **valve numérique** de communiqués ciblés, avec accusé de lecture ;
- des **espaces personnels** pour les candidats, les étudiants et les enseignants : horaire, cours et supports, notes et résultats, frais et reçus, examens ;
- les **cotes et délibérations**, calculées selon le règlement paramétré par l'institut ;
- des **documents officiels vérifiables** par code QR ;
- une **administration** complète, avec gestion des rôles et des permissions, journal des actions et tableau de bord de la direction.

Cette plateforme ne se substitue pas aux obligations ministérielles. Elle se positionne en complément de la solution nationale imposée aux établissements publics pour la gestion académique et financière [@instruction025-2023] : elle prend en charge la communication, les services aux étudiants et la vie interne de l'institut, et doit pouvoir exporter ses données vers les plateformes nationales. Les choix qui en découlent sont discutés au chapitre 2 et détaillés au chapitre 3.

## Conclusion partielle

Ce chapitre a présenté l'ISPT-Bukavu, établissement public créé en 2010 et organisé en quatre sections, puis analysé cinq de ses processus. Il en ressort un fonctionnement fondé sur le papier, la présence physique et des fichiers isolés : l'information n'atteint pas tous ses destinataires, les documents ne sont pas vérifiables à distance et certaines moyennes sont calculées différemment d'un document à l'autre. L'institut dispose néanmoins de documents de référence clairs et de responsables désignés, sur lesquels un outil numérique peut s'appuyer.

Les besoins identifiés conduisent à proposer une plateforme web intégrée, complémentaire des outils ministériels. Avant de la concevoir, il convient de préciser les concepts qu'elle mobilise et de situer ce projet par rapport aux solutions existantes et au cadre réglementaire : c'est l'objet du chapitre suivant.
