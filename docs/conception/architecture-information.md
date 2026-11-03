# Architecture de l'information

## 1. Site public

```
Accueil
├── L'institut
│   ├── Présentation et histoire
│   ├── Mot du Directeur Général
│   ├── Autorités académiques
│   └── Stages et partenaires
├── Formations
│   ├── Électromécanique
│   ├── Génie Informatique
│   ├── Électronique et Télécommunications
│   └── Génie Civil (BTP)
├── Admissions
│   ├── Conditions et pièces exigées
│   ├── Calendrier et frais
│   ├── Déposer une candidature  →  espace candidat
│   └── Questions fréquentes
├── Actualités
│   ├── Article
│   └── Événements
├── Galerie
│   └── Album
├── Valve publique (communiqués publics)
├── Vérifier un document
├── Contact (carte, coordonnées, formulaire)
└── Connexion
```

Navigation principale (5 entrées maximum sur mobile) : **L'institut · Formations · Admissions · Actualités · Contact**, avec un bouton d'action « Candidater » et l'accès « Connexion ».

## 2. Espaces connectés

| Espace | Navigation |
|---|---|
| Candidat | Ma candidature (étapes) · Pièces · Suivi · Messages de l'institut |
| Étudiant | Aujourd'hui · Valve · Horaire · Cours · Notes · Frais · Documents · Stage · Profil |
| Enseignant | Aujourd'hui · Valve · Horaire · Mes cours · Notes · Communiqués |
| Administration | Tableau de bord · Admissions · Étudiants · Académique (structure, horaires, notes) · Valve · Frais · Documents · Stages · Site (pages, actualités, galerie, médias) · Personnes et rôles · Réglages · Journal |

Sur mobile, les espaces étudiant et enseignant utilisent une **barre de navigation basse** à quatre entrées (Aujourd'hui, Valve, Horaire, Plus) ; l'administration utilise un menu latéral repliable.

## 3. Inventaire des écrans

| Espace | Écran | Fonctions |
|---|---|---|
| Public | Accueil | Promesse, filières, chiffres, actualités, galerie, appel à candidater |
| Public | Filière | Présentation, métiers, débouchés, organisation des études, photos, admission |
| Public | Admissions | Étapes, pièces, frais, calendrier, FAQ |
| Public | Vérification | Saisie du code ou lecture du QR, résultat |
| Candidat | Assistant de candidature | 5 étapes : identité, coordonnées, études, filière, pièces et paiement |
| Candidat | Suivi | Frise d'état, messages, pièces à compléter |
| Étudiant | Aujourd'hui | Séances du jour, derniers communiqués, solde, dernières notes |
| Étudiant | Valve | Liste filtrable, non lus, épinglés, pièces jointes |
| Étudiant | Horaire | Vue semaine (format de l'institut : jours × plages) |
| Étudiant | Notes | Relevé par semestre, crédits, moyennes |
| Étudiant | Frais | Solde, échéances, paiements, reçus PDF |
| Étudiant | Documents | Demandes, documents émis avec QR |
| Enseignant | Grille de notes | Saisie rapide au clavier, contrôle des bornes, soumission |
| Admin | Tableau de bord | Effectifs par filière, réussite, encaissements et impayés, activité |
| Admin | Candidatures | File de traitement, contrôle des pièces, décision |
| Admin | Constructeur d'horaire | Grille promotion × semaine, glisser une séance, publier |
| Admin | Éditeur de page | Blocs ordonnables, textes, images, aperçu, publication |
| Admin | Médiathèque | Téléversement, recadrage, texte alternatif |
| Admin | Rôles | Permissions par rôle, membres |

## 4. Parcours clés

1. **Futur étudiant** : Accueil → Filière → Admissions → Créer un compte → Assistant (5 étapes) → Suivi.
2. **Étudiant le matin** : ouverture de l'application installée → Aujourd'hui (séances, nouveaux communiqués) → Valve → communiqué lu.
3. **Enseignant en fin de semestre** : Mes cours → Évaluation → Grille de notes → Soumettre.
4. **Secrétariat académique** : Notes soumises → Contrôle → Valider → Publier → notifications envoyées.
5. **Communication** : Site → Page « Accueil » → modifier un bloc et sa photo → Aperçu → Publier.
6. **Employeur** : scan du QR code d'une attestation → page de vérification → document valide.
