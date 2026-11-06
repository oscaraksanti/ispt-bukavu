# Scénario de la démonstration (5 minutes)

La démonstration se fait sur l'**instance de démonstration**, jamais sur la production : **https://demo.isptbukavu.org**. Toutes les données y sont fictives et remises à zéro chaque nuit à 2 h 30 (heure de Bukavu). Sur la page de connexion, chaque profil se connecte **d'un clic** (mot de passe commun `Demo-ISPT-2026`, voir `docs/exploitation/demonstration.md`).

## La veille

1. Réinitialiser la démonstration (GitHub › Actions › Démonstration › *Run workflow*) : on retrouve une évaluation « à valider », aucune demande de document, et le Campus et la messagerie dans leur état de départ (messages non lus pour l'étudiante, règles du Campus pas encore acceptées).
2. Ouvrir la page de connexion de la démonstration et tester les profils utilisés.
3. Copier la vidéo de secours `Demo-secours-ISPT-Bukavu.mp4` sur l'ordinateur **et** sur une clé USB ; vérifier qu'elle se lit hors connexion.
4. Charger le téléphone ; activer le partage de connexion comme deuxième accès à internet.

## Le jour J, avant de commencer

Ouvrir un navigateur avec **six fenêtres de navigation privée** (chaque profil a sa propre session). Dans chacune, ouvrir `demo.isptbukavu.org/connexion` et cliquer sur le profil, puis aller à la page de départ :

| Fenêtre | Profil (un clic) | Page de départ |
|---|---|---|
| A | aucun (visiteur) | accueil |
| B | Candidat | `/candidat` |
| C | Enseignant | `/enseignant` |
| D | Secrétariat académique | `/admin/notes` |
| E | Étudiant (DEMO0001) | `/etudiant` |
| F | Direction générale | `/admin/pilotage` |

Zoom du navigateur à 125 % pour la lisibilité au projecteur. Fermer les notifications du système.

## Déroulé minuté

| Temps | Fenêtre | Action | Ce que l'on dit |
|---|---|---|---|
| 0:00 | A | Accueil, défiler ; ouvrir « Génie Informatique » | « Le site public est entièrement administré par l'institut : textes, photos, filières. » |
| 0:30 | B | Dossier du candidat : informations, pièces, état | « Le candidat dépose ses pièces en ligne et suit son dossier sans se déplacer. » |
| 1:00 | C | Ouvrir « Algorithmique et programmation », puis « Interrogation 1 » (déjà publiée) | « L'enseignant ne voit que ses propres cours ; il saisit les notes puis les transmet au secrétariat. » |
| 1:30 | D | Ouvrir l'évaluation à valider ; **Valider** ; **Publier aux étudiants** | « Le secrétariat contrôle, valide, puis publie : les étudiants sont notifiés. Une note n'est jamais visible avant publication. » |
| 2:10 | E | Accueil (la cloche signale la note publiée), puis « Notes » | « L'étudiante voit aussitôt sa note, et seulement les siennes. » |
| 2:30 | E | « Campus » : lire les règles, **J'ai lu et j'accepte les règles** ; montrer la publication épinglée et la question d'un camarade avec ses réponses ; cliquer **J'aime** | « La valve reste le canal officiel ; le Campus remplace les groupes informels, avec des règles acceptées et une modération qui ne voit que les contenus signalés. » |
| 3:05 | E | Icône « Messages » (pastille 2) : le groupe de la promotion, puis le message privé de l'enseignant | « Chaque promotion et chaque cours a son groupe, créé automatiquement à partir des inscriptions. » |
| 3:30 | F | Tableau de bord « Pilotage » | « La direction suit les effectifs, les notes publiées et la situation financière en temps réel. » |
| 3:50 | E | « Documents » : demander une **attestation de fréquentation** | « L'étudiante demande un document officiel en ligne. » |
| 4:10 | D | « Documents officiels » : **Émettre** la demande ; ouvrir l'attestation | « Le document est figé et porte un code QR. » |
| 4:35 | A | Ouvrir l'adresse de vérification imprimée sous le QR (ou scanner le QR avec le téléphone) | « N'importe qui, un employeur par exemple, vérifie en ligne que le document est authentique. » |
| 5:00 | — | Revenir au diaporama | « Voilà pour la démonstration. » |

**Si le temps le permet** (questions du jury) : montrer la même étudiante sur le téléphone, avec la barre de navigation du bas et « Mon compte » (photo de profil, notifications sur le téléphone, téléchargement de ses données).

## Si quelque chose se passe mal

- **Page qui ne charge pas après 10 secondes** : dire « la connexion est lente, je vous montre l'enregistrement » et lancer la vidéo de secours à l'étape correspondante. Ne pas s'excuser longuement.
- **Un profil ne se connecte pas** : passer à l'étape suivante ; la vidéo montre l'étape manquée.
- **Question du jury pendant la démo** : répondre en une phrase, proposer d'y revenir aux questions.

## Vidéo de secours

`Demo-secours-ISPT-Bukavu.mp4` (4 min 26 s, sans son, légendée) suit le même déroulé. Elle est produite par `video-secours.cjs` sur une copie locale de la démonstration : il suffit de commenter par-dessus, au même rythme que la démonstration en direct.
