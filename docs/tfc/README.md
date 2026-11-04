# Mémoire (TFC)

Le mémoire est rédigé en Markdown, un fichier par partie, puis assemblé au format Word par un script. Toute correction se fait dans les fichiers sources ; le document Word est régénéré.

| Dossier                    | Contenu                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `memoire/metadonnees.json` | Mentions de la page de garde (tirées du dépliant officiel de l'institut)                          |
| `memoire/0*.md`            | Pages liminaires, numérotées en chiffres romains                                                  |
| `memoire/1*.md` à `9*.md`  | Introduction, chapitres, conclusion, bibliographie, annexes, table des matières (chiffres arabes) |
| `ressources/`              | Blason et images utilisées dans le document                                                       |
| `outils/construire.mjs`    | Script de construction                                                                            |
| `charte-de-redaction.md`   | Règles de mise en page et de citation                                                             |

## Construire le document

```bash
cd docs/tfc/outils
npm install          # une seule fois
npm run construire   # produit docs/tfc/sortie/TFC-Aksanti-Cirhuza-Oscar.docx
```

À l'ouverture dans Word, accepter la mise à jour des champs : la table des matières et la liste des figures se remplissent avec les bons numéros de page. Exporter ensuite en PDF depuis Word (Fichier › Enregistrer sous › PDF).

## Syntaxe des sources

- `#`, `##`, `###` : titres de niveau 1 à 3 (la numérotation 1.1, 1.1.1 est écrite dans le titre).
- `**gras**`, `*italique*`, listes `- ` et `1. `, citation longue `> `.
- `![Figure 3.1 : légende](chemin/image.png)` : figure numérotée, reprise dans la liste des figures.
- `::saut` : saut de page ; `::a-rediger texte` : repère d'une section encore à écrire.
- L'apostrophe droite et les espaces avant `: ; ? !` sont corrigés automatiquement (typographie française).

## Citations et bibliographie (APA 7)

- Toutes les sources vivent dans `references.json`, une entrée par référence vérifiée (clé, catégorie, forme abrégée pour la citation, année, référence complète, URL, date de consultation, mode de vérification).
- Dans le texte : `[@roques2018]` → (Roques, 2018) ; `[@codd1970, p. 377]` → (Codd, 1970, p. 377) ; `[@hevner2004; @peffers2007]` → (Hevner et al., 2004 ; Peffers et al., 2007) ; forme narrative `[+@sommerville2016]` → Sommerville (2016).
- `::bibliographie` produit la bibliographie des **seules références citées**, classées par catégorie puis par auteur et date, avec retrait suspendu et interligne simple.
- Une clé inconnue arrête la construction : aucune source non vérifiée ne peut entrer dans le mémoire. Pour ajouter une source, la vérifier (catalogue, éditeur, DOI ou page consultée) puis l'ajouter à `references.json`.
- `TFC_BIBLIO=toutes` affiche toute la base, pour la relecture.
- Les lettres APA (2023a, 2023b, s. d.-a) sont ajoutées automatiquement quand plusieurs références citées ont le même auteur et la même année ; ne pas les écrire dans `references.json`. Deux références du même auteur citées ensemble sont regroupées : (Auteur, 2023, 2025).
- Chaque liste numérotée repart à 1.

## Figures et tableaux

- `![Figure 1.2 : légende](figures/x.png){largeur=15}` : figure en largeur donnée (cm), proportions réelles conservées ; `::source …` juste en dessous.
- `::tableau Tableau 1.1 : légende` suivi d'un tableau Markdown : légende au-dessus, en-tête répété sur chaque page.
- Les listes des figures et des tableaux sont construites à partir des styles de légende.
- Les schémas sont écrits en Graphviz dans `figures/*.dot` ; régénération : `cd docs/tfc/figures && for f in *.dot; do dot -Tpng -Gdpi=220 "$f" -o "${f%.dot}.png"; done`.
- Une partie en anglais (abstract) porte la classe `{.anglais}` sur son titre : la typographie française (espaces insécables avant `: ; ? !`) n'y est pas appliquée.
- `::tableau` sans légende produit un tableau qui n'entre pas dans la liste des tableaux (liste des sigles).
- Classe `{.decale}` sur le titre (épigraphe, dédicace) : texte reporté dans le bas de la page, décalé à droite.
