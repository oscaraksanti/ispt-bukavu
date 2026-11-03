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

## Base de données et sécurité

- Toute nouvelle table passe par une migration Prisma ; la migration doit activer la sécurité au niveau des lignes (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`) : l'API REST de Supabase reste ainsi fermée, l'application accédant aux données uniquement par Prisma.
- Chaque page et chaque action de l'administration vérifie elle-même la permission requise (`exigerPermission`) ; le menu ne fait que refléter ces droits.
- Toute modification sensible est tracée avec `journaliser` et l'action reçoit un libellé dans `src/features/journal/libelles.ts`.
