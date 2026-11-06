# Présentation du travail et du dossier : script de la voix off

**Vidéo : `Presentation-ISPT-Bukavu-a-commenter.mp4` (6 min 56). Destinataires : la direction et l'administration de l'ISPT-Bukavu, lors de la remise du dossier.**

La vidéo enchaîne trois parties : une présentation du travail (cartons), la démonstration de la plateforme (données fictives), puis le dossier remis et la suite (cartons). Les minutages correspondent aux images. Lis calmement : environ deux mots et demi par seconde suffisent, et chaque passage laisse un peu de marge. Les barres obliques ( / ) marquent une courte respiration.

Pour la produire : `RACINE_WEB=<web avec node_modules> node docs/tfc/soutenance/presentation-commentee.mjs`. Si une durée de carton change dans ce script de montage, mets à jour les minutages ci-dessous.

---

## Partie 1 · Le travail

### 0:00 – 0:10 · Ouverture

> Monsieur le Directeur général, / chers membres de l'administration, / je vous présente la plateforme numérique de l'ISPT-Bukavu, / réalisée dans le cadre de mon travail de fin de cycle.

### 0:10 – 0:32 · Le constat

> Aujourd'hui, l'information officielle est affichée à la valve, / puis relayée de groupe en groupe. / Les démarches se font sur papier et au guichet, / et un document délivré par l'institut ne peut pas être vérifié à distance. / Tout cela, avec une connexion souvent faible et coûteuse.

### 0:32 – 0:56 · La réponse

> D'où l'idée d'un outil unique, / administré par l'institut lui-même. / Il réunit le site de l'institut, / les admissions en ligne, / une valve numérique ciblée, / des espaces pour les étudiants, les enseignants et les candidats, / la gestion des notes, des délibérations, des examens et des frais, / et des documents vérifiables par code QR. / Elle est déjà en ligne, / à l'adresse www.isptbukavu.org.

### 0:56 – 1:12 · La démarche

> J'ai d'abord analysé cinq processus de l'institut / et comparé neuf établissements congolais. / J'ai tenu compte du système LMD et du Code du numérique, / puis j'ai conçu et réalisé la plateforme par étapes, / en la vérifiant par plus de trois cents tests automatiques.

### 1:12 – 1:18 · Démonstration

> Voyons-la maintenant en action, / avec des données fictives.

---

## Partie 2 · La démonstration

### 1:18 – 1:34 · Le site de l'institut

> Tout commence par le site public. / Il présente l'institut, ses sections et ses filières, ses actualités. / Et c'est l'institut qui le met à jour, / depuis son administration, / sans dépendre d'un informaticien.

### 1:34 – 1:43 · Une filière

> Chaque filière a sa fiche : / sa présentation et ses débouchés.

### 1:43 – 1:53 · Les admissions

> La page des admissions donne les conditions, / les pièces à fournir, / et permet de candidater en ligne.

### 1:53 – 2:12 · Le candidat

> Le candidat se connecte / et retrouve son dossier. / Il voit les pièces exigées par la campagne, / les dépose en ligne, / et suit l'état de sa candidature sans se déplacer.

### 2:12 – 2:36 · L'enseignant

> Voici maintenant l'espace d'un enseignant. / Il ne voit que les cours qui lui sont confiés. / Pour chaque cours, il crée ses évaluations / et saisit les notes dans une grille. / Une fois la saisie terminée, / il transmet les notes au secrétariat académique.

### 2:36 – 3:06 · Le secrétariat académique

> Le secrétariat reçoit les évaluations transmises. / Il contrôle les notes, / les valide, / puis les publie. / C'est seulement à ce moment-là que les étudiants les voient, / et ils en sont aussitôt avertis. / Une note n'est jamais visible avant sa publication.

### 3:06 – 3:24 · L'étudiante

> Côté étudiant, / la cloche signale la note qui vient d'être publiée. / L'étudiante retrouve ses notes et la moyenne de chaque cours. / Elle ne voit que les siennes.

### 3:24 – 3:49 · Le Campus

> Le Campus est l'espace d'échange de l'institut. / Avant sa première publication, / chacun lit et accepte les règles du Campus et de la messagerie. / On y trouve les publications épinglées par l'institut, / et les questions et réponses entre étudiants. / La valve, elle, reste le canal officiel.

### 3:49 – 4:33 · La messagerie

> La messagerie remplace les groupes informels. / Chaque promotion et chaque cours ont leur groupe, / créé automatiquement à partir des inscriptions : / personne n'est oublié. / Voici le groupe de la promotion. / Un enseignant peut aussi écrire en privé à un étudiant, / comme ici. / En cas d'abus, un message peut être signalé : / les modérateurs ne voient que les contenus signalés, / jamais le reste des conversations.

### 4:33 – 4:50 · La direction

> La direction dispose d'un tableau de bord de pilotage : / effectifs, / notes publiées, / situation financière et admissions, / à jour en temps réel.

### 4:50 – 5:04 · La demande d'un document

> Revenons à l'étudiante. / Elle demande en ligne une attestation de fréquentation, / sans passer au guichet.

### 5:04 – 5:32 · L'émission du document

> La demande arrive au secrétariat académique, / qui émet le document. / L'attestation est prête à imprimer. / Elle porte un code QR de vérification. / Une fois émise, elle ne peut plus être modifiée.

### 5:32 – 5:44 · La vérification

> Et n'importe qui, / un employeur ou une autre université, / lit ce code QR / et vérifie en quelques secondes que le document est authentique.

---

## Partie 3 · Le dossier remis

### 5:44 – 6:18 · Ce que l'institut reçoit

> Je vous remets aujourd'hui l'ensemble du travail. / Le dossier contient la lettre de remise, / la fiche des données et des décisions attendues, / le mémoire, / le support de la soutenance, / les vidéos de présentation, / le guide de création des comptes pour les services, / le dossier de passation avec les procédures d'exploitation, / et le code source de la plateforme. / Il ne contient aucun mot de passe. / La phrase qui protège les sauvegardes vous est remise à part, / sous pli fermé.

### 6:18 – 6:44 · La suite

> Pour ouvrir la plateforme aux étudiants, / quelques décisions de l'institut sont nécessaires : / désigner l'administrateur et les responsables des services, / transmettre les données officielles, / comme le programme des cours, les frais et le calendrier, / valider les textes proposés et le règlement de délibération, / et planifier le transfert des comptes à l'institut. / Tout cela est détaillé dans la fiche jointe.

### 6:44 – 6:56 · Merci

> La plateforme est à votre disposition / à l'adresse www.isptbukavu.org. / Je reste disponible pour accompagner sa prise en main. / Merci.

---

## Enregistrer la voix

- Enregistre-toi au téléphone, dans une pièce calme, à environ vingt centimètres du micro, en lisant ce texte pendant que la vidéo tourne sur l'ordinateur.
- Une seule prise par partie suffit. Si tu te trompes, marque une pause de deux secondes et reprends la phrase depuis le début.
- Envoie-moi le fichier audio (m4a ou mp3) : je le cale sur la vidéo, j'ajoute les sous-titres et je produis la version finale.
