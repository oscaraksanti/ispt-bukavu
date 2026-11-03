-- Limitation des envois du formulaire de contact par adresse IP.
ALTER TABLE "MessageContact" ADD COLUMN "ip" TEXT;
CREATE INDEX "MessageContact_creeLe_idx" ON "MessageContact"("creeLe");
CREATE INDEX "MessageContact_ip_creeLe_idx" ON "MessageContact"("ip", "creeLe");
