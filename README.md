# ISPT-Bukavu — Plateforme web

Plateforme numérique de l'**Institut Supérieur Pédagogique et Technique de Bukavu** (République Démocratique du Congo) : site institutionnel, admissions en ligne, valve numérique et espaces étudiant, enseignant et administration, entièrement pilotés depuis une interface d'administration.

Le projet fait également l'objet d'un Travail de Fin de Cycle en Génie Informatique.

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| [`web/`](web) | Application web (Next.js, TypeScript, Tailwind CSS) |
| [`docs/cadrage/`](docs/cadrage) | Plan directeur, proposition de sujet, demandes à l'institut |
| [`docs/recherche/`](docs/recherche) | Étude de l'existant, enquête, benchmark |
| [`docs/conception/`](docs/conception) | Modélisation UML, modèle de données, architecture |
| [`docs/design/`](docs/design) | Charte graphique et système de design |
| [`docs/tfc/`](docs/tfc) | Charte de rédaction et chapitres du travail de fin de cycle |
| [`docs/sources/`](docs/sources) | Documents officiels de l'institut utilisés comme sources |
| [`brand/`](brand) | Fichiers sources de l'identité visuelle |

## Démarrer en local

Prérequis : Node.js 22 ou plus récent.

```bash
cd web
npm install
npm run dev
```

L'application est alors disponible sur <http://localhost:3000>.

## Commandes utiles

Depuis le dossier `web/` :

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Analyse statique (ESLint) |
| `npm run typecheck` | Vérification des types TypeScript |
| `npm run format` | Mise en forme du code (Prettier) |

## Conventions

Voir [`docs/conventions.md`](docs/conventions.md) : branches, messages de commit, revue et mise en production.

## Auteur

**Oscar Aksanti Cirhuza** — étudiant en Génie Informatique, ISPT-Bukavu.

© 2026 Oscar Aksanti Cirhuza. Tous droits réservés — voir [`LICENSE`](LICENSE).
