-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('PRESENT', 'RETARD', 'ABSENT', 'EXCUSE');

-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "statut" "StatutPresence" NOT NULL,
    "saisieParId" TEXT,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devoir" (
    "id" TEXT NOT NULL,
    "coursOffertId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "consignes" TEXT NOT NULL,
    "echeance" TIMESTAMP(3) NOT NULL,
    "accepteRetard" BOOLEAN NOT NULL DEFAULT false,
    "enonceId" TEXT,
    "creeParId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remise" (
    "id" TEXT NOT NULL,
    "devoirId" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "fichierId" TEXT NOT NULL,
    "commentaire" TEXT,
    "deposeLe" TIMESTAMP(3) NOT NULL,
    "enRetard" BOOLEAN NOT NULL DEFAULT false,
    "note" DECIMAL(4,2),
    "appreciation" TEXT,
    "corrigeLe" TIMESTAMP(3),

    CONSTRAINT "Remise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Presence_etudiantId_idx" ON "Presence"("etudiantId");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_seanceId_etudiantId_key" ON "Presence"("seanceId", "etudiantId");

-- CreateIndex
CREATE INDEX "Devoir_coursOffertId_idx" ON "Devoir"("coursOffertId");

-- CreateIndex
CREATE UNIQUE INDEX "Remise_devoirId_etudiantId_key" ON "Remise"("devoirId", "etudiantId");

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_enonceId_fkey" FOREIGN KEY ("enonceId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remise" ADD CONSTRAINT "Remise_devoirId_fkey" FOREIGN KEY ("devoirId") REFERENCES "Devoir"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remise" ADD CONSTRAINT "Remise_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remise" ADD CONSTRAINT "Remise_fichierId_fkey" FOREIGN KEY ("fichierId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- API REST de Supabase fermée sur les nouvelles tables (voir 20261103180000_securite_rls).
ALTER TABLE "Presence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Devoir" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Remise" ENABLE ROW LEVEL SECURITY;
