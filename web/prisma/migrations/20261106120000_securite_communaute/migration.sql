-- Notifications sur le téléphone : chaque abonnement est rattaché à la session
-- qui l'a activé ; fermer la session (déconnexion, changement de mot de passe,
-- suspension, expiration) supprime l'abonnement.
ALTER TABLE "AbonnementPush" ADD COLUMN "sessionId" TEXT;
-- Les abonnements existants ne sont rattachés à aucune session : ils sont
-- retirés et se réenregistrent à la prochaine visite de « Mon compte ».
DELETE FROM "AbonnementPush";
CREATE INDEX "AbonnementPush_sessionId_idx" ON "AbonnementPush"("sessionId");
ALTER TABLE "AbonnementPush" ADD CONSTRAINT "AbonnementPush_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Modération : copie du contenu signalé, conservée même si l'auteur le supprime.
ALTER TABLE "SignalementMessage" ADD COLUMN "extrait" TEXT;
ALTER TABLE "SignalementCampus" ADD COLUMN "extrait" TEXT;
