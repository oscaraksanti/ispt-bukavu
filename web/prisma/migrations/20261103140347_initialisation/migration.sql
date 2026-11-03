-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('INVITE', 'ACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutPublication" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "CategoriePartenaire" AS ENUM ('STAGE_PROFESSIONNEL', 'STAGE_PEDAGOGIQUE', 'EMPLOYEUR', 'INSTITUTIONNEL');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('F', 'M');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'EN_REGLE', 'SUSPENDUE', 'DIPLOME', 'ABANDON');

-- CreateEnum
CREATE TYPE "StatutSeance" AS ENUM ('PREVUE', 'REPORTEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeSupport" AS ENUM ('FICHIER', 'LIEN');

-- CreateEnum
CREATE TYPE "TypeEvaluation" AS ENUM ('INTERROGATION', 'TRAVAUX_PRATIQUES', 'EXAMEN');

-- CreateEnum
CREATE TYPE "StatutEvaluation" AS ENUM ('BROUILLON', 'SOUMISE', 'VALIDEE', 'PUBLIEE');

-- CreateEnum
CREATE TYPE "CibleCommunique" AS ENUM ('PUBLIC', 'INSTITUT', 'FILIERE', 'PROMOTION', 'COURS');

-- CreateEnum
CREATE TYPE "StatutCommunique" AS ENUM ('BROUILLON', 'EN_VALIDATION', 'PUBLIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "StatutCampagne" AS ENUM ('BROUILLON', 'OUVERTE', 'FERMEE');

-- CreateEnum
CREATE TYPE "Devise" AS ENUM ('USD', 'CDF');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('BROUILLON', 'SOUMISE', 'EN_EXAMEN', 'COMPLEMENT', 'ADMISE', 'REFUSEE', 'INSCRITE', 'ABANDONNEE');

-- CreateEnum
CREATE TYPE "StatutPiece" AS ENUM ('DEPOSEE', 'ACCEPTEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('BANQUE', 'GUICHET', 'MOBILE_MONEY', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('ATTESTATION_FREQUENTATION', 'RELEVE_NOTES', 'ATTESTATION_REUSSITE');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'EMISE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "TypeStage" AS ENUM ('PEDAGOGIQUE', 'PROFESSIONNEL');

-- CreateEnum
CREATE TYPE "StatutStage" AS ENUM ('PREVU', 'EN_COURS', 'TERMINE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "postnom" TEXT,
    "prenom" TEXT,
    "telephone" TEXT,
    "motDePasseHash" TEXT,
    "statut" "StatutCompte" NOT NULL DEFAULT 'ACTIF',
    "emailVerifieLe" TIMESTAMP(3),
    "doitChangerMotDePasse" BOOLEAN NOT NULL DEFAULT false,
    "derniereConnexion" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "systeme" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionCode")
);

-- CreateTable
CREATE TABLE "UtilisateurRole" (
    "utilisateurId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UtilisateurRole_pkey" PRIMARY KEY ("utilisateurId","roleId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "jetonHash" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "agent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JetonReinitialisation" (
    "id" TEXT NOT NULL,
    "jetonHash" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "utiliseLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JetonReinitialisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativeConnexion" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "reussie" BOOLEAN NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativeConnexion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalActivite" (
    "id" TEXT NOT NULL,
    "auteurId" TEXT,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT,
    "avant" JSONB,
    "apres" JSONB,
    "ip" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalActivite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "lueLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reglage" (
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reglage_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "typeMime" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "largeur" INTEGER,
    "hauteur" INTEGER,
    "texteAlternatif" TEXT NOT NULL DEFAULT '',
    "legende" TEXT,
    "dossier" TEXT NOT NULL DEFAULT 'general',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creeParId" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutPublication" NOT NULL DEFAULT 'PUBLIE',
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlocPage" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "donnees" JSONB NOT NULL,

    CONSTRAINT "BlocPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actualite" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "resume" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "couvertureId" TEXT,
    "statut" "StatutPublication" NOT NULL DEFAULT 'BROUILLON',
    "publieLe" TIMESTAMP(3),
    "auteurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actualite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "lieu" TEXT,
    "statut" "StatutPublication" NOT NULL DEFAULT 'PUBLIE',

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumMedia" (
    "albumId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AlbumMedia_pkey" PRIMARY KEY ("albumId","mediaId")
);

-- CreateTable
CREATE TABLE "Partenaire" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" "CategoriePartenaire" NOT NULL,
    "logoId" TEXT,
    "siteWeb" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Partenaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Autorite" (
    "id" TEXT NOT NULL,
    "fonction" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "photoId" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Autorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionFrequente" (
    "id" TEXT NOT NULL,
    "rubrique" TEXT NOT NULL DEFAULT 'admissions',
    "question" TEXT NOT NULL,
    "reponse" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "QuestionFrequente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageContact" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "sujet" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "traite" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnneeAcademique" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "courante" BOOLEAN NOT NULL DEFAULT false,
    "seuilReussite" DECIMAL(4,2) NOT NULL DEFAULT 10,

    CONSTRAINT "AnneeAcademique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filiere" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomCourt" TEXT NOT NULL,
    "accroche" TEXT NOT NULL,
    "presentation" TEXT NOT NULL,
    "domaines" TEXT[],
    "metiers" TEXT[],
    "debouches" TEXT NOT NULL,
    "entreprendre" TEXT NOT NULL,
    "photoId" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "ouverte" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Filiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Niveau" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "Niveau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilEtudiant" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "sexe" "Sexe",
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,

    CONSTRAINT "ProfilEtudiant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "statut" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilEnseignant" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "titre" TEXT,
    "domaine" TEXT,

    CONSTRAINT "ProfilEnseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniteEnseignement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,

    CONSTRAINT "UniteEnseignement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cours" (
    "id" TEXT NOT NULL,
    "ueId" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "volumeHoraire" INTEGER NOT NULL,

    CONSTRAINT "Cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursOffert" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,

    CONSTRAINT "CoursOffert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursEnseignant" (
    "coursOffertId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "titulaire" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CoursEnseignant_pkey" PRIMARY KEY ("coursOffertId","enseignantId")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "coursOffertId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "salle" TEXT,
    "statut" "StatutSeance" NOT NULL DEFAULT 'PREVUE',
    "remarque" TEXT,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Support" (
    "id" TEXT NOT NULL,
    "coursOffertId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeSupport" NOT NULL,
    "mediaId" TEXT,
    "url" TEXT,
    "chapitre" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "coursOffertId" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "type" "TypeEvaluation" NOT NULL,
    "ponderation" DECIMAL(5,2) NOT NULL,
    "date" TIMESTAMP(3),
    "statut" "StatutEvaluation" NOT NULL DEFAULT 'BROUILLON',

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "valeur" DECIMAL(4,2),
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communique" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "cible" "CibleCommunique" NOT NULL,
    "filiereId" TEXT,
    "promotionId" TEXT,
    "coursOffertId" TEXT,
    "statut" "StatutCommunique" NOT NULL DEFAULT 'BROUILLON',
    "epingle" BOOLEAN NOT NULL DEFAULT false,
    "publieLe" TIMESTAMP(3),
    "expireLe" TIMESTAMP(3),
    "auteurId" TEXT NOT NULL,
    "validateurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceJointe" (
    "id" TEXT NOT NULL,
    "communiqueId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "PieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecture" (
    "communiqueId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "luLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("communiqueId","utilisateurId")
);

-- CreateTable
CREATE TABLE "CampagneAdmission" (
    "id" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ouverture" TIMESTAMP(3) NOT NULL,
    "cloture" TIMESTAMP(3) NOT NULL,
    "fraisInscription" DECIMAL(10,2) NOT NULL,
    "devise" "Devise" NOT NULL DEFAULT 'USD',
    "statut" "StatutCampagne" NOT NULL DEFAULT 'BROUILLON',

    CONSTRAINT "CampagneAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceExigee" (
    "id" TEXT NOT NULL,
    "campagneId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "obligatoire" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PieceExigee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "campagneId" TEXT NOT NULL,
    "candidatId" TEXT NOT NULL,
    "filiereId" TEXT,
    "nom" TEXT,
    "postnom" TEXT,
    "prenom" TEXT,
    "sexe" "Sexe",
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "nationalite" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ecoleOrigine" TEXT,
    "sectionHumanites" TEXT,
    "anneeDiplome" INTEGER,
    "pourcentage" DECIMAL(5,2),
    "referencePaiement" TEXT,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'BROUILLON',
    "motifDecision" TEXT,
    "consentementLe" TIMESTAMP(3),
    "soumiseLe" TIMESTAMP(3),
    "decideLe" TIMESTAMP(3),
    "decideParId" TEXT,
    "etudiantId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceDeposee" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "pieceExigeeId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "statut" "StatutPiece" NOT NULL DEFAULT 'DEPOSEE',
    "commentaire" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PieceDeposee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueCandidature" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "statut" "StatutCandidature" NOT NULL,
    "commentaire" TEXT,
    "auteurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueCandidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaremeFrais" (
    "id" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "niveauId" TEXT,
    "filiereId" TEXT,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "devise" "Devise" NOT NULL DEFAULT 'USD',
    "echeance" TIMESTAMP(3),

    CONSTRAINT "BaremeFrais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "devise" "Devise" NOT NULL DEFAULT 'USD',
    "mode" "ModePaiement" NOT NULL,
    "reference" TEXT NOT NULL,
    "payeLe" TIMESTAMP(3) NOT NULL,
    "numeroRecu" TEXT NOT NULL,
    "enregistreParId" TEXT NOT NULL,
    "annuleLe" TIMESTAMP(3),
    "motifAnnulation" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exoneration" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "devise" "Devise" NOT NULL DEFAULT 'USD',
    "motif" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exoneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeDocument" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "motif" TEXT,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteLe" TIMESTAMP(3),

    CONSTRAINT "DemandeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentOfficiel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "demandeId" TEXT,
    "donnees" JSONB NOT NULL,
    "emisLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emisParId" TEXT,
    "revoqueLe" TIMESTAMP(3),
    "motifRevocation" TEXT,

    CONSTRAINT "DocumentOfficiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LieuStage" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeStage" NOT NULL,
    "adresse" TEXT,
    "contact" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "convention" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LieuStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "lieuId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "type" "TypeStage" NOT NULL,
    "debut" TIMESTAMP(3),
    "fin" TIMESTAMP(3),
    "encadreurId" TEXT,
    "statut" "StatutStage" NOT NULL DEFAULT 'PREVU',
    "rapportMediaId" TEXT,
    "note" DECIMAL(4,2),
    "appreciation" TEXT,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampagneAdmissionToFiliere" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampagneAdmissionToFiliere_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Session_jetonHash_key" ON "Session"("jetonHash");

-- CreateIndex
CREATE INDEX "Session_utilisateurId_idx" ON "Session"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "JetonReinitialisation_jetonHash_key" ON "JetonReinitialisation"("jetonHash");

-- CreateIndex
CREATE INDEX "TentativeConnexion_email_creeLe_idx" ON "TentativeConnexion"("email", "creeLe");

-- CreateIndex
CREATE INDEX "TentativeConnexion_ip_creeLe_idx" ON "TentativeConnexion"("ip", "creeLe");

-- CreateIndex
CREATE INDEX "JournalActivite_entite_entiteId_idx" ON "JournalActivite"("entite", "entiteId");

-- CreateIndex
CREATE INDEX "JournalActivite_creeLe_idx" ON "JournalActivite"("creeLe");

-- CreateIndex
CREATE INDEX "Notification_utilisateurId_lueLe_idx" ON "Notification"("utilisateurId", "lueLe");

-- CreateIndex
CREATE UNIQUE INDEX "Media_cle_key" ON "Media"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlocPage_pageId_cle_key" ON "BlocPage"("pageId", "cle");

-- CreateIndex
CREATE UNIQUE INDEX "Actualite_slug_key" ON "Actualite"("slug");

-- CreateIndex
CREATE INDEX "Actualite_statut_publieLe_idx" ON "Actualite"("statut", "publieLe");

-- CreateIndex
CREATE UNIQUE INDEX "Album_slug_key" ON "Album"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AnneeAcademique_libelle_key" ON "AnneeAcademique"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "Filiere_slug_key" ON "Filiere"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Niveau_code_key" ON "Niveau"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_filiereId_niveauId_anneeId_key" ON "Promotion"("filiereId", "niveauId", "anneeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilEtudiant_utilisateurId_key" ON "ProfilEtudiant"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilEtudiant_matricule_key" ON "ProfilEtudiant"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_etudiantId_promotionId_key" ON "Inscription"("etudiantId", "promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilEnseignant_utilisateurId_key" ON "ProfilEnseignant"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "UniteEnseignement_filiereId_code_key" ON "UniteEnseignement"("filiereId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CoursOffert_coursId_promotionId_key" ON "CoursOffert"("coursId", "promotionId");

-- CreateIndex
CREATE INDEX "Seance_debut_idx" ON "Seance"("debut");

-- CreateIndex
CREATE UNIQUE INDEX "Note_evaluationId_etudiantId_key" ON "Note"("evaluationId", "etudiantId");

-- CreateIndex
CREATE INDEX "Communique_statut_publieLe_idx" ON "Communique"("statut", "publieLe");

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_numero_key" ON "Candidature"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_etudiantId_key" ON "Candidature"("etudiantId");

-- CreateIndex
CREATE INDEX "Candidature_statut_idx" ON "Candidature"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_campagneId_candidatId_key" ON "Candidature"("campagneId", "candidatId");

-- CreateIndex
CREATE UNIQUE INDEX "PieceDeposee_candidatureId_pieceExigeeId_key" ON "PieceDeposee"("candidatureId", "pieceExigeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_numeroRecu_key" ON "Paiement"("numeroRecu");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentOfficiel_code_key" ON "DocumentOfficiel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentOfficiel_demandeId_key" ON "DocumentOfficiel"("demandeId");

-- CreateIndex
CREATE INDEX "_CampagneAdmissionToFiliere_B_index" ON "_CampagneAdmissionToFiliere"("B");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionCode_fkey" FOREIGN KEY ("permissionCode") REFERENCES "Permission"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JetonReinitialisation" ADD CONSTRAINT "JetonReinitialisation_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalActivite" ADD CONSTRAINT "JournalActivite_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlocPage" ADD CONSTRAINT "BlocPage_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actualite" ADD CONSTRAINT "Actualite_couvertureId_fkey" FOREIGN KEY ("couvertureId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actualite" ADD CONSTRAINT "Actualite_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumMedia" ADD CONSTRAINT "AlbumMedia_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumMedia" ADD CONSTRAINT "AlbumMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partenaire" ADD CONSTRAINT "Partenaire_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Autorite" ADD CONSTRAINT "Autorite_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filiere" ADD CONSTRAINT "Filiere_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilEtudiant" ADD CONSTRAINT "ProfilEtudiant_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilEnseignant" ADD CONSTRAINT "ProfilEnseignant_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniteEnseignement" ADD CONSTRAINT "UniteEnseignement_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniteEnseignement" ADD CONSTRAINT "UniteEnseignement_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cours" ADD CONSTRAINT "Cours_ueId_fkey" FOREIGN KEY ("ueId") REFERENCES "UniteEnseignement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursOffert" ADD CONSTRAINT "CoursOffert_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursOffert" ADD CONSTRAINT "CoursOffert_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursEnseignant" ADD CONSTRAINT "CoursEnseignant_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursEnseignant" ADD CONSTRAINT "CoursEnseignant_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "ProfilEnseignant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Support" ADD CONSTRAINT "Support_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Support" ADD CONSTRAINT "Support_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communique" ADD CONSTRAINT "Communique_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communique" ADD CONSTRAINT "Communique_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communique" ADD CONSTRAINT "Communique_coursOffertId_fkey" FOREIGN KEY ("coursOffertId") REFERENCES "CoursOffert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communique" ADD CONSTRAINT "Communique_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communique" ADD CONSTRAINT "Communique_validateurId_fkey" FOREIGN KEY ("validateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_communiqueId_fkey" FOREIGN KEY ("communiqueId") REFERENCES "Communique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_communiqueId_fkey" FOREIGN KEY ("communiqueId") REFERENCES "Communique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagneAdmission" ADD CONSTRAINT "CampagneAdmission_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceExigee" ADD CONSTRAINT "PieceExigee_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "CampagneAdmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "CampagneAdmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_decideParId_fkey" FOREIGN KEY ("decideParId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceDeposee" ADD CONSTRAINT "PieceDeposee_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "Candidature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceDeposee" ADD CONSTRAINT "PieceDeposee_pieceExigeeId_fkey" FOREIGN KEY ("pieceExigeeId") REFERENCES "PieceExigee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceDeposee" ADD CONSTRAINT "PieceDeposee_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueCandidature" ADD CONSTRAINT "HistoriqueCandidature_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "Candidature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaremeFrais" ADD CONSTRAINT "BaremeFrais_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaremeFrais" ADD CONSTRAINT "BaremeFrais_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaremeFrais" ADD CONSTRAINT "BaremeFrais_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_enregistreParId_fkey" FOREIGN KEY ("enregistreParId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exoneration" ADD CONSTRAINT "Exoneration_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exoneration" ADD CONSTRAINT "Exoneration_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeDocument" ADD CONSTRAINT "DemandeDocument_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentOfficiel" ADD CONSTRAINT "DocumentOfficiel_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentOfficiel" ADD CONSTRAINT "DocumentOfficiel_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "DemandeDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "ProfilEtudiant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_lieuId_fkey" FOREIGN KEY ("lieuId") REFERENCES "LieuStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "AnneeAcademique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_encadreurId_fkey" FOREIGN KEY ("encadreurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_rapportMediaId_fkey" FOREIGN KEY ("rapportMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampagneAdmissionToFiliere" ADD CONSTRAINT "_CampagneAdmissionToFiliere_A_fkey" FOREIGN KEY ("A") REFERENCES "CampagneAdmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampagneAdmissionToFiliere" ADD CONSTRAINT "_CampagneAdmissionToFiliere_B_fkey" FOREIGN KEY ("B") REFERENCES "Filiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;
