# Conception

| Document | Contenu |
|---|---|
| [`specification.md`](specification.md) | Périmètre, acteurs, besoins fonctionnels et non fonctionnels, rôles et permissions, règles métier |
| [`architecture.md`](architecture.md) | Architecture technique, organisation du code, sécurité, performance, données personnelles |
| [`architecture-information.md`](architecture-information.md) | Plan du site, navigation des espaces, inventaire des écrans, parcours clés |
| [`uml/`](uml) | Sources PlantUML des diagrammes (style commun : `_style.iuml`) |
| [`figures/`](figures) | Diagrammes rendus en PNG |

## Diagrammes

| Figure | Fichier |
|---|---|
| Cas d'utilisation — visiteurs et candidats | [`cas-utilisation-public.png`](figures/cas-utilisation-public.png) |
| Cas d'utilisation — étudiants et enseignants | [`cas-utilisation-academique.png`](figures/cas-utilisation-academique.png) |
| Cas d'utilisation — administration | [`cas-utilisation-administration.png`](figures/cas-utilisation-administration.png) |
| Classes — structure académique et évaluation | [`classes-academique.png`](figures/classes-academique.png) |
| Classes — admissions, valve, frais et documents | [`classes-admissions-valve.png`](figures/classes-admissions-valve.png) |
| Classes — contenus, accès et traçabilité | [`classes-contenu.png`](figures/classes-contenu.png) |
| Classes — délibérations, examens, devoirs et présences | [`classes-deliberations-examens.png`](figures/classes-deliberations-examens.png) |
| Séquence — candidature | [`sequence-candidature.png`](figures/sequence-candidature.png) |
| Séquence — publication d'un communiqué | [`sequence-communique.png`](figures/sequence-communique.png) |
| Séquence — notes | [`sequence-notes.png`](figures/sequence-notes.png) |
| Séquence — document vérifiable | [`sequence-verification.png`](figures/sequence-verification.png) |
| Activité — parcours d'admission | [`activite-admission.png`](figures/activite-admission.png) |
| États — candidature | [`etats-candidature.png`](figures/etats-candidature.png) |
| États — évaluation et notes | [`etats-note.png`](figures/etats-note.png) |
| États — délibération | [`etats-deliberation.png`](figures/etats-deliberation.png) |
| Déploiement | [`deploiement.png`](figures/deploiement.png) |
| Architecture logique | [`composants.png`](figures/composants.png) |

## Régénérer les figures

```bash
cd docs/conception/uml
java -jar plantuml.jar -tpng -charset UTF-8 -o ../figures *.puml
```

`plantuml.jar` : version 1.2025.10, depuis Maven Central (`net.sourceforge.plantuml:plantuml`) ; Graphviz requis. Les diagrammes ont été mis en conformité avec le code le 4 novembre 2026 (noms des actions, états réels, délibérations et examens).

Police utilisée : IBM Plex Sans (à installer localement pour un rendu identique).
