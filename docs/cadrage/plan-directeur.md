# Plan directeur

Version 1 · 3 novembre 2026

## 1. Objet

Concevoir, réaliser et mettre en production la plateforme web de l'ISPT-Bukavu : site institutionnel, admissions en ligne, valve numérique, espaces étudiant et enseignant, et une administration qui pilote l'ensemble des contenus et des données. Le projet sert de support au Travail de Fin de Cycle d'Oscar Aksanti Cirhuza (Génie Informatique), sous la direction du Prof. SINDANO WA KITWANGA Expédit.

Le point de départ est un constat connu des étudiants : l'information officielle n'existe que sur la valve physique de l'avenue de l'Hippodrome et circule de façon informelle dans des groupes de messagerie. Les démarches (inscription, frais, documents) se font au guichet.

## 2. Données de référence

Source : dépliant officiel de l'institut ([`docs/sources/depliant-ispt-bukavu.pdf`](../sources/depliant-ispt-bukavu.pdf)).

| Élément | Information |
|---|---|
| Statut | Établissement public d'enseignement supérieur et universitaire |
| Création | Arrêté ministériel n°219/MINESU/CAB.MIN/MML/KOB/2010 du 8 novembre 2010 ; opérationnel depuis 2011 |
| Adresse | Avenue de l'Hippodrome n°102, quartier Nyawera, commune d'Ibanda, Bukavu · B.P. 1334 |
| Contacts | WhatsApp 085 371 5883 · Téléphone 099 924 9630 · ispt.bk@gmail.com |
| Mission | Former des ingénieurs en techniques appliquées, aptes à l'industrie et à l'enseignement technique |
| Sections et options | Génie Civil (BTP) · Électricité : Électromécanique, Électrotechnique · Électronique et Informatique : Électronique et Télécommunications, Génie Informatique · Mécanique : Mécanique Générale, Mécanique Automobile |
| Stages | Pédagogique (Collège Sainte-Anne Mbobero, C.S. La Lune, C.S. Lapereaux…) ; professionnel obligatoire (Office des Routes, BRALIMA, ITFM, centrale SNEL, BRAPRO, hôpitaux) |
| Autorités | Directeur Général : Prof. SINDANO WA KITWANGA Expédit · Secrétaire Général Académique : Prof. Albert LUKWISHI · Secrétaire Général Administratif : CT MUSAFIRI MULALI WAZO |
| Débouchés | SNEL, REGIDESO, bureaux d'études, télécoms, banques, hôtels, ONG, usines, ministères ; enseignement technique |

Points à confirmer : voir [`demande-informations-institut.md`](demande-informations-institut.md).

## 3. Modules de la plateforme

| # | Module | Utilisateurs | Fonction |
|---|---|---|---|
| 1 | Site institutionnel | Public | Présentation, sections et options, autorités, stages, partenaires, anciens, actualités, agenda, galerie, contact |
| 2 | Admissions en ligne | Candidats, administration | Préinscription, pièces justificatives, suivi du dossier, décision, frais, confirmation |
| 3 | Valve numérique | Étudiants, enseignants, administration | Communiqués officiels ciblés (institut, section, option, promotion), accusé de lecture |
| 4 | Espace étudiant | Étudiants | Tableau de bord, cours et supports, horaire, examens, notes et relevés, frais et reçus, demandes de documents |
| 5 | Espace enseignant | Enseignants | Cours, supports, devoirs, saisie et validation des notes, présences, horaire |
| 6 | Stages | Étudiants, encadreurs, administration | Lieux, affectations, conventions, rapports, évaluation |
| 7 | Documents vérifiables | Étudiants, tiers | Attestations et relevés PDF avec QR code de vérification en ligne |
| 8 | Anciens et insertion | Diplômés, partenaires | Annuaire volontaire, parcours, offres de stage et d'emploi |
| 9 | Pilotage | Direction | Indicateurs : effectifs, admissions, encaissements, réussite |
| 10 | Administration | Personnel habilité | Utilisateurs et rôles, structure académique, contenus et médias, finances, paramètres, journaux |

Rôles prévus, calqués sur l'organigramme : Directeur Général, Secrétaire Général Académique, Secrétaire Général Administratif, Appariteur central, Secrétaire de section, Caisse, Chargé de communication, Enseignant, Étudiant, Candidat, Administrateur technique.

## 4. Architecture technique

| Couche | Choix |
|---|---|
| Application | Next.js (App Router), TypeScript strict, Tailwind CSS |
| Données | PostgreSQL (Supabase), Prisma |
| Fichiers | Supabase Storage, optimisation automatique des images |
| Authentification | Auth.js, permissions par rôle vérifiées côté serveur |
| Emails | Resend |
| Hébergement | Vercel (préproduction par branche, production sur `main`) |
| Qualité | ESLint, Prettier, Vitest, Playwright, axe, Lighthouse, GitHub Actions |
| Surveillance | Sentry, UptimeRobot |

## 5. Phases

| Phase | Contenu | Semaines |
|---|---|---|
| 0 | Dépôt, conventions, intégration continue, environnements, cadrage | 1 |
| 1 | Étude de l'existant, enquête, entretiens, benchmark, cadre réglementaire | 1-2 |
| 2 | Personas, parcours, UML, modèle de données, maquettes | 2-3 |
| 3 | Identité visuelle, système de design, nouveau dépliant | 3-4 |
| 4 | Socle : authentification, rôles, journaux, médiathèque, CMS, préproduction | 4-5 |
| 5 | Site institutionnel, admissions en ligne | 5-7 |
| 6 | Structure académique, valve, espaces étudiant et enseignant, notes, frais | 7-10 |
| 7 | Stages, documents vérifiables, anciens, pilotage, hors-ligne | 10-11 |
| 8 | Tests, sécurité, accessibilité, performance, sauvegardes, mise en production | 12 |
| 9 | Finalisation du mémoire, soutenance | 12-13 (rédaction continue) |

Chaque phase se clôt par une démonstration en préproduction, des captures desktop et mobile, une vérification continue au vert et une mise à jour de ce document.

## 6. Structure prévue du mémoire

**Titre** : *Conception et réalisation d'une plateforme web intégrée de gestion académique et de communication institutionnelle : cas de l'ISPT-Bukavu*

- Pages liminaires, résumé et abstract
- Introduction générale
- Chapitre 1 — Présentation de l'ISPT-Bukavu et analyse de l'existant
- Chapitre 2 — Cadre conceptuel et état de l'art
- Chapitre 3 — Analyse et conception
- Chapitre 4 — Réalisation, tests et déploiement
- Conclusion générale et perspectives
- Bibliographie (APA 7) et annexes

Règles de forme : [`../tfc/charte-de-redaction.md`](../tfc/charte-de-redaction.md).

## 7. Budget d'exploitation

Prix publics indicatifs relevés en novembre 2026, à reconfirmer à la souscription.

| Poste | Développement | Production |
|---|---|---|
| Vercel | gratuit (Hobby) | ≈ 20 $ / mois (Pro) |
| Supabase | gratuit | ≈ 25 $ / mois (Pro) |
| Resend | gratuit (3 000 emails / mois) | 0 à 20 $ / mois |
| Nom de domaine | — | ≈ 25 à 130 $ / an selon l'extension |
| GitHub, Sentry, UptimeRobot | gratuit | gratuit |

## 8. Principes

- Toute information publiée est sourcée ou signalée comme à compléter dans l'administration.
- Aucune donnée personnelle d'enquête dans le dépôt.
- Accessibilité et sobriété : la plateforme doit rester utilisable sur un téléphone d'entrée de gamme et une connexion 3G.
