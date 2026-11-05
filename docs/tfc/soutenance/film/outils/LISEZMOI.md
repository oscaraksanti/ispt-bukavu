# Outils de production du film

Scripts utilisés dans le bac à sable de travail (chemins absolus à adapter). Ils tournent sur une **copie locale de l'instance de démonstration** (`ispt_demo`, données fictives), jamais sur la production.

1. `preparer.cjs`, puis `delib.cjs`, `delib2.cjs`, `delib3.cjs` : publient les évaluations transmises, demandent et émettent une attestation, préparent, clôturent et proclament une délibération (pour disposer d'un bulletin vérifiable).
2. `capturer.cjs` (`LOT=public|candidat|etudiant|enseignant|academique|direction|reprise`) : captures 1920 × 1080 en densité 1,5 (téléphone : 390 × 844 en densité 3). L'adresse `localhost:3000` affichée sur les documents est remplacée par `www.isptbukavu.org`.
3. `rendre.cjs <début> <fin>` : rend `../film.html` image par image (30 i/s) ; `apercu.cjs <t…>` : images de contrôle.
4. Assemblage : `ffmpeg` (H.264, CRF 18), puis musique `../musique.py` normalisée à −27 LUFS (version avec musique) ou −20 LUFS (piste seule).
