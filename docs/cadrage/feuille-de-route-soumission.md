# Feuille de route jusqu'à la soumission

État de départ (4 novembre 2026) : les phases 0 à 11 sont en production sur https://www.isptbukavu.org. Les emails partent (Resend vérifié). La base de production est presque vide. Aucun chapitre du mémoire n'est rédigé dans la nouvelle version : le brouillon « Ver2 » porte encore sur une application mobile.

Légende :

- **[Moi]** : code, tests et documents produits pendant les sessions de travail.
- **[Oscar]** : action dans un compte en ligne (GitHub, Vercel, Sentry…) ou démarche auprès de l'institut.
- **[Institut]** : donnée officielle à fournir.

## Préalable immédiat — [Oscar]

1. Pousser le commit `6b6cc57` : `cd ~/Projet-TFC-ISPT && git push`.
2. Créer les 3 secrets GitHub qui manquent, parmi `SAUVEGARDE_BASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `SAUVEGARDE_PHRASE`. Lancer ensuite Actions → Sauvegarde → _Run workflow_. Sans ce lancement, Supabase gratuit se met en pause après 7 jours d'inactivité.

## Phase 12 — Mise en service : donner accès à tous

Objectif : chaque profil (direction, secrétariats, sections, caisse, communication, enseignants, étudiants) peut se connecter et travailler.

### Code — [Moi]

- **Assistant de démarrage** dans l'administration (`/admin/demarrage`). C'est une liste de contrôle calculée sur la base réelle : année courante, promotions, cours, enseignants, étudiants, campagne, réglages. Chaque ligne affiche son état et un lien vers l'écran concerné.
- **Invitation en masse du personnel et des enseignants** par email : import CSV avec un rôle par ligne, et relance des invitations restées sans réponse.
- **Distribution des codes d'activation des étudiants** :
  - fiches imprimables par promotion (matricule, code, adresse du site, QR vers `/activer`) ;
  - envoi par email quand l'adresse est connue.
- **Centre d'aide `/aide`** : un guide court par rôle (étudiant, enseignant, secrétariat, caisse, direction), avec captures. Il est accessible depuis chaque espace et imprimable.
- **Environnement de démonstration pour le jury**, séparé de la production :
  - un second projet Vercel et un second projet Supabase, tous deux gratuits ;
  - des données fictives clairement signalées (bandeau « Démonstration ») ;
  - des comptes de démonstration par rôle ;
  - une réinitialisation automatique chaque nuit.

  La production reste propre.

### Tests

E2E sur l'invitation, l'activation et la première connexion de chaque rôle, avec intrusion et accessibilité.

### Ce qu'il faut fournir — [Institut]

- la liste du personnel avec leurs rôles ;
- la liste des enseignants ;
- le registre des étudiants (sinon, on démarre avec la démonstration).

## Phase 13 — Inscriptions en ligne de bout en bout

Objectif : un candidat de Bukavu s'inscrit seul, du formulaire jusqu'à son espace étudiant.

### Code — [Moi]

- **Confirmation de l'adresse email** à la création du compte candidat : lien à usage unique. Cela supprime aussi l'énumération d'adresses encore possible.
- **Frais de dossier**, en v1 sans paiement en ligne :
  - montant paramétrable par campagne, laissé vide tant que l'institut ne l'a pas fixé ;
  - le candidat dépose sa preuve de paiement (bordereau, référence mobile money) ;
  - la caisse la valide, avec un reçu numéroté.
- **Emails à chaque étape** : dossier déposé, pièce rejetée, décision, inscription confirmée avec le code d'activation.
- **Parcours admis → étudiant** (`inscrireAdmis`, déjà en place) : vérification complète en production.
- **Tableau de suivi de campagne** pour la direction : dossiers par statut et par filière, délais.
- **Supports de diffusion** : affiche ou visuel avec QR vers `/candidater`.

### Tests

Parcours complet en production avec un candidat fictif, supprimé ensuite, puis E2E en CI.

### Ce qu'il faut fournir — [Institut]

- le montant des frais de dossier ;
- les pièces exigées ;
- les dates de la campagne.

## Phase 14 — Examens et calendrier académique

### Code — [Moi]

- **Sessions d'examens** : période, épreuves par cours, date, plage, salle, surveillants.
- **Contrôle des conflits** : même promotion, même salle ou même surveillant sur une même plage.
- **Vues** :
  - calendrier personnel de l'étudiant et de l'enseignant, plus une version imprimable affichée aux valves ;
  - notification à la publication et en cas de modification.
- **Calendrier académique public** : rentrée, congés, sessions.

### Ce qu'il faut fournir — [Institut]

Le calendrier académique 2026-2027.

## Phase 15 — Galerie, Anciens et insertion

### Code — [Moi]

- **Galerie publique** : albums et photos de la médiathèque, avec l'administration correspondante. Les modèles `Album` et `AlbumMedia` existent déjà.
- **Module 8 — Anciens** :
  - annuaire sur inscription volontaire des diplômés, avec consentement explicite et retrait possible ;
  - parcours des anciens ;
  - offres de stage et d'emploi publiées par l'institut ou ses partenaires.

## Phase 16 — Interopérabilité et exports

### Code — [Moi]

- **Exports normalisés** (CSV/Excel) : inscriptions, effectifs par promotion, notes et décisions de délibération. Ils sont alignés sur les rubriques attendues par OptSolution et le ministère, dans la mesure où ces formats sont documentés.
- **Export complet des données personnelles d'un étudiant**, pour le droit d'accès.

### Ce qu'il faut fournir — [Institut]

Un modèle de fichier OptSolution, si l'institut en possède un.

## Phase 17 — Exploitation et fiabilité

### [Oscar]

- Créer les comptes Sentry et UptimeRobot (gratuits).

### [Moi]

- Brancher Sentry et UptimeRobot. Le code dégrade proprement sans clé.
- Préchargement HSTS de `isptbukavu.org`.
- Test de charge léger : rentrée et publication des résultats.
- Revue de sécurité finale.
- Mise à jour des dépendances.
- Rapport qualité final.
- Essai sur de vrais téléphones à Bukavu, sur le réseau local et en mode hors ligne, avec un court compte rendu.

## Phase 18 — Intégration des données officielles et ouverture

Cette phase avance au fil des envois de l'institut.

### [Institut] — données attendues

- règlement de délibération (validé à la soumission) ;
- montants des frais ;
- programme des cours (UE, crédits, volumes) ;
- signataires et formules des attestations et relevés ;
- textes juridiques : mentions légales et confidentialité ;
- les autres points de `demande-informations-institut.md`.

### [Moi]

- Saisie ou import de ces données.
- Le panneau « à compléter » doit être vide.
- Lancement officiel : annonce, actualité, valve.

## Phase 19 — Mémoire (TFC)

À noter : le brouillon « TFC Ver2 » (environ 7 200 mots) traite d'une **application mobile multiplateforme** (Ionic, Xamarin, Flutter, React Native). Le sujet réel est désormais une **plateforme web intégrée**. Les pages liminaires et la présentation de l'ISPT sont réutilisables. Le chapitre 2 et la méthodologie sont à réécrire.

Format : Word (.docx), selon `docs/tfc/charte-de-redaction.md` et les normes de l'institut. Rédaction chapitre par chapitre, chacun relu par Oscar puis par le directeur.

### Les étapes

- **19a — Liminaires et introduction** : épigraphe, dédicace et remerciements (écrits par Oscar), sigles, listes ; problématique, hypothèses, objectifs, intérêt, méthodes (méthodologie « sans enquête »), délimitation, subdivision.
- **19b — Chapitre 1** : présentation de l'ISPT-Bukavu et analyse de l'existant (dépliant, données officielles, valve papier, bulletins Excel).
- **19c — Chapitre 2** : cadre conceptuel et état de l'art (plateformes académiques, benchmark RDC, cadre réglementaire).
- **19d — Chapitre 3** : analyse et conception (spécification, 15 diagrammes UML, modèle de données, architecture, sécurité).
- **19e — Chapitre 4** : réalisation, tests et déploiement (pile technique, captures bureau et mobile, tests, accessibilité, performance 3G, sauvegardes, coûts).
- **19f — Clôture et annexes** :
  - conclusion et perspectives ;
  - résumé et abstract ;
  - bibliographie APA 7 vérifiée source par source ;
  - annexes : manuel utilisateur, extraits de code, procédures.

## Phase 20 — Soutenance

- Diaporama, d'environ 15 à 20 diapositives.
- Scénario de démonstration minuté, sur l'environnement de démonstration.
- Vidéo de secours, au cas où le réseau tombe le jour J.
- Questions probables du jury, avec leurs réponses.
- Répétition.

## Phase 21 — Gel, passation et soumission

- Version `v1.0` étiquetée. CI verte et sauvegarde vérifiée par une restauration.
- Dossier de passation :
  - compte super-admin de l'institut, distinct de celui d'Oscar ;
  - accès Vercel, Supabase, Resend, domaine et GitHub, avec le plan de transfert ;
  - coûts annuels (domaine, Resend) ;
  - procédures d'exploitation.
- Remise : mémoire imprimé et PDF, lien du site, lien de démonstration, lettre de remise.

## Ordre conseillé

1. Phases 12 et 13 en premier : c'est ce qui rend la plateforme utilisable.
2. Le mémoire (19) avance en parallèle dès la phase 13 terminée, à raison d'un chapitre par session.
3. Ensuite les phases 14, 15, 16 et 17.
4. La phase 18 au fil des envois de l'institut.
5. Enfin les phases 20 et 21.
