-- Les étudiants peuvent n'avoir aucune adresse email : ils se connectent avec
-- leur matricule et un code d'activation remis par le secrétariat.
ALTER TABLE "Utilisateur" ALTER COLUMN "email" DROP NOT NULL;
