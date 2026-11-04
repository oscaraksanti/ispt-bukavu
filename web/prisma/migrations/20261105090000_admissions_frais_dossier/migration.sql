-- AlterTable
ALTER TABLE "Candidature" ADD COLUMN     "deviseFrais" "Devise",
ADD COLUMN     "modePaiement" "ModePaiement",
ADD COLUMN     "montantFrais" DECIMAL(10,2),
ADD COLUMN     "numeroRecu" TEXT,
ADD COLUMN     "paiementMotifRefus" TEXT,
ADD COLUMN     "paiementVerifieLe" TIMESTAMP(3),
ADD COLUMN     "paiementVerifieParId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_numeroRecu_key" ON "Candidature"("numeroRecu");

