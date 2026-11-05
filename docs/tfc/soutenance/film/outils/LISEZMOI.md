# Outils de production du film

Scripts utilisés dans le bac à sable de travail (chemins absolus à adapter). Ils tournent sur une **copie locale de l'instance de démonstration** (`ispt_demo`, données fictives), jamais sur la production.

1. `preparer.cjs`, puis `delib.cjs`, `delib2.cjs`, `delib3.cjs` : publient les évaluations transmises, demandent et émettent une attestation, préparent, clôturent et proclament une délibération (pour disposer d'un bulletin vérifiable).
2. `capturer.cjs` (`LOT=public|candidat|etudiant|enseignant|academique|direction|reprise`) : captures 1920 × 1080 en densité 1,5 (téléphone : 390 × 844 en densité 3). L'adresse `localhost:3000` affichée sur les documents est remplacée par `www.isptbukavu.org`.
3. `rendre.cjs <début> <fin>` : rend `../film.html` image par image (30 i/s) ; `apercu.cjs <t…>` : images de contrôle.
4. Assemblage : `ffmpeg` (H.264, CRF 18), puis musique `../musique.py` normalisée à −27 LUFS (version avec musique) ou −20 LUFS (piste seule).

## Calage sur la voix off (5 novembre 2026)

- `transcrire.py <modèle>` (faster-whisper, modèle `small`, français, horodatage par mot) : transcription de la voix enregistrée (3 min 40), qui fixe le début de chaque chapitre.
- `film.js` : tableaux `ANCIEN` / `NOUVEAU` (recalage proportionnel de chaque chapitre sur la voix) et `SOUS_TITRES` (texte corrigé d'après le script, minuté sur la transcription). `../sous-titres.srt` en est l'export.
- Mixage : voix (passe-haut 80 Hz, débruitage léger, compression douce, −16 LUFS) ; musique `musique.py … 225` à −25,5 LUFS, abaissée automatiquement sous la voix (`sidechaincompress`), limiteur final ; vidéo + AAC 256 kb/s.
