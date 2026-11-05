-- CreateEnum
CREATE TYPE "AudienceCampus" AS ENUM ('INSTITUT', 'FILIERE', 'PROMOTION');

-- CreateEnum
CREATE TYPE "StatutPublicationCampus" AS ENUM ('PUBLIEE', 'EN_ATTENTE', 'REFUSEE');

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "reglesCampusLe" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "auteurId" TEXT,
    "contenu" TEXT NOT NULL,
    "audience" "AudienceCampus" NOT NULL DEFAULT 'INSTITUT',
    "filiereId" TEXT,
    "promotionId" TEXT,
    "statut" "StatutPublicationCampus" NOT NULL DEFAULT 'PUBLIEE',
    "epingleLe" TIMESTAMP(3),
    "commentairesFermes" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3),
    "supprimeLe" TIMESTAMP(3),
    "masqueLe" TIMESTAMP(3),

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationMedia" (
    "publicationId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PublicationMedia_pkey" PRIMARY KEY ("publicationId","mediaId")
);

-- CreateTable
CREATE TABLE "ReactionPublication" (
    "publicationId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReactionPublication_pkey" PRIMARY KEY ("publicationId","utilisateurId")
);

-- CreateTable
CREATE TABLE "Commentaire" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "auteurId" TEXT,
    "parentId" TEXT,
    "contenu" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3),
    "supprimeLe" TIMESTAMP(3),
    "masqueLe" TIMESTAMP(3),

    CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnregistrementPublication" (
    "publicationId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnregistrementPublication_pkey" PRIMARY KEY ("publicationId","utilisateurId")
);

-- CreateTable
CREATE TABLE "SignalementCampus" (
    "id" TEXT NOT NULL,
    "cible" TEXT NOT NULL,
    "publicationId" TEXT,
    "commentaireId" TEXT,
    "auteurId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteLe" TIMESTAMP(3),
    "traiteParId" TEXT,
    "decision" TEXT,

    CONSTRAINT "SignalementCampus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Publication_creeLe_idx" ON "Publication"("creeLe");

-- CreateIndex
CREATE INDEX "Publication_statut_creeLe_idx" ON "Publication"("statut", "creeLe");

-- CreateIndex
CREATE INDEX "PublicationMedia_mediaId_idx" ON "PublicationMedia"("mediaId");

-- CreateIndex
CREATE INDEX "Commentaire_publicationId_creeLe_idx" ON "Commentaire"("publicationId", "creeLe");

-- CreateIndex
CREATE INDEX "SignalementCampus_traiteLe_idx" ON "SignalementCampus"("traiteLe");

-- CreateIndex
CREATE UNIQUE INDEX "SignalementCampus_cible_auteurId_key" ON "SignalementCampus"("cible", "auteurId");

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMedia" ADD CONSTRAINT "PublicationMedia_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMedia" ADD CONSTRAINT "PublicationMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionPublication" ADD CONSTRAINT "ReactionPublication_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionPublication" ADD CONSTRAINT "ReactionPublication_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Commentaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnregistrementPublication" ADD CONSTRAINT "EnregistrementPublication_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnregistrementPublication" ADD CONSTRAINT "EnregistrementPublication_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalementCampus" ADD CONSTRAINT "SignalementCampus_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalementCampus" ADD CONSTRAINT "SignalementCampus_commentaireId_fkey" FOREIGN KEY ("commentaireId") REFERENCES "Commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalementCampus" ADD CONSTRAINT "SignalementCampus_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- L'API REST de Supabase reste fermée : aucune politique, accès par le serveur seulement.
ALTER TABLE "Publication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PublicationMedia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReactionPublication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Commentaire" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EnregistrementPublication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SignalementCampus" ENABLE ROW LEVEL SECURITY;
