# Benchmark de la présence numérique d'établissements d'enseignement supérieur en RDC

## 1. Introduction et méthode

Ce document compare ce que dix établissements d'enseignement supérieur congolais et le ministère de tutelle mettent réellement en ligne : site institutionnel, admissions, paiement, portail étudiant, résultats, e-learning, vérification de documents, application mobile. Il sert d'état de l'art pour le mémoire sur la plateforme web intégrée de l'ISPT-Bukavu.

**Date de tous les tests : 3 novembre 2026.**

**Méthode.**

1. Les domaines officiels ont été repérés par recherche web, puis confirmés en ouvrant le site. Quand un domaine cité par un annuaire ne répondait pas, d'autres variantes ont été testées et le résultat est noté.
2. Les pages d'accueil et les pages utiles (inscription, portail, e-learning, résultats) ont été chargées par requête HTTP depuis un serveur distant. Le texte des pages et la liste de leurs liens ont ensuite été analysés.
3. Pour les sites construits en JavaScript côté client (ULPGL, portail étudiant UCB), le code public livré au navigateur a été lu pour identifier les rubriques. Aucun espace protégé par mot de passe n'a été consulté.
4. Quand un site refusait l'accès, le refus a été noté tel quel. Il n'a pas été contourné.

**Conventions.**

