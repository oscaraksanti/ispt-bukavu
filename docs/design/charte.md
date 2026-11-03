# Charte graphique et système de design

## 1. Intention

Une institution d'ingénieurs et d'enseignants techniques : **précision, rigueur, fierté du terrain**. L'identité s'appuie sur ce que l'institut possède déjà et qui lui est propre — le blason, sa devise, ses couleurs, les photographies réelles de ses étudiants en travaux pratiques, en stage et à la collation — plutôt que sur des effets décoratifs.

Principes :

1. **Le contenu d'abord** : photographie réelle, typographie forte, beaucoup d'air. Aucune illustration générique.
2. **Langage d'ingénieur** : grilles visibles par endroits, filets fins, cotes et coordonnées en caractères techniques, numérotation des sections.
3. **Sobriété** : pas de dégradés décoratifs, pas d'ombres lourdes, pas d'effets de verre ; angles à peine adoucis.
4. **Accessible et léger** : contraste AA minimum, une seule famille par usage, rendu correct sur téléphone d'entrée de gamme.

## 2. Couleurs

Couleurs relevées sur le blason officiel, puis déclinées en nuances pour l'interface.

| Rôle | Nom | Valeur | Usage |
|---|---|---|---|
| Marque | Bleu ISPT | `#283890` | Couleur institutionnelle : en-têtes, liens, éléments actifs |
| Marque | Encre | `#141B4A` | Grands aplats sombres, pied de page, texte sur fond clair |
| Signal | Jaune chantier | `#FEF200` | Accent rare : bouton d'action principal, repères, soulignement |
| Accent | Rouge | `#E31D2F` | Détails de marque très ponctuels (jamais pour les erreurs) |
| Accent | Violet devise | `#612D89` | Devise, citations institutionnelles |
| Neutre | Papier | `#F7F6F2` | Fond général, légèrement chaud |
| Neutre | Pierre 50 → 900 | `#FBFAF7` → `#1C1B18` | Textes secondaires, bordures, fonds de sections |
| Système | Succès / Attention / Erreur / Info | `#1F7A4D` / `#B25E09` / `#B42318` / `#283890` | Retours de l'interface uniquement |

Le jaune n'est jamais utilisé pour du texte sur fond clair. Le texte posé sur le jaune est en encre.

## 3. Typographie

| Usage | Famille | Raison |
|---|---|---|
| Titres | **Newsreader** (serif, tailles optiques) | Autorité académique, lisibilité en grand format |
| Texte et interface | **IBM Plex Sans** | Héritage d'ingénierie, excellente lisibilité à petite taille, nombreuses langues |
| Données techniques | **IBM Plex Mono** | Matricules, codes de vérification, coordonnées, horaires |

Toutes les polices sont libres (SIL OFL) et auto-hébergées. Échelle de titres : 64 / 48 / 36 / 28 / 22 / 18 px sur grand écran, réduite d'environ 30 % sur mobile. Texte courant 16-17 px, interligne 1,6.

## 4. Grille et espacement

- Largeur de contenu maximale 1 240 px, grille de 12 colonnes, gouttière 24 px (16 px sur mobile).
- Échelle d'espacement en multiples de 4 px.
- Rythme vertical des sections : 96 px sur grand écran, 64 px sur mobile.
- Rayon des angles : 2 px (contrôles), 4 px (cartes et images).

## 5. Éléments graphiques propres

- **Filet de cote** : fine ligne horizontale terminée par deux tirets verticaux, utilisée sous les titres de section.
- **Numérotation** : chaque section de page est précédée d'un numéro en caractères techniques (`01`, `02`…).
- **Coordonnées** : `02°30'09" S · 28°52'18" E` apparaît comme signature graphique (pied de page, page contact).
- **Repère jaune** : petit rectangle jaune qui marque l'élément actif ou une donnée clé.

## 6. Iconographie

Jeu d'icônes linéaires unique (trait de 1,5 px, angles nets), jamais d'émojis. Les icônes accompagnent un libellé ; elles ne le remplacent pas, sauf pour les actions universelles (fermer, menu, recherche).

## 7. Photographie

- Uniquement des photos réelles de l'institut (dossier `assets/photos/`).
- Cadrages larges pour les en-têtes, serrés pour les cartes ; aucune photo étirée ou déformée.
- Traitement léger et identique partout : contraste légèrement relevé, pas de filtre coloré.
- Chaque image porte un texte alternatif descriptif.

## 8. Mouvement

- Durées courtes : 150 ms (interactions), 300 ms (apparitions), courbe d'accélération douce.
- Apparition progressive des sections au défilement, une seule fois, sans rebond.
- Aucun mouvement si l'utilisateur a demandé la réduction des animations.

## 9. Voix et ton

Français clair et institutionnel, phrases courtes, vouvoiement. On écrit « Déposer ma candidature », pas « Cliquez ici ». Les chiffres et les faits viennent de l'institut ; rien n'est inventé.

## 10. Blason

Fichiers vectoriels dans [`brand/svg/`](../../brand/svg) : couleur, monochrome, blanc, avec ou sans devise. Zone de protection autour du blason : au moins la largeur de l'étoile. Taille minimale : 32 px de haut sans devise, 72 px avec devise. Ne jamais déformer, recolorer partiellement ou placer sur une photo chargée sans fond.
