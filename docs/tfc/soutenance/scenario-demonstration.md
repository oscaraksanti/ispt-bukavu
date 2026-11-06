# Scénario de la démonstration (5 minutes)

La démonstration se fait sur l'**instance de démonstration** (données fictives, mode `NEXT_PUBLIC_MODE_DEMO=1`), jamais sur la production. Mot de passe commun : `Demo-ISPT-2026` (voir `docs/exploitation/demonstration.md`).

> **Adresse :** https://demo.isptbukavu.org (en ligne depuis le 6 novembre 2026 ; données remises à zéro chaque nuit à 2 h 30, heure de Bukavu). La veille de la soutenance, ouvrir chaque compte utilisé une fois pour vérifier ; garder la **vidéo de secours** prête en cas de coupure.

## La veille

1. Réinitialiser la démonstration (Actions › Démonstration › *Run workflow*), pour retrouver une évaluation « à valider » et aucune demande de document.
2. Vérifier les comptes sur la page de connexion de la démonstration.
3. Copier la vidéo de secours `Demo-secours-ISPT-Bukavu.mp4` sur l'ordinateur **et** sur une clé USB ; vérifier qu'elle se lit hors connexion.
4. Charger le téléphone ; activer le partage de connexion comme deuxième accès à internet.

## Le jour J, avant de commencer

Ouvrir un navigateur avec **six fenêtres de navigation privée** (chaque profil a sa propre session), déjà connectées et placées sur la bonne page :

| Fenêtre | Compte | Page de départ |
|---|---|---|
| A | aucun (visiteur) | accueil |
| B | `demo.candidat@example.org` | `/candidat` |
| C | `demo.enseignant@example.org` | `/enseignant` |
| D | `demo.academique@example.org` | `/admin/notes` |
| E | `DEMO0001` | `/etudiant` |
| F | `demo.direction@example.org` | `/admin/pilotage` |

Zoom du navigateur à 125 % pour la lisibilité au projecteur. Fermer les notifications du système.

## Déroulé minuté

| Temps | Fenêtre | Action | Ce que l'on dit |
|---|---|---|---|
| 0:00 | A | Accueil, défiler ; ouvrir « Génie Informatique » ; puis « Admissions » | « Le site public est entièrement administré par l'institut : textes, photos, filières. » |
| 0:40 | B | Dossier du candidat : informations, pièces, état | « Le candidat dépose ses pièces en ligne et suit l'état de son dossier, sans se déplacer. » |
| 1:20 | C | Ouvrir « Algorithmique et programmation », puis « Interrogation 1 » (déjà publiée) | « L'enseignant ne voit que ses propres cours. Il saisit les notes de chaque évaluation, puis les transmet au secrétariat ; celle-ci a déjà été publiée. » |
| 2:00 | D | Ouvrir l'évaluation à valider (transmise par un autre enseignant) ; **Valider** ; **Publier aux étudiants** | « Le secrétariat contrôle, valide, puis publie : les étudiants sont notifiés. Une note n'est jamais visible avant publication. » |
| 2:40 | F | Tableau de bord « Pilotage » | « La direction suit les effectifs, les notes publiées et la situation financière en temps réel. » |
| 3:00 | E | Accueil, « Notes », « Valve » ; puis « Documents » : demander une **attestation de fréquentation** | « L'étudiant voit ses propres notes et les communiqués de sa promotion ; il demande un document en ligne. » |
| 4:00 | D | « Documents officiels » : **Émettre** la demande ; ouvrir l'attestation | « Le document est figé et porte un code QR. » |
| 4:30 | A | Ouvrir l'adresse de vérification imprimée sous le QR (ou scanner le QR avec le téléphone) | « N'importe qui, un employeur par exemple, vérifie en ligne que le document est authentique. » |
| 5:00 | — | Revenir au diaporama | « Voilà pour la démonstration. » |

## Si quelque chose se passe mal

- **Page qui ne charge pas après 10 secondes** : dire « la connexion est lente, je vous montre l'enregistrement » et lancer la vidéo de secours à l'étape correspondante. Ne pas s'excuser longuement.
- **Erreur de connexion d'un compte** : passer à l'étape suivante ; la vidéo montre l'étape manquée.
- **Question du jury pendant la démo** : répondre en une phrase, proposer d'y revenir aux questions.

## Vidéo de secours

`Demo-secours-ISPT-Bukavu.mp4` (3 min 28 s, sans son, légendée) suit le même déroulé. Elle est produite par `video-secours.cjs` sur une copie locale de la démonstration : il suffit de commenter par-dessus, au même rythme que la démonstration en direct.