- **[V]** : vérifié sur le site officiel le 3 novembre 2026.
- **[A]** : rapporté par un article de presse ou une source tierce, non vérifié sur le site de l'établissement.
- **Non trouvé** : aucune trace de l'information dans les pages consultées ni dans les recherches.
- **Inaccessible** : la ressource existe (lien publié par l'établissement), mais elle n'a pas répondu ou a refusé la requête lors du test.

**Limites.**

- Les tests ont été faits depuis un serveur hors RDC. Les temps de réponse et les blocages observés ne reflètent pas forcément l'expérience d'un usager à Bukavu.
- Un site « inaccessible » le 3 novembre 2026 peut fonctionner un autre jour.
- Le contenu des espaces authentifiés (notes, soldes) n'a pas été vu. Les fonctions qui y sont décrites viennent des pages publiques de connexion ou des présentations des éditeurs.
- Dans la demande initiale, « ULPGL Goma » et « Université Libre des Pays des Grands Lacs » désignent le même établissement. Le titre du site ulpgl.net le confirme [V]. Il fait donc l'objet d'une seule fiche.

## 2. Tableau comparatif

Légende : **Oui** = présent et fonctionnel au test · **Partiel** = présent mais incomplet ou incohérent · **Inacc.** = lien publié mais inaccessible au test · **NT** = non trouvé.

| Établissement | Site vitrine et actualités | Préinscription / inscription en ligne | Paiement en ligne | Portail étudiant | Résultats / notes en ligne | E-learning | Bibliothèque numérique | Vérification diplôme / carte | Application mobile |
|---|---|---|---|---|---|---|---|---|---|
| UNIKIN (Kinshasa) | Oui | Partiel (portail OptSolution, campagne affichée « non encore ouverte ») | Partiel (bordereau QR à payer en banque ; paiement en ligne annoncé par l'éditeur) | Oui (connexion OptSolution) | Oui (consultation par code, au moins une faculté) | NT | Partiel (page « Bibliothèques ») | NT | Partiel (APK Android à télécharger, hors Play Store) |
| UCB (Bukavu) | Oui | NT (bouton « S'inscrire » sans cible identifiable) | NT | Oui (Akhademie Student : évaluations, frais) | Partiel (rubrique « évaluations », derrière connexion) | Inacc. (sous-domaine e-learning en erreur 502) | Partiel (library.ucbukavu.ac.cd répond, contenu non lisible) | NT | NT |
| UOB (Bukavu) | Oui | Inacc. (préinscription annoncée, portail refusant la requête) | NT | Inacc. | Inacc. | NT | Partiel (page « Bibliothèques ») | NT | NT |
| ISP Bukavu | Partiel (site en ligne, contenus parasites) | Inacc. (lien vers un autre domaine puis IP en HTTP, délai dépassé) | NT | Partiel (page de connexion en erreur base de données) | NT | Oui (Moodle « Université Virtuelle ») | Partiel (page bibliothèque) | NT | Partiel (application Moodle proposée) |
| ISTA (Kinshasa) | Inacc. (redirection vers un hébergeur tiers, erreur 502) | NT | NT | NT | NT | NT | NT | NT | NT |
| ISPT-Kin (Kinshasa) | Partiel (contenus de gabarit non remplacés) | Partiel (formulaire à télécharger, dossier ZIP envoyé par e-mail) | NT | NT | NT | NT | NT | NT | NT |
| UNILU (Lubumbashi) | Oui | Partiel (trois adresses différentes, messages contradictoires) | NT | Oui (OptSolution) | Partiel (résultats du test d'admission publiés) | Oui (Moodle avec compte UNILU) | Partiel (pages d'information) | NT | Partiel (APK OptSolution) |
| ULPGL (Goma) | Oui (page vide sans JavaScript) | Partiel (guide d'inscription détaillé ; formulaire « UAT » inaccessible) | NT | Partiel (SGT : suivi des travaux de fin d'études) | NT | NT | Inacc. | NT | NT |
| UPC (Kinshasa) | Oui | Non (dossier physique obligatoire ; formulaire de demande d'information seulement) | Non (paiement en banque) | Partiel (« Espace professeur » CISNET, connexion par matricule) | NT | NT | Partiel (page bibliothèque) | NT | NT |
| MINESURSI (national) | Oui | NT pour l'admission en L1 | NT | — | — | Partiel (plateforme EOD listée sans lien actif) | Oui (Bibliothèque numérique nationale) | Oui (carte nationale des étudiants à QR code ; contrôle de scolarité) | NT |

## 3. Fiches par établissement

### 3.1 Université de Kinshasa (UNIKIN)

- **URL officielle** : https://www.unikin.ac.cd [V]. Le domaine sans « www » n'a pas répondu au test.
- **Site vitrine** [V] : actualités datées jusqu'au 2 novembre 2026, présentation des organes, recherche, bibliothèques, contacts. Le site est disponible en français et en anglais.
- **Inscription** [V] : la page « Inscriptions UNIKIN 2026-2027 » indique que les inscriptions « se font en ligne » à partir du 4 août 2026. Elle détaille :
  - **frais** : 150 000 FC, versés dans l'une de trois banques ;
  - **paiement** : le candidat imprime un formulaire pré-rempli avec QR code et le présente à la banque ;
  - **pièces** : titre scolaire, photo, bulletins de 4e, 5e et 6e secondaire, attestation de bonne vie et mœurs, attestation de naissance, certificat d'aptitude physique, pièce d'identité. Elles sont téléversées en PDF de 2 Mo maximum (photo en JPG ou PNG) ;
  - **contact** : e-mail et téléphone au format +243 obligatoires ;
  - **concours** : obligatoire pour les candidats sous 60 % à l'examen d'État et pour certaines facultés.
- **Plateforme OptSolution** [V] : le lien « Accéder au portail des inscriptions en ligne » mène à https://unikin.optsolution.net. Ce portail, marqué « MINESU », propose :
  - l'inscription 2026-2027 et la récupération de la fiche d'inscription ;
  - le complément de dossier, le changement de faculté et la réservation de chambre ;
  - les « paiements et bons » et un espace étudiant (historique des paiements, cursus, résultats) ;
  - la publication des résultats par code de 8 caractères (page de la Faculté des Sciences et Technologie) ;
  - une application Android distribuée en fichier APK direct (/data/OptSOlutionESU.apk), pas sur un magasin d'applications.
- **Incohérence observée** [V] : le 3 novembre 2026, la page du formulaire indique « Les inscriptions en ligne pour l'année académique 2026-2027 ne sont pas encore ouvertes ». Le communiqué du site principal annonce pourtant leur début le 4 août 2026.
- **Valves** [V] : la page d'inscription renvoie encore aux « valves des facultés » pour les dispositions pratiques du concours.
- **Antécédent** [A] : en 2020, l'École de santé publique de l'UNIKIN avait annoncé des inscriptions en ligne via son site (ACP, 30 mai 2020).
- **Ce qui manque** : e-learning, vérification publique de diplôme et application sur magasin officiel non trouvés.

### 3.2 Université Catholique de Bukavu (UCB)

- **URL officielle** : https://ucbukavu.ac.cd [V] (WordPress). La variante « www » n'a pas répondu au test.
- **Site vitrine** [V] : facultés, écoles, coopération, alumni, blog. Les articles sont datés jusqu'au 16 octobre 2026 dans le flux RSS. Un article du 8 octobre 2026 rend compte de l'examen d'admission 2026-2027 passé en présentiel au campus Mgr Mulindwa.
- **Portail étudiant** [V] : le lien « Portail » mène à https://akhademie.ucbukavu.ac.cd. Un portail étudiant distinct existe aussi : https://student.ucbukavu.ac.cd, intitulé « Akhademie Student ». Son code public contient les rubriques « Mes évaluations » et « Mes frais », ainsi qu'un changement de mot de passe. Le contenu n'a pas été consulté (connexion requise).
- **Inscription en ligne** : un bouton « S'inscrire » figure dans l'en-tête, mais aucune adresse cible n'apparaît dans le code HTML de la page. **Non vérifié.**
- **E-learning** : un bouton « E-learning » figure dans l'en-tête, sans cible identifiable dans le HTML. Le sous-domaine https://elearning.ucbukavu.ac.cd a renvoyé une **erreur 502** au test [V].
- **Bibliothèque** [V] : https://library.ucbukavu.ac.cd répond (titre « BN UCB »), mais son contenu est rendu en JavaScript et n'a pas été lu.
- **Ce qui manque** : paiement en ligne, publication publique de résultats, application mobile non trouvés.

### 3.3 Université Officielle de Bukavu (UOB)

- **URL officielle** : https://uob.ac.cd [V]. Un annuaire tiers cite aussi « univofbukavu.net » [A], non vérifié. Le webmail est hébergé sur univofbukavu.org [V].
- **Site vitrine** [V] : 8 domaines et 2 écoles, centres de recherche, cliniques universitaires, radio universitaire, publications datées de 2026.
- **Inscription** [V] : le communiqué du 25 juillet 2026 annonce l'ouverture des inscriptions 2026-2027 de L1 au doctorat.
  - Les candidats se présentent du lundi au samedi, de 8 h à 16 h, aux bureaux des sites des Cliniques universitaires et de Karhale. Les conditions d'admission sont communiquées sur place.
  - Une « préinscription en ligne » est mentionnée via le portail de l'université.
- **Portails** : les liens « Inscription » (inscription.uob.ac.cd), « Etudiant / Connexion » (lmd.uob.ac.cd) et « Authentification » redirigent tous vers le domaine lmduob.site. Celui-ci a répondu **« Requete refusee pour raison de securite » (HTTP 403)** au test. Ces portails sont donc **inaccessibles** depuis l'environnement de test ; leur fonctionnement réel n'a pas pu être constaté.
- **Ce qui manque** : paiement en ligne, e-learning, application mobile non trouvés.

### 3.4 Institut Supérieur Pédagogique de Bukavu (ISP Bukavu)

- **URL officielle** : https://ispbukavu.ac.cd [V] (adresses dg@ et sgac@ispbukavu.ac.cd affichées).
  - Les domaines cités par des annuaires ne fonctionnent pas : ispbkv.ac.cd est inexistant en DNS (NXDOMAIN) et www.ispbkv.cd ne répond pas.
- **Site vitrine** [V] : sections, organes, unités de recherche, offres LMD. Les maquettes de licence, d'agrégation et de master sont téléchargeables en PDF (versions datées de novembre 2025).
- **Espaces en ligne** [V] : le menu propose « Espace PATO », « Espace Enseignant » et « Espace Étudiant ».
  - La page de connexion étudiant affiche un **message d'erreur de connexion à la base de données** qui révèle des informations techniques internes.
  - La page de connexion enseignant renvoie une **erreur 404**.
- **Inscription en ligne** [V] : le lien « je m'inscris en LMD » pointe vers un domaine distinct (inscription.ispbukavu-ac-cd.org). Ce domaine redirige vers une **adresse IP brute en HTTP non chiffré**, qui n'a pas répondu (délai dépassé). **Inaccessible.**
- **E-learning** [V] : une plateforme Moodle « Université Virtuelle de l'ISP-Bukavu » est accessible (moodleispbkv.ispbukavu.ac.cd), avec accès anonyme possible à certains cours et lien vers l'application mobile Moodle.
- **Qualité du contenu** [V] :
  - La section « témoignages » de la page d'accueil affiche des messages manifestement automatisés : noms aléatoires et **environ 290 liens vers des sites étrangers sans rapport**. Cela signale un formulaire public publié sans modération.
  - Des restes du gabarit d'origine sont visibles : « Programming 3 Review », prix en dollars sur des fiches de filière.
- **Ce qui manque** : paiement en ligne, résultats en ligne, valve numérique non trouvés.

### 3.5 Institut Supérieur des Techniques Appliquées de Kinshasa (ISTA)

- **URL** : https://www.ista.ac.cd est cité par un annuaire tiers [A]. Au test [V], il redirige vers site.ista.myeduc.space (plateforme de l'éditeur « MyEduc 360 »), qui renvoie une **erreur 502**. Le domaine ista.ac.cd sans « www » est inexistant en DNS.
- **Présence attestée par la presse** [A] : l'ACP rapporte le lancement de travaux de nouvelles infrastructures à l'ISTA/KIN.
- **Constat** : aucun service en ligne n'a pu être vérifié le 3 novembre 2026. Le site institutionnel était **inaccessible**.

### 3.6 Institut Supérieur Pédagogique Technique de Kinshasa (ISPT-Kin)

- **URL officielle** : https://www.isptkin.ac.cd [V] (WordPress).
- **Site vitrine** [V] : mot du directeur général, sections, corps académique, guidance, quelques actualités. Les fichiers médias les plus récents sont datés de mai 2025, d'après les chemins de stockage. Le flux RSS est bloqué par un contrôle anti-robots (« Service unavailable »).
- **Admission** [V] : la page « Admission » liste les pièces du dossier.
  - **Pièces** : lettre manuscrite au SGAC, bulletins de 5e et 6e, deux copies du diplôme d'État ou de l'attestation de réussite, pièce d'identité, quatre photos, attestation de naissance, bonne vie et mœurs de moins de 3 mois, certificat d'aptitude physique délivré par l'institut.
  - **Frais** : 35 USD (60 % et plus) ou 50 USD (50 à 59 %, inscriptions spéciales), versés à la Rawbank. Ils incluent l'étude du dossier, le test d'admission, la **carte d'étudiant** et le certificat d'aptitude physique.
  - **Procédure** : télécharger un formulaire, le remplir, scanner le dossier et le bordereau bancaire, puis **envoyer une archive ZIP par e-mail** et suivre le dossier par e-mail.
- **Incohérences** [V] :
  - Le 3 novembre 2026, la page d'accueil affiche encore « Inscription 2025-2026 en cours… Inscrivez-vous ici », avec un lien vers un formulaire Google Forms.
  - Le texte de la page d'admission parle des « diplômes et bourses d'Acadrova » (texte de gabarit).
  - La page contient « Lorem ipsum », des événements fictifs de 2021 et des compteurs à « 0+ ».
- **Ce qui manque** : portail étudiant, résultats, paiement en ligne, e-learning non trouvés.

### 3.7 Université de Lubumbashi (UNILU)

- **URL officielle** : https://www.unilu.ac.cd [V] (WordPress).
- **Site vitrine** [V] : 16 facultés et écoles, revues, bibliothèques, catégorie « Inscription et enrôlement », actualités jusqu'en octobre 2026. Les résultats du test d'admission 2026-2027 sont publiés en ligne par faculté.
- **Inscription en ligne** [V] : trois adresses coexistent.
  - **unilu.optsolution.net** : la page d'accueil annonce « Inscriptions 2026-2027 ouvertes », mais la page /inscriptions affiche « pas encore ouvertes ». Le portail propose aussi un espace étudiant, une recherche de matricule et une application Android.
  - **unilusun300.com/inscription** : HTTP 403 (accès interdit).
  - **inscriptions.unilu.ac.cd** : citée dans un article de 2023, l'adresse affiche aujourd'hui une page par défaut de serveur Ubuntu (« It works! »).
- **E-learning** [V] : Moodle actif (moodle.unilu.ac.cd, intitulé « UV »), avec connexion par « Votre compte UNILU » et accès anonyme à certains cours.
- **Autres** [V] : messagerie institutionnelle (lien « E-mail »).
- **Ce qui manque** : paiement en ligne et vérification de diplôme non trouvés.

### 3.8 Université Libre des Pays des Grands Lacs (ULPGL, Goma)

- **URL officielle** : https://www.ulpgl.net [V]. ulpgl.ac.cd répond aussi, avec le même titre.
- **Architecture** [V] : application React rendue entièrement côté client. Sans JavaScript, la page ne contient que « You need to enable JavaScript to run this app ».
- **Guide d'inscription 2026-2027** [V] : rubrique /guide-inscription du site, chargée dynamiquement depuis l'API publique du site.
  - **Frais selon le pourcentage à l'examen d'État** : 50 USD (50-59 %, concours inclus), 40 USD (60-69 %), 20 USD (70 % et plus). L'inscription spéciale coûte 70 USD (licence, master) ou 200 USD (doctorat). La médecine a un barème distinct.
  - **Dossier** : lettre manuscrite au SGAC, deux copies du diplôme d'État ou de l'attestation de réussite, bulletins des 2e, 3e et 4e années secondaires, carte d'identité, attestations de naissance et de bonne conduite, attestation d'aptitude physique délivrée par le centre hospitalier de l'ULPGL.
  - **Données saisies au guichet** : identité, parents, groupe sanguin, origine, parcours secondaire (n° du diplôme, %, section), personne de contact, 1er et 2e choix de faculté.
- **Services liés** :
  - « Demander une inscription » mène à uat.ulpgl.net/UATApplication : **inaccessible** au test.
  - « TFE / SGT » mène à https://sgt.ulpgl.net [V] : système de suivi des travaux de fin d'études avec connexion enseignant ou étudiant (Faculté des sciences et technologies appliquées).
  - « Plaintes » (plaintes.ulpgl.net) et bibliothèque (bibliotheque.ulpgl.net) : **inaccessibles** au test.
- **Ce qui manque** : paiement en ligne, résultats en ligne, e-learning et application mobile non trouvés.

### 3.9 Université Protestante au Congo (UPC, Kinshasa)

- **URL officielle** : https://www.upc.ac.cd [V].
- **Site vitrine** [V] : site récent et soigné. Il comprend un bandeau de communiqué (rentrée fixée au 19 octobre 2026), des pages facultés, formations, recherche, documents et agenda, une page accessibilité et une inscription à une lettre d'information.
- **Admission** [V] : les inscriptions 2026-2027 vont du 13 juillet au 15 septembre 2026.
  - **Procédure en quatre étapes** : dépôt du dossier physique à l'Apparitorat central (« obligatoire »), lettre de recommandation religieuse, concours par faculté, confirmation par paiement de 50 USD à la Rawbank.
  - **Seuil** : 60 % à l'examen d'État ; concours obligatoire en médecine.
  - Les épreuves du concours sont publiées par faculté.
  - Le bouton « Candidater » mène à cette page d'information ; seul un formulaire de demande d'information est en ligne.
- **Portail** [V] : « Espace professeur » sur https://upc-cisnet.com/login (connexion par e-mail ou matricule). Aucun espace étudiant public n'a été identifié.
- **Ce qui manque** : candidature en ligne, paiement en ligne, résultats et e-learning non trouvés.

### 3.10 Ministère de l'ESURSI (plateformes nationales)

Le ministère s'appelle désormais Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations (ESURSI). minesu.gouv.cd redirige vers https://minesursi.gouv.cd [V]. Les anciens domaines esu.gouv.cd et www.esu.gouv.cd n'ont pas répondu.

Sa page « Portail » [V] liste 12 plateformes. État au test :

| Plateforme | Adresse | Objet déclaré | État au test |
|---|---|---|---|
| Bibliothèque numérique nationale | bnn.minesursi.gouv.cd | Ressources documentaires | Répond [V] |
| Plateforme EOD | (lien « # ») | Enseignement ouvert à distance | Pas de lien actif [V] |
| Esursi-Recherche (PRISM-RDC) | re.minesursi.gouv.cd | Publications, centres de recherche | Répond [V] |
| Esursi-TraceEnseignants | enseignants.minesursi.gouv.cd | Registre d'identification des professeurs | Répond [V] |
| Esursi-PayQuotités | finance.minesursi.gouv.cd | Contrôle des quotités (gouvernance financière) | Répond [V] |
| Esursi-Equivalence | equiv.minesursi.gouv.cd | Équivalence de diplômes | Répond [V] |
| Esursi-Transfert | transfert.minesursi.gouv.cd | Demandes de transfert | Répond [V] |
| Esursi-Carte (« ESURSI Connect ») | carte.minesursi.gouv.cd | Carte nationale des étudiants | Répond [V] |
| Esursi-Bourse | bourse.minesursi.gouv.cd | Candidature aux bourses | Répond [V] |
| SIPAQ-ESU | ev.minesursi.gouv.cd | Pilotage et assurance qualité, rapports des établissements | Répond [V] |
| Esursi-Scolarité | controle.minesursi.gouv.cd | Système national de contrôle de scolarité | Répond [V] |
| Esursi-TraceApprenants (PRIA-RDC) | apprenant.minesursi.gouv.cd | Recensement DEA/DES, master, doctorat | Répond [V] |

Points saillants [V] :

- **Carte nationale des étudiants** :
  - QR code unique relié à une base nationale, avec vérification publique « Vérifier une carte ».
  - Les établissements agréés importent leurs listes en Excel/CSV et génèrent les cartes recto-verso.
  - Le ministère dispose de statistiques par province, cycle et domaine.
- **Contrôle de scolarité** :
  - Quatre profils : ministère, agent de contrôle, établissement, étudiant.
  - Recherche publique du statut d'un étudiant par numéro national ou par établissement et filière.
  - Compteurs affichés : 1 557+ établissements, 6 818+ étudiants enregistrés, 1+ mission planifiée. Ces chiffres suggèrent un déploiement encore partiel.
- **PRIA-RDC** : 7 361 apprenants de troisième cycle enregistrés, avec fiche imprimable.
- **Vérification des diplômes d'État** [A] :
  - Le 22 août 2024, les ministres de l'Éducation nationale et de l'ESU ont travaillé sur l'interconnexion entre la plateforme de gestion utilisée par les établissements (« Optsolution ») et la base de l'examen d'État. Le but est de vérifier automatiquement les diplômes et attestations de réussite lors des admissions, d'abord dans le public (Actualite.cd, 23 août 2024).
  - Le caractère obligatoire annoncé n'a pas été confirmé.
  - Une autre initiative, « e-Diplôme », est rapportée par CIO Mag ; le domaine e-diplome.cd a renvoyé une erreur 400 au test.
- **Non trouvé** : aucune plateforme nationale de préinscription en première année n'est listée sur le portail. L'outil OptSolution, utilisé par l'UNIKIN et l'UNILU, porte la mention « MINESU » mais est exploité établissement par établissement.

**Contexte Kivu (directement pertinent pour Bukavu)** [V] :

- **Communiqué du 27 août 2026** : le Gouvernement annonce des « mesures conservatoires, ciblées et temporaires » visant **onze établissements publics de Goma et Bukavu**, à la suite de l'ingérence de l'AFC/M23 dans leur gestion. Le ministère précise ensuite qu'il ne s'agit pas d'une fermeture générale de l'enseignement supérieur au Nord et au Sud-Kivu. La liste des onze établissements n'a pas été trouvée dans les documents consultés.
- **Note circulaire n° 039 du 9 octobre 2026** sur les étudiants et personnels déplacés :
  - un point focal par établissement ;
  - pas de rejet automatique d'un dossier pour perte de documents ;
  - interdiction d'exiger un second paiement de frais de même nature déjà payés ;
  - exonération des pénalités liées au déplacement ;
  - toute reconnaissance de paiement ou exonération doit être « motivée, chiffrée et consignée dans un registre ».

## 4. Circuit d'inscription en RDC (synthèse des sources consultées)

Aucun texte réglementaire national (instruction académique) décrivant le circuit d'inscription n'a été trouvé en ligne : **non trouvé**. La synthèse ci-dessous recoupe donc les procédures publiées par cinq établissements (UNIKIN, ISPT-Kin, ULPGL, UPC, UOB), toutes vérifiées sur leurs sites le 3 novembre 2026.

1. **Annonce** : un communiqué du Secrétaire général académique ouvre la campagne. Exemples : 4 août 2026 à l'UNIKIN, 25 juillet 2026 à l'UOB, du 13 juillet au 15 septembre 2026 à l'UPC.
2. **Constitution du dossier**. Les pièces récurrentes sont :
   - le diplôme d'État ou l'attestation de réussite (en copies certifiées) ;
   - les bulletins du secondaire (selon l'établissement : 4e à 6e, 5e et 6e, ou 2e à 4e années) ;
   - l'attestation de naissance et l'attestation de bonne vie et mœurs (ou de bonne conduite) ;
   - le certificat d'aptitude physique, souvent délivré par l'établissement ou son hôpital ;
   - une pièce d'identité, des photos d'identité et une lettre manuscrite adressée au SGAC.
   S'y ajoutent selon les cas une recommandation religieuse (UPC, ULPGL en théologie) et, pour l'inscription spéciale, les relevés de cotes antérieurs.
3. **Seuil et concours** : le seuil de **60 % à l'examen d'État** revient partout (UNIKIN, ISPT-Kin, UPC, ULPGL). En dessous, ou pour certaines filières (médecine, polytechnique), un concours d'admission est organisé par faculté.
4. **Paiement** : les frais sont **toujours versés en banque** (Rawbank, Equity BCDC, Access Bank cités) contre bordereau. Aucun établissement étudié ne propose un paiement mobile money en ligne vérifiable. Les frais d'inscription observés vont d'environ 20 à 70 USD selon le pourcentage et le type d'inscription, ou 150 000 FC à l'UNIKIN.
5. **Dépôt et vérification** : le dépôt physique reste la norme (UPC « obligatoire », UOB « sur place »). Le numérique intervient de trois façons :
   - un formulaire en ligne avec pièces téléversées (UNIKIN) ;
   - un envoi par e-mail d'un ZIP (ISPT-Kin) ;
   - une préinscription en ligne annoncée (UOB, ULPGL).
   Selon la presse [A], la vérification des diplômes d'État prenait « 4 à 5 mois », ce qui a motivé le projet d'interconnexion avec la base de l'examen d'État.
6. **Carte d'étudiant** : elle est incluse dans les frais à l'ISPT-Kin. Au niveau national, la carte à QR code est générée par l'établissement depuis la plateforme ESURSI Connect.
7. **Enrôlement aux examens** : la notion apparaît dans une catégorie du site de l'UNILU (« Inscription et enrôlement »). Aucune source n'en décrit la procédure : **non trouvé**.
8. **Publication des résultats** : elle se fait encore par voie d'affichage aux **valves** (l'UNIKIN y renvoie pour le concours). L'éditeur OptSolution présente la publication en ligne et par SMS comme le moyen d'éviter « l'encombrement dans les valves » [V, site de l'éditeur]. Le même site cite un témoignage selon lequel l'accès aux résultats est conditionné au paiement des frais.

## 5. Enseignements pour la plateforme ISPT-Bukavu

1. **Le circuit reste hybride, et la plateforme doit l'assumer.** Aucun établissement étudié ne dématérialise entièrement l'inscription : la banque et le dossier physique restent la règle. La valeur ajoutée réaliste est une préinscription en ligne qui comprend :
   - le téléversement de pièces aux formats et poids bornés (le modèle UNIKIN : PDF de 2 Mo maximum) ;
   - une fiche pré-remplie imprimable avec référence ou QR code à présenter à la banque ;
   - le téléversement du bordereau ;
   - un suivi de l'état du dossier visible par le candidat.
2. **Une seule source de vérité pour l'état d'une campagne.** Bannières périmées (ISPT-Kin) et messages contradictoires entre pages (UNIKIN, UNILU) sont fréquents. L'ouverture et la clôture des inscriptions doivent venir d'un paramètre daté unique qui pilote tous les affichages.
3. **Un point d'entrée unique.** L'UNILU expose trois adresses d'inscription, l'ISP Bukavu renvoie vers un autre domaine puis une adresse IP en HTTP, et l'ULPGL a quatre sous-domaines dont trois inaccessibles. Garder les services sous le domaine institutionnel, en HTTPS, réduit la confusion et le risque d'hameçonnage.
4. **La sécurité de base fait défaut chez les voisins.**
   - Message d'erreur de base de données exposé et témoignages non modérés remplis de liens indésirables (ISP Bukavu).
   - Portails qui bloquent les visiteurs légitimes ou répondent en erreur (UOB, UCB e-learning, ISTA).
   Exigences qui en découlent : modération de tout contenu public soumis, pages d'erreur génériques, journalisation côté serveur, supervision de disponibilité.
5. **La sobriété technique est un argument.** Un site rendu uniquement en JavaScript affiche une page vide si le script ne charge pas (ULPGL). Avec une connectivité instable, un rendu côté serveur, des pages légères et un mode dégradé sont des différenciateurs concrets.
6. **La valve numérique répond à un besoin attesté.** Les établissements renvoient encore aux valves physiques (UNIKIN) et un éditeur national en fait un argument commercial. Une valve numérique de communiqués datés, archivés, catégorisés et téléchargeables en PDF n'existe dans aucun des sites étudiés sous cette forme.
7. **Conditionner les résultats au paiement est une décision de l'institution.** L'accès aux résultats subordonné au paiement est observé chez un éditeur. C'est une règle de gestion à faire trancher par l'institution, pas un choix technique par défaut.
8. **Prévoir l'interopérabilité avec les plateformes nationales.** Le ministère déploie une carte nationale à QR code alimentée par import Excel/CSV, un contrôle de scolarité par numéro national et des plateformes de transfert et d'équivalence. La plateforme devrait :
   - stocker un identifiant national de l'étudiant lorsqu'il existe ;
   - exporter des listes au format attendu ;
   - ne pas dupliquer la vérification des diplômes d'État, à interconnecter si l'accès est ouvert.
9. **Le contexte de Bukavu crée des besoins propres.** La circulaire du 9 octobre 2026 impose des pratiques qu'un système de gestion peut outiller :
   - accueil d'étudiants déplacés sans pièces complètes ;
   - reconnaissance de paiements déjà faits ailleurs ;
   - exonérations motivées et consignées dans un registre.
   Concrètement : un statut « dossier incomplet en vérification », des ajustements financiers justifiés et un journal d'audit.
10. **L'e-learning existe déjà sous Moodle** (UNILU, ISP Bukavu). L'espace enseignant de la plateforme doit se positionner : soit intégrer ou lier un Moodle existant, soit offrir des fonctions plus simples (supports de cours, devoirs, communiqués de cours) sans prétendre remplacer un LMS complet.
11. **Les portails étudiants les plus aboutis restent fermés et monofonctionnels** : frais et évaluations à l'UCB, suivi des TFE à l'ULPGL, espace professeur à l'UPC. Réunir site public, admissions, valve, espace étudiant et espace enseignant dans un même outil cohérent n'a été observé dans aucun établissement de l'échantillon.

## 6. Sources

Toutes les sources ont été consultées le 3 novembre 2026.

### Sites et pages des établissements

- Université de Kinshasa. (2026). *Inscriptions UNIKIN 2026-2027*. https://www.unikin.ac.cd/inscriptions, consulté le 3 novembre 2026.
- Université de Kinshasa. (2026). *Université de Kinshasa* [page d'accueil]. https://www.unikin.ac.cd/, consulté le 3 novembre 2026.
- Université de Kinshasa et OptSolution. (2026). *Université de Kinshasa – Plateforme universitaire digitale RDC*. https://unikin.optsolution.net/, consulté le 3 novembre 2026.
- Université de Kinshasa et OptSolution. (2026). *Inscription en ligne 2026-2027*. https://unikin.optsolution.net/demande-d-inscription-en-ligne-2026-2027, consulté le 3 novembre 2026.
- Université de Kinshasa et OptSolution. (2026). *Espace étudiant – Connexion*. https://unikin.optsolution.net/student/connexion, consulté le 3 novembre 2026.
- Université de Kinshasa et OptSolution. (2026). *Publication des résultats de session*. https://unikin.optsolution.net/publication-resultat-session, consulté le 3 novembre 2026.
- Université Catholique de Bukavu. (2026). *Étudiants*. https://ucbukavu.ac.cd/etudiants/, consulté le 3 novembre 2026.
- Université Catholique de Bukavu. (2026, 8 octobre). *Examen d'admission 2026-2027*. https://ucbukavu.ac.cd/examen-dadmission-2026-2027/, consulté le 3 novembre 2026.
- Université Catholique de Bukavu. (s.d.). *Akhademie Student* [portail étudiant]. https://student.ucbukavu.ac.cd/, consulté le 3 novembre 2026.
- Université Catholique de Bukavu. (s.d.). *Akhademie* [portail]. https://akhademie.ucbukavu.ac.cd/, consulté le 3 novembre 2026.
- Université Catholique de Bukavu. (s.d.). *E-learning* [sous-domaine, erreur 502 au test]. https://elearning.ucbukavu.ac.cd/, consulté le 3 novembre 2026.
- Université Officielle de Bukavu. (2026, 25 juillet). *UOB : ouverture des inscriptions pour l'année académique 2026-2027*. https://uob.ac.cd/publication/uob-ouverture-des-inscriptions-pour-lannee-academique-2026-2027-1, consulté le 3 novembre 2026.
- Université Officielle de Bukavu. (s.d.). *Inscription* [portail, accès refusé au test]. https://inscription.uob.ac.cd, consulté le 3 novembre 2026.
- Institut Supérieur Pédagogique de Bukavu. (s.d.). *ESU : ISP/Bukavu* [page d'accueil]. https://ispbukavu.ac.cd/, consulté le 3 novembre 2026.
- Institut Supérieur Pédagogique de Bukavu. (s.d.). *Connexion compte étudiant*. https://ispbukavu.ac.cd/ispespaceetudiant/ispetudiantlogin.php, consulté le 3 novembre 2026.
- Institut Supérieur Pédagogique de Bukavu. (s.d.). *Université Virtuelle de l'ISP-Bukavu* [Moodle]. https://moodleispbkv.ispbukavu.ac.cd/isptice/login/index.php, consulté le 3 novembre 2026.
- Institut Supérieur des Techniques Appliquées. (s.d.). *ISTA* [site, erreur 502 au test]. https://www.ista.ac.cd, consulté le 3 novembre 2026.
- Institut Supérieur Pédagogique Technique de Kinshasa. (s.d.). *ISPT-KIN* [page d'accueil]. https://www.isptkin.ac.cd/, consulté le 3 novembre 2026.
- Institut Supérieur Pédagogique Technique de Kinshasa. (s.d.). *Admission*. https://www.isptkin.ac.cd/inscription/, consulté le 3 novembre 2026.
- Université de Lubumbashi. (2026). *Université de Lubumbashi* [page d'accueil]. https://www.unilu.ac.cd/, consulté le 3 novembre 2026.
- Université de Lubumbashi. (2026). *Archives des Inscription et enrôlement*. https://www.unilu.ac.cd/category/inscription-et-enrolement/, consulté le 3 novembre 2026.
- Université de Lubumbashi. (2026). *Résultats du test d'admission pour l'année académique 2026-2027*. https://www.unilu.ac.cd/resultats-du-test-dadmission-pour-lannee-academique-2026-2027/, consulté le 3 novembre 2026.
- Université de Lubumbashi et OptSolution. (2026). *Université de Lubumbashi (UNILU) – Inscription 2026-2027*. https://unilu.optsolution.net/, consulté le 3 novembre 2026.
- Université de Lubumbashi et OptSolution. (2026). *Inscription en ligne 2026-2027*. https://unilu.optsolution.net/inscriptions, consulté le 3 novembre 2026.
- Université de Lubumbashi. (s.d.). *UV – Se connecter sur le site* [Moodle]. https://moodle.unilu.ac.cd/login/index.php, consulté le 3 novembre 2026.
- Université Libre des Pays des Grands Lacs. (2026). *Guide d'inscription 2026-2027*. https://www.ulpgl.net/guide-inscription, consulté le 3 novembre 2026.
- Université Libre des Pays des Grands Lacs. (s.d.). *SGT – ULPGL*. https://sgt.ulpgl.net/, consulté le 3 novembre 2026.
- Université Protestante au Congo. (2026). *Admission – Inscriptions 2026-2027*. https://www.upc.ac.cd/admission, consulté le 3 novembre 2026.
- Université Protestante au Congo. (s.d.). *Bienvenue sur Cisnet – UPC*. https://upc-cisnet.com/login, consulté le 3 novembre 2026.

### Ministère et plateformes nationales

- Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations. (2026). *Portail numérique – ESURSI*. https://minesursi.gouv.cd/?portail, consulté le 3 novembre 2026.
- Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations. (s.d.). *ESURSI Connect – Carte nationale des étudiants*. https://carte.minesursi.gouv.cd/, consulté le 3 novembre 2026.
- Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations. (2026). *Système national de contrôle de scolarité*. https://controle.minesursi.gouv.cd/, consulté le 3 novembre 2026.
- Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations. (2026). *PRIA-RDC – Plateforme de recensement et d'identification des apprenants*. https://apprenant.minesursi.gouv.cd/, consulté le 3 novembre 2026.
- Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations. (2026). *SIPAQ-ESU – Plateforme nationale de pilotage et d'assurance qualité*. https://ev.minesursi.gouv.cd/, consulté le 3 novembre 2026.
- Gouvernement de la République démocratique du Congo. (2026, 27 août). *Communiqué : Le Gouvernement protège les parcours académiques des étudiants et refuse que l'Enseignement supérieur devienne un butin de guerre*. https://minesursi.gouv.cd/images/COMMUNIQUE___-_Le_Gouvernement_prote__ge_les_parcours_acade__miques_des_e__tudiants_et_refuse_que_l___Enseignement_supe__rieur_devienne_un_butin_de_guerre_ecf019a4f36ae90c.pdf, consulté le 3 novembre 2026.
- Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations. (2026). *ESURSI : le Gouvernement renforce les mesures de solidarité envers les étudiants et personnels déplacés de l'Est de la RDC*. https://minesursi.gouv.cd/?info&id_art=371, consulté le 3 novembre 2026.
- Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations. (2026, 17 octobre). *Occupation du Nord-Kivu et du Sud-Kivu : le Ministère de l'ESURSI précise la portée de ses mesures et répond à l'Archevêque de Bukavu*. https://minesursi.gouv.cd/?info&id_art=372, consulté le 3 novembre 2026.

### Éditeurs de solutions

- OptSolution. (s.d.). *Digitalisez vos services académiques grâce à OptSolution*. https://optsolution.net/, consulté le 3 novembre 2026.
- MyEduc 360. (s.d.). *MyEduc 360 – Gestion d'établissements éducatifs*. https://myeduc.space/, consulté le 3 novembre 2026.

### Articles de presse (informations rapportées, non vérifiées sur les sites des établissements)

- Actualite.cd. (2024, 23 août). *RDC : mise en place « imminente » d'une solution numérique « Optsolution » pour lutter contre les « faux diplômes et attestations de réussite » lors des admissions*. https://actualite.cd/2024/08/23/rdc-mise-en-place-imminente-dune-solution-numerique-optsolution-pour-lutter-contre-les, consulté le 3 novembre 2026.
- Digital Business Africa. (2024). *RD Congo : la plateforme numérique « OptSolution » lancée pour vérifier instantanément les faux diplômes*. https://www.digitalbusiness.africa/rd-congo-la-plateforme-numerique-optsolution-lancee-pour-verifier-instantanement-les-faux-diplomes, consulté le 3 novembre 2026.
- CIO Mag. (s.d.). *RDC : « e-Diplôme », une plateforme numérique dédiée à la vérification des diplômes*. https://cio-mag.com/rdc-e-diplome-une-plateforme-numerique-pour-la-verification-des-diplomes/, consulté le 3 novembre 2026.
- Agence Congolaise de Presse. (2020, 30 mai). *L'École de santé publique de l'UNIKIN annonce les inscriptions en ligne via son site*. https://acp.cd/nation/lecole-de-sante-publique-de-lunikin-annonce-les-inscriptions-en-ligne-via-son-site/, consulté le 3 novembre 2026.
- Agence Congolaise de Presse. (s.d.). *Lancement des travaux de construction de nouvelles infrastructures à l'ISTA/KIN*. https://acp.cd/nation/lancement-des-travaux-de-construction-de-nouvelles-infrastructures-a-lista-kin/, consulté le 3 novembre 2026.
- Mabumbe. (s.d.). *Institut supérieur de techniques appliquées de Kinshasa – Online application*. https://mabumbe.com/kb/?p=2569, consulté le 3 novembre 2026.
