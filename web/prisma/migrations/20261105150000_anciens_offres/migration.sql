-- CreateEnum
CREATE TYPE "StatutAncien" AS ENUM ('EN_ATTENTE', 'PUBLIE', 'REFUSE', 'RETIRE');

-- CreateEnum
CREATE TYPE "TypeOffre" AS ENUM ('STAGE', 'EMPLOI', 'BOURSE', 'FORMATION');

-- CreateEnum
CREATE TYPE "StatutOffre" AS ENUM ('BROUILLON', 'PUBLIEE', 'ARCHIVEE');

-- CreateTable
CREATE TABLE "Ancien" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "postnom" TEXT,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "filiereId" TEXT,
    "anneeSortie" INTEGER NOT NULL,
    "poste" TEXT,
    "employeur" TEXT,
    "ville" TEXT,
    "parcours" TEXT,
    "lienProfessionnel" TEXT,
    "statut" "StatutAncien" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifRefus" TEXT,
    "consentementLe" TIMESTAMP(3) NOT NULL,
    "jetonRetraitHash" TEXT,
    "verifieParId" TEXT,
    "verifieLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ancien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffreInsertion" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeOffre" NOT NULL,
    "organisation" TEXT NOT NULL,
    "lieu" TEXT,
    "description" TEXT NOT NULL,
    "lienCandidature" TEXT,
    "emailCandidature" TEXT,
    "dateLimite" TIMESTAMP(3),
    "statut" "StatutOffre" NOT NULL DEFAULT 'BROUILLON',
    "publieeLe" TIMESTAMP(3),
    "auteurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffreInsertion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FiliereToOffreInsertion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FiliereToOffreInsertion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ancien_jetonRetraitHash_key" ON "Ancien"("jetonRetraitHash");

-- CreateIndex
CREATE INDEX "Ancien_statut_anneeSortie_idx" ON "Ancien"("statut", "anneeSortie");

-- CreateIndex
CREATE INDEX "OffreInsertion_statut_publieeLe_idx" ON "OffreInsertion"("statut", "publieeLe");

-- CreateIndex
CREATE INDEX "_FiliereToOffreInsertion_B_index" ON "_FiliereToOffreInsertion"("B");

-- AddForeignKey
ALTER TABLE "Ancien" ADD CONSTRAINT "Ancien_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FiliereToOffreInsertion" ADD CONSTRAINT "_FiliereToOffreInsertion_A_fkey" FOREIGN KEY ("A") REFERENCES "Filiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FiliereToOffreInsertion" ADD CONSTRAINT "_FiliereToOffreInsertion_B_fkey" FOREIGN KEY ("B") REFERENCES "OffreInsertion"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- L'API REST de Supabase reste fermée : accès uniquement par le serveur.
ALTER TABLE "Ancien" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OffreInsertion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_FiliereToOffreInsertion" ENABLE ROW LEVEL SECURITY;
