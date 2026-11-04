-- CreateEnum
CREATE TYPE "PeriodeDeliberation" AS ENUM ('SEMESTRE', 'ANNUELLE');

-- CreateEnum
CREATE TYPE "StatutDeliberation" AS ENUM ('PREPARATION', 'CLOTUREE', 'PROCLAMEE');

-- AlterEnum
ALTER TYPE "TypeDocument" ADD VALUE 'BULLETIN';

-- CreateTable
CREATE TABLE "ReglementAcademique" (
    "id" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "regles" JSONB NOT NULL,
    "majLe" TIMESTAMP(3) NOT NULL,
    "majParId" TEXT,

    CONSTRAINT "ReglementAcademique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliberation" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "periode" "PeriodeDeliberation" NOT NULL,
    "semestre" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutDeliberation" NOT NULL DEFAULT 'PREPARATION',
    "regles" JSONB,
    "dateJury" TIMESTAMP(3),
    "secretaireJury" TEXT,
    "presidentJury" TEXT,
    "calculeLe" TIMESTAMP(3),
    "clotureLe" TIMESTAMP(3),
    "clotureParId" TEXT,
    "proclameLe" TIMESTAMP(3),
    "proclameParId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deliberation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultatDeliberation" (
    "id" TEXT NOT NULL,
    "deliberationId" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "moyenne" DECIMAL(5,2),
    "moyenneBrute" DECIMAL(7,3),
    "total" DECIMAL(8,2) NOT NULL,
    "creditsValides" INTEGER NOT NULL,
    "creditsTotal" INTEGER NOT NULL,
    "coursNonPresentes" INTEGER NOT NULL DEFAULT 0,
    "mention" TEXT,
    "mentionLibelle" TEXT,
    "rang" INTEGER,
    "decisionProposee" TEXT,
    "decisionJury" TEXT,
    "motifJury" TEXT,
    "casLimite" TEXT,
    "details" JSONB NOT NULL,
    "documentId" TEXT,

    CONSTRAINT "ResultatDeliberation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReglementAcademique_anneeId_key" ON "ReglementAcademique"("anneeId");

-- CreateIndex
CREATE UNIQUE INDEX "Deliberation_promotionId_periode_semestre_key" ON "Deliberation"("promotionId", "periode", "semestre");

-- CreateIndex
CREATE UNIQUE INDEX "ResultatDeliberation_documentId_key" ON "ResultatDeliberation"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultatDeliberation_deliberationId_etudiantId_key" ON "ResultatDeliberation"("deliberationId", "etudiantId");

-- AddForeignKey
ALTER TABLE "ReglementAcademique" ADD CONSTRAINT "ReglementAcademique_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliberation" ADD CONSTRAINT "Deliberation_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatDeliberation" ADD CONSTRAINT "ResultatDeliberation_deliberationId_fkey" FOREIGN KEY ("deliberationId") REFERENCES "Deliberation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatDeliberation" ADD CONSTRAINT "ResultatDeliberation_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatDeliberation" ADD CONSTRAINT "ResultatDeliberation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentOfficiel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- API REST de Supabase fermée sur les nouvelles tables (voir 20261103180000_securite_rls).
ALTER TABLE "ReglementAcademique" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deliberation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResultatDeliberation" ENABLE ROW LEVEL SECURITY;
