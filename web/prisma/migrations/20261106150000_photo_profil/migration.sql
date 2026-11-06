-- Photo de profil facultative (fichier dans le stockage privé).
ALTER TABLE "Utilisateur" ADD COLUMN "photoCle" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "photoMajLe" TIMESTAMP(3);
