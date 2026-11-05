/**
 * Données de test de bout en bout : comptes de chaque rôle, une promotion,
 * un cours, des notes publiées et en brouillon, un paiement et un document.
 * Idempotent. À n'exécuter que sur une base de test (jamais en production).
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { adapterChaine } from "../../src/lib/connexion";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquante.");
if (process.env.VERCEL || /supabase|neon\.tech/.test(url))
  throw new Error("Refus : ce script ne s'exécute que sur une base de test locale.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: adapterChaine(url) }) });

export const MOT_DE_PASSE = "Essai-E2E-2026";

async function compte(email: string | null, nom: string, roles: string[]) {
  const motDePasseHash = await hash(MOT_DE_PASSE);
  const existant = email ? await db.utilisateur.findUnique({ where: { email } }) : null;
  const u =
    existant ??
    (await db.utilisateur.create({
      data: { email, nom, prenom: "Test", motDePasseHash, statut: "ACTIF" },
    }));
  for (const code of roles) {
    const role = await db.role.findUniqueOrThrow({ where: { code } });
    await db.utilisateurRole.upsert({
      where: { utilisateurId_roleId: { utilisateurId: u.id, roleId: role.id } },
      update: {},
      create: { utilisateurId: u.id, roleId: role.id },
    });
  }
  return u;
}

async function etudiant(matricule: string, nom: string) {
  const existant = await db.profilEtudiant.findUnique({ where: { matricule } });
  if (existant) return existant;
  const u = await compte(null, nom, ["etudiant"]);
  return db.profilEtudiant.create({ data: { utilisateurId: u.id, matricule } });
}

async function enseignant(email: string, nom: string) {
  const u = await compte(email, nom, ["enseignant"]);
  return db.profilEnseignant.upsert({
    where: { utilisateurId: u.id },
    update: {},
    create: { utilisateurId: u.id },
  });
}

async function main() {
  const admin = await compte("e2e.admin@example.org", "ADMIN", ["super_admin"]);
  const gestionnaire = await compte("e2e.gestion@example.org", "GESTION", [
    "secretariat_administratif",
  ]);
  const prof = await enseignant("e2e.prof@example.org", "TITULAIRE");
  await enseignant("e2e.autre@example.org", "AUTRE");
  await compte("e2e.caisse@example.org", "CAISSE", ["caisse"]);
  const a = await etudiant("E2E0001", "ETUDIANT-A");
  const b = await etudiant("E2E0002", "ETUDIANT-B");

  const annee = await db.anneeAcademique.findFirstOrThrow({ where: { courante: true } });
  const niveau = await db.niveau.findUniqueOrThrow({ where: { code: "BAC1" } });
  const filiere = await db.filiere.findFirstOrThrow({ orderBy: { ordre: "asc" } });
  const promotion = await db.promotion.upsert({
    where: {
      filiereId_niveauId_anneeId: { filiereId: filiere.id, niveauId: niveau.id, anneeId: annee.id },
    },
    update: {},
    create: { filiereId: filiere.id, niveauId: niveau.id, anneeId: annee.id },
  });
  // Campagne d'admission ouverte, avec des frais de dossier et une pièce exigée.
  // Elle porte sur une autre filière que la promotion de test : les admis
  // inscrits par les tests n'en modifient donc pas l'effectif.
  const filiereAdmission = await db.filiere.findFirstOrThrow({
    where: { id: { not: filiere.id } },
    orderBy: { ordre: "asc" },
  });
  const campagne =
    (await db.campagneAdmission.findFirst({ where: { libelle: "Campagne E2E" } })) ??
    (await db.campagneAdmission.create({
      data: {
        libelle: "Campagne E2E",
        anneeId: annee.id,
        ouverture: new Date(Date.now() - 86_400_000),
        cloture: new Date(Date.now() + 60 * 86_400_000),
        fraisInscription: 10,
        statut: "OUVERTE",
        filieres: { connect: [{ id: filiereAdmission.id }] },
        pieces: { create: [{ libelle: "Pièce d'identité E2E", ordre: 0 }] },
      },
    }));

  // Délibérations rejouées à chaque passage des tests.
  await db.deliberation.deleteMany({ where: { promotionId: promotion.id } });
  for (const e of [a, b])
    await db.inscription.upsert({
      where: { etudiantId_promotionId: { etudiantId: e.id, promotionId: promotion.id } },
      update: {},
      create: { etudiantId: e.id, promotionId: promotion.id, statut: "EN_REGLE" },
    });

  const ue = await db.uniteEnseignement.upsert({
    where: { filiereId_code: { filiereId: filiere.id, code: "E2E101" } },
    update: {},
    create: {
      code: "E2E101",
      intitule: "UE de test",
      filiereId: filiere.id,
      niveauId: niveau.id,
      semestre: 1,
      credits: 4,
    },
  });
  const cours =
    (await db.cours.findFirst({ where: { ueId: ue.id } })) ??
    (await db.cours.create({
      data: { ueId: ue.id, intitule: "Cours de test E2E", credits: 4, volumeHoraire: 45 },
    }));
  const offert = await db.coursOffert.upsert({
    where: { coursId_promotionId: { coursId: cours.id, promotionId: promotion.id } },
    update: {},
    create: { coursId: cours.id, promotionId: promotion.id },
  });
  await db.coursEnseignant.upsert({
    where: { coursOffertId_enseignantId: { coursOffertId: offert.id, enseignantId: prof.id } },
    update: {},
    create: { coursOffertId: offert.id, enseignantId: prof.id },
  });

  // Séance d'hier, pour pouvoir faire l'appel.
  const hier = new Date(Date.now() - 86_400_000);
  hier.setUTCHours(6, 0, 0, 0);
  const seance =
    (await db.seance.findFirst({ where: { coursOffertId: offert.id } })) ??
    (await db.seance.create({
      data: {
        coursOffertId: offert.id,
        debut: hier,
        fin: new Date(hier.getTime() + 4 * 3600_000),
        salle: "Salle E2E",
      },
    }));

  // Remises à leur état initial à chaque préparation : le scénario des
  // délibérations fait publier l'évaluation en brouillon.
  const evaluation = async (intitule: string, statut: "PUBLIEE" | "BROUILLON", notes: number[]) => {
    const existante = await db.evaluation.findFirst({
      where: { coursOffertId: offert.id, intitule },
    });
    const ev = existante
      ? await db.evaluation.update({ where: { id: existante.id }, data: { statut } })
      : await db.evaluation.create({
          data: {
            coursOffertId: offert.id,
            intitule,
            type: "INTERROGATION",
            ponderation: 50,
            statut,
          },
        });
    for (const [i, e] of [a, b].entries())
      await db.note.upsert({
        where: { evaluationId_etudiantId: { evaluationId: ev.id, etudiantId: e.id } },
        update: { valeur: notes[i], absent: false },
        create: { evaluationId: ev.id, etudiantId: e.id, valeur: notes[i] },
      });
    return ev;
  };
  // Mêmes notes dans les deux évaluations : la moyenne du cours ne change pas
  // quand la seconde est publiée (A : 14, B : 9).
  const publiee = await evaluation("Interrogation publiée E2E", "PUBLIEE", [14, 9]);
  const brouillon = await evaluation("Interrogation brouillon E2E", "BROUILLON", [14, 9]);

  const recuA =
    (await db.paiement.findFirst({ where: { etudiantId: a.id } })) ??
    (await db.paiement.create({
      data: {
        etudiantId: a.id,
        anneeId: annee.id,
        montant: 100,
        mode: "BANQUE",
        reference: "E2E-REF-A",
        payeLe: new Date(),
        numeroRecu: "E2E-0001",
        enregistreParId: admin.id,
      },
    }));
  const docA =
    (await db.documentOfficiel.findFirst({ where: { etudiantId: a.id } })) ??
    (await db.documentOfficiel.create({
      data: {
        code: "E2EA-TEST-2345",
        type: "ATTESTATION_FREQUENTATION",
        etudiantId: a.id,
        emisParId: admin.id,
        donnees: {
          nom: "Test ETUDIANT-A",
          matricule: "E2E0001",
          sexe: null,
          dateNaissance: null,
          lieuNaissance: null,
          promotion: `${niveau.code} ${filiere.nomCourt}`,
          filiere: filiere.nom,
          niveau: niveau.libelle,
          annee: annee.libelle,
          seuil: 10,
        },
      },
    }));

  const donnees = {
    motDePasse: MOT_DE_PASSE,
    comptes: {
      admin: "e2e.admin@example.org",
      gestionnaire: "e2e.gestion@example.org",
      caisse: "e2e.caisse@example.org",
      prof: "e2e.prof@example.org",
      autreProf: "e2e.autre@example.org",
      etudiantA: "E2E0001",
      etudiantB: "E2E0002",
    },
    ids: {
      gestionnaire: gestionnaire.id,
      campagne: campagne.id,
      coursOffert: offert.id,
      evaluationPubliee: publiee.id,
      evaluationBrouillon: brouillon.id,
      recuA: recuA.id,
      documentA: docA.id,
      codeDocumentA: docA.code,
      promotion: promotion.id,
      etudiantB: b.id,
      seance: seance.id,
      niveau: niveau.id,
      promotionLibelle: `${niveau.code} ${filiere.nomCourt}`,
    },
  };
  await writeFile(path.join(__dirname, ".donnees.json"), JSON.stringify(donnees, null, 2));
  console.log("Données E2E prêtes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
