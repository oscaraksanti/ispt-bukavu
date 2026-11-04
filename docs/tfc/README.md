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
