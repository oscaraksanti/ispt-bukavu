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
| Système | Succès / Attention / Erreur / Info | `#1F7A4D` / `#9C5208` / `#B42318` / `#283890` | Retours de l'interface uniquement |

Le jaune n'est jamais utilisé pour du texte sur fond clair. Le texte posé sur le jaune est en encre.

## 3. Typographie

| Usage | Famille | Raison |
|---|---|---|
| Titres | **Newsreader** (serif, tailles optiques) | Autorité académique, lisibilité en grand format |
| Texte et interface | **IBM Plex Sans** | Héritage d'ingénierie, excellente lisibilité à petite taille, nombreuses langues |
| Données techniques | **IBM Plex Mono** | Matricules, codes de vérification, coordonnées, horaires |

Toutes les polices sont libres (SIL OFL) et auto-hébergées. Échelle de titres : 64 / 48 / 36 / 28 / 22 / 18 px sur grand écran, réduite d'environ 30 % sur mobile. Texte courant 16-17 px, interligne 1,6.

Les tailles d'interface sont des jetons (`globals.css`, `@theme`) ; aucune valeur libre (`text-[…]`) pour ces usages :

| Jeton | Taille | Usage |
|---|---|---|
| `text-legende` | 11 px | Légendes de photos, libellés techniques en capitales, raccourcis clavier |
| `text-detail` | 13 px | Métadonnées, aides de saisie |
| `text-corps` | 15 px | Corps des interfaces : tableaux, listes, navigation |
| `text-chapeau` | 17 px | Introductions et textes éditoriaux |
| `text-titre-page` | 36 px | Titre de page des espaces, de l'administration et des formulaires |

Les titres de section du site public (32 → 44 px) restent portés par le composant `EnteteSection`.

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

Jeu d'icônes linéaires unique, Lucide, au trait de 1,5 px (règle `.lucide` de `globals.css`), jamais d'émojis. Les icônes accompagnent un libellé ; elles ne le remplacent pas, sauf pour les actions universelles (fermer, menu, recherche), qui portent alors un libellé accessible. Tailles : 16 px dans le texte et les boutons, 20 px pour les boutons d'icône seule.

**Une icône par concept, la même partout** (navigation, notifications, tableau de bord). La table des icônes de l'administration est typée (`components/admin/icones.ts`) : une icône manquante est une erreur de compilation.

| Concept | Icône | Concept | Icône |
|---|---|---|---|
| Étudiants | `GraduationCap` | Filières | `Layers` |
| Enseignants | `Presentation` | Comptes | `UserCog` |
| Années et promotions | `CalendarCog` | Rôles | `ShieldCheck` |
| Programme | `BookOpen` | Journal | `History` |
| Horaires | `CalendarClock` | Valve | `Megaphone` |
| Examens | `CalendarCheck` | Actualités | `Newspaper` |
| Notes | `ClipboardCheck` | Agenda | `CalendarDays` |
| Délibérations | `Scale` | Messages | `Inbox` |
| Documents officiels | `FileBadge` | Médiathèque | `Images` |
| Candidatures | `FolderOpen` | Galerie | `GalleryHorizontalEnd` |
| Campagnes | `CalendarRange` | Anciens | `Award` |
| Finances | `Wallet` | Stages | `HardHat` |
| Devoirs | `NotebookPen` | Offres | `BriefcaseBusiness` |
| Succès | `CircleCheck` | Alerte | `TriangleAlert` |
| Lien externe | `ArrowUpRight` | Retour | `ArrowLeft` (composant `LienRetour`) |

Les flèches ne sont jamais tapées comme caractères (« ← », « → ») dans un lien.

## 7. Photographie

- Uniquement des photos réelles de l'institut (dossier `assets/photos/`).
- Cadrages larges pour les en-têtes, serrés pour les cartes ; aucune photo étirée ou déformée.
- Traitement léger et identique partout : contraste légèrement relevé, pas de filtre coloré.
- Chaque image porte un texte alternatif descriptif.

## 8. Mouvement

- Interactions (survol, focus, boutons) : 150 ms, courbe douce.
- Apparitions : 600 à 800 ms, courbe « expo » (rapide au départ, douce à l'arrivée) ; photos : 1,2 à 1,4 s pour le léger recadrage.
- **Rationner le mouvement** : seuls l'accroche, les titres de section, les photos et les séries de cartes apparaissent au défilement, une seule fois, sans rebond. Les paragraphes, listes et boutons sont affichés d'emblée.
- Aucun mouvement si l'utilisateur a demandé la réduction des animations.

## 9. Voix et ton

Français clair et institutionnel, phrases courtes, vouvoiement. On écrit « Déposer ma candidature », pas « Cliquez ici ». Les chiffres et les faits viennent de l'institut ; rien n'est inventé.

## 10. Blason

Fichiers vectoriels dans [`brand/svg/`](../../brand/svg) : couleur, monochrome, blanc, avec ou sans devise. Zone de protection autour du blason : au moins la largeur de l'étoile. Taille minimale : 32 px de haut sans devise, 72 px avec devise. Ne jamais déformer, recolorer partiellement ou placer sur une photo chargée sans fond.

## Documents imprimés

Tous les documents académiques (attestations, relevés, bulletins, procès-verbaux,
reçus, calendriers d'examens, horaire) partagent la papeterie de
`web/src/components/documents/papier.tsx` :

- **Format** : A4 sans marges du navigateur ; la feuille porte ses marges
  (17 mm en portrait, 13 mm en paysage), répétées sur chaque page.
- **En-tête officiel** : blason, pays et tutelle (réglage « Paramètres des
  documents »), nom de l'institut en Newsreader, sigle espacé, coordonnées sur
  une ligne, double filet encre avec un trait or centré.
- **Titre** : Newsreader en capitales espacées ; numéro du document en Plex Mono
  entre deux filets.
- **Tableaux** : filets fins (pas de grille), en-têtes en petites capitales,
  chiffres tabulaires alignés à droite, notes toujours à deux décimales.
- **Synthèse** : une case par indicateur, la valeur principale sur fond encre.
- **Sécurité** : fond guilloché très léger, filigrane du blason, micro-texte
  portant la référence en haut et en bas de page, QR code de vérification.
- **Validation** : « Fait à », signataires, emplacement du sceau.
- **États** : tampon « Révoqué », « Annulé », « Brouillon » ou « Document de
  travail » en travers de la page.
