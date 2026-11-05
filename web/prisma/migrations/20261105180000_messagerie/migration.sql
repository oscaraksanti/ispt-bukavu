-- CreateEnum
CREATE TYPE "TypeConversation" AS ENUM ('PRIVEE', 'PROMOTION', 'COURS');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "TypeConversation" NOT NULL,
    "cle" TEXT NOT NULL,
    "titre" TEXT,
    "promotionId" TEXT,
    "coursOffertId" TEXT,
    "annoncesSeulement" BOOLEAN NOT NULL DEFAULT false,
    "dernierMessageLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantConversation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "animateur" BOOLEAN NOT NULL DEFAULT false,
    "luJusquA" TIMESTAMP(3),
    "sourdine" BOOLEAN NOT NULL DEFAULT false,
    "quitteLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "auteurId" TEXT,
    "contenu" TEXT NOT NULL,
    "reponseAId" TEXT,
    "mediaId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supprimeLe" TIMESTAMP(3),
    "masqueLe" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalementMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteLe" TIMESTAMP(3),
    "traiteParId" TEXT,
    "decision" TEXT,

    CONSTRAINT "SignalementMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocage" (
    "bloqueurId" TEXT NOT NULL,
    "bloqueId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blocage_pkey" PRIMARY KEY ("bloqueurId","bloqueId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_cle_key" ON "Conversation"("cle");

-- CreateIndex
CREATE INDEX "Conversation_dernierMessageLe_idx" ON "Conversation"("dernierMessageLe");

-- CreateIndex
CREATE INDEX "ParticipantConversation_utilisateurId_idx" ON "ParticipantConversation"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantConversation_conversationId_utilisateurId_key" ON "ParticipantConversation"("conversationId", "utilisateurId");

-- CreateIndex
CREATE INDEX "Message_conversationId_creeLe_idx" ON "Message"("conversationId", "creeLe");

-- CreateIndex
CREATE INDEX "Message_auteurId_creeLe_idx" ON "Message"("auteurId", "creeLe");

-- CreateIndex
CREATE INDEX "SignalementMessage_traiteLe_idx" ON "SignalementMessage"("traiteLe");

-- CreateIndex
CREATE UNIQUE INDEX "SignalementMessage_messageId_auteurId_key" ON "SignalementMessage"("messageId", "auteurId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantConversation" ADD CONSTRAINT "ParticipantConversation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantConversation" ADD CONSTRAINT "ParticipantConversation_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_reponseAId_fkey" FOREIGN KEY ("reponseAId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalementMessage" ADD CONSTRAINT "SignalementMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalementMessage" ADD CONSTRAINT "SignalementMessage_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocage" ADD CONSTRAINT "Blocage_bloqueurId_fkey" FOREIGN KEY ("bloqueurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocage" ADD CONSTRAINT "Blocage_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- L'API REST de Supabase reste fermée : aucune politique, accès par le serveur seulement.
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ParticipantConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SignalementMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Blocage" ENABLE ROW LEVEL SECURITY;
