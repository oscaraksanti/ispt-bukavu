# Conventions de travail

## Branches

- `main` : version stable, toujours déployable. Chaque push sur `main` déclenche la vérification continue et le déploiement de production.
- `phase-N-sujet` ou `feat/sujet` : travail en cours. Fusion dans `main` par pull request une fois la vérification au vert.

## Messages de commit

Format [Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/), description en français, à l'impératif :

```
type(portée): description courte

Corps facultatif : pourquoi ce changement, pas comment.
```

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation, TFC |
| `style` | Mise en forme sans effet sur le comportement |
| `refactor` | Restructuration sans changement fonctionnel |
| `test` | Ajout ou correction de tests |
| `chore` | Outillage, dépendances, configuration |
| `ci` | Intégration continue |

Portées courantes : `web`, `admin`, `etudiant`, `enseignant`, `admissions`, `valve`, `db`, `auth`, `tfc`, `design`.

Exemples :

```
feat(admissions): ajoute le dépôt des pièces justificatives
fix(valve): corrige le filtrage des communiqués par promotion
docs(tfc): rédige la section problématique
```

## Avant chaque commit

Depuis `web/` :

```bash
npm run format && npm run lint && npm run typecheck
```

## Secrets

Aucune clé, aucun mot de passe dans le dépôt. Les variables sont décrites dans `web/.env.example` et renseignées localement dans `web/.env.local` ou dans les réglages de l'hébergeur.

## Données personnelles

Les réponses brutes aux enquêtes et toute donnée nominative restent hors du dépôt (`docs/recherche/donnees-brutes/` est ignoré par Git). Seules des synthèses anonymisées sont publiées.
