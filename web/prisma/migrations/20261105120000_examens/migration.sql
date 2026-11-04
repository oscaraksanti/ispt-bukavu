-- CreateEnum
CREATE TYPE "TypeSessionExamen" AS ENUM ('ORDINAIRE', 'RATTRAPAGE');

-- CreateEnum
CREATE TYPE "StatutSessionExamen" AS ENUM ('BROUILLON', 'PUBLIEE');

-- CreateEnum
CREATE TYPE "ModaliteEpreuve" AS ENUM ('ECRIT', 'ORAL', 'PRATIQUE');

-- CreateTable
CREATE TABLE "SessionExamen" (
    "id" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "TypeSessionExamen" NOT NULL DEFAULT 'ORDINAIRE',
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "statut" "StatutSessionExamen" NOT NULL DEFAULT 'BROUILLON',
    "consignes" TEXT,
    "publieeLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionExamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Epreuve" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "coursOffertId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "salle" TEXT,
    "modalite" "ModaliteEpreuve" NOT NULL DEFAULT 'ECRIT',
    "remarque" TEXT,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Epreuve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpreuveSurveillant" (
    "epreuveId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,

    CONSTRAINT "EpreuveSurveillant_pkey" PRIMARY KEY ("epreuveId","enseignantId")
);

-- CreateIndex
CREATE INDEX "SessionExamen_anneeId_idx" ON "SessionExamen"("anneeId");

-- CreateIndex
CREATE INDEX "Epreuve_sessionId_idx" ON "Epreuve"("sessionId");

-- CreateIndex
CREATE INDEX "Epreuve_coursOffertId_idx" ON "Epreuve"("coursOffertId");

-- AddForeignKey
ALTER TABLE "SessionExamen" ADD CONSTRAINT "SessionExamen_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epreuve" ADD CONSTRAINT "Epreuve_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionExamen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epreuve" ADD CONSTRAINT "Epreuve_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpreuveSurveillant" ADD CONSTRAINT "EpreuveSurveillant_epreuveId_fkey" FOREIGN KEY ("epreuveId") REFERENCES "Epreuve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpreuveSurveillant" ADD CONSTRAINT "EpreuveSurveillant_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "ProfilEnseignant"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- L'API REST de Supabase reste fermée : accès uniquement par le serveur.
ALTER TABLE "SessionExamen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Epreuve" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EpreuveSurveillant" ENABLE ROW LEVEL SECURITY;
