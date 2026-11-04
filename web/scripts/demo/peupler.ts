/**
 * Données fictives de l'instance de démonstration : comptes de chaque profil,
 * deux promotions, un programme, un horaire, des notes, des paiements, des
 * communiqués et un dossier de candidature. Idempotent.
 *
 * Refuse de s'exécuter hors du mode démonstration (NEXT_PUBLIC_MODE_DEMO=1)
 * ou sur la base de production.
 */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { adapterChaine } from "../../src/lib/connexion";
import { MOT_DE_PASSE_DEMO } from "../../src/lib/demo";

/** Référence du projet Supabase de production : jamais de données fictives dessus. */
const REF_PRODUCTION = "iriqjblrocpjemwhlnnz";

export function baseDemo() {
  const url =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DIRECT_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante.");
  if (process.env.NEXT_PUBLIC_MODE_DEMO !== "1")
    throw new Error(
      "Refus : NEXT_PUBLIC_MODE_DEMO=1 est requis pour les données de démonstration.",
    );
  if (url.includes(REF_PRODUCTION)) throw new Error("Refus : base de production.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: adapterChaine(url) }) });
}

const NOMS = [
  ["BAHATI", "MUKENGERE", "Grâce", "F"],
  ["AMANI", "CIZUNGU", "Josué", "M"],
  ["MAPENDO", "NABINTU", "Esther", "F"],
  ["BISIMWA", "BAGULA", "David", "M"],
  ["ZAWADI", "M'MUHINDO", "Rachel", "F"],
  ["MUGISHO", "BAHIZI", "Patrick", "M"],
  ["NEEMA", "KAHINDO", "Sarah", "F"],
  ["BYAMUNGU", "CIRHUZA", "Emmanuel", "M"],
  ["FURAHA", "BUHENDWA", "Ruth", "F"],
  ["CIZA", "BALOLA", "Samuel", "M"],
  ["KAVIRA", "MASIKA", "Deborah", "F"],
  ["BARHAKOMERWA", "LWABOSHI", "Joël", "M"],
] as const;

const PROGRAMME = [
  { code: "DEMO-MAT", intitule: "Mathématiques appliquées", credits: 6 },
  { code: "DEMO-PHY", intitule: "Physique générale", credits: 6 },
  { code: "DEMO-INF", intitule: "Algorithmique et programmation", credits: 6 },
  { code: "DEMO-DES", intitule: "Dessin technique", credits: 6 },
  { code: "DEMO-COM", intitule: "Expression écrite et orale", credits: 6 },
];

/** Suite pseudo-aléatoire déterministe : les mêmes notes à chaque réinitialisation. */
function generateur(graine: number) {
  let x = graine;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

export async function peupler(db: PrismaClient) {
  const motDePasseHash = await hash(MOT_DE_PASSE_DEMO);

  async function compte(
    email: string | null,
    nom: string,
    prenom: string,
    roles: string[],
    postnom?: string,
  ) {
    const existant = email ? await db.utilisateur.findUnique({ where: { email } }) : null;
    const u =
      existant ??
      (await db.utilisateur.create({
        data: { email, nom, postnom: postnom ?? null, prenom, motDePasseHash, statut: "ACTIF" },
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

  const direction = await compte("demo.direction@example.org", "DIRECTION", "Démo", ["direction"]);
  const academique = await compte("demo.academique@example.org", "SECRETARIAT", "Démo", [
    "secretariat_academique",
  ]);
  await compte("demo.appariteur@example.org", "APPARITEUR", "Démo", ["section"]);
  const caisse = await compte("demo.caisse@example.org", "CAISSE", "Démo", ["caisse"]);
  const profs = [];
  for (const [email, nom, titre] of [
    ["demo.enseignant@example.org", "ENSEIGNANT", "CT"],
    ["demo.enseignant2@example.org", "ASSISTANT", "Ass."],
  ]) {
    const u = await compte(email, nom, "Démo", ["enseignant"]);
    profs.push(
      await db.profilEnseignant.upsert({
        where: { utilisateurId: u.id },
        update: {},
        create: { utilisateurId: u.id, titre, domaine: "Démonstration" },
      }),
    );
  }

  const annee = await db.anneeAcademique.findFirstOrThrow({ where: { courante: true } });
  const filieres = await db.filiere.findMany({ orderBy: { ordre: "asc" }, take: 2 });
  const bac1 = await db.niveau.findUniqueOrThrow({ where: { code: "BAC1" } });
  const tirer = generateur(2026);

  // Barème fictif, clairement signalé comme tel.
  await db.baremeFrais.deleteMany({
    where: { anneeId: annee.id, libelle: { startsWith: "Démo" } },
  });
  await db.baremeFrais.create({
    data: {
      anneeId: annee.id,
      niveauId: bac1.id,
      libelle: "Démo · frais académiques (montant fictif)",
      montant: 300,
    },
  });

  let numeroRecu = 1;
  for (const [indexFiliere, filiere] of filieres.entries()) {
    const promotion = await db.promotion.upsert({
      where: {
        filiereId_niveauId_anneeId: {
          filiereId: filiere.id,
          niveauId: bac1.id,
          anneeId: annee.id,
        },
      },
      update: {},
      create: { filiereId: filiere.id, niveauId: bac1.id, anneeId: annee.id },
    });

    // Étudiants : DEMO0001… pour la première promotion, DEMO0101… pour la seconde.
    const etudiants = [];
    for (const [i, [nom, postnom, prenom, sexe]] of NOMS.entries()) {
      const matricule = `DEMO${String(indexFiliere * 100 + i + 1).padStart(4, "0")}`;
      let profil = await db.profilEtudiant.findUnique({ where: { matricule } });
      if (!profil) {
        const u = await compte(null, nom, prenom, ["etudiant"], postnom);
        profil = await db.profilEtudiant.create({
          data: { utilisateurId: u.id, matricule, sexe },
        });
      }
      await db.inscription.upsert({
        where: { etudiantId_promotionId: { etudiantId: profil.id, promotionId: promotion.id } },
        update: {},
        create: {
          etudiantId: profil.id,
          promotionId: promotion.id,
          statut: i % 5 === 4 ? "EN_ATTENTE" : "EN_REGLE",
        },
      });
      etudiants.push(profil);
    }

    // Programme et enseignants.
    const offerts = [];
    for (const [k, p] of PROGRAMME.entries()) {
      const ue = await db.uniteEnseignement.upsert({
        where: { filiereId_code: { filiereId: filiere.id, code: p.code } },
        update: {},
        create: {
          code: p.code,
          intitule: p.intitule,
          filiereId: filiere.id,
          niveauId: bac1.id,
          semestre: 1,
          credits: p.credits,
        },
      });
      const cours =
        (await db.cours.findFirst({ where: { ueId: ue.id } })) ??
        (await db.cours.create({
          data: { ueId: ue.id, intitule: p.intitule, credits: p.credits, volumeHoraire: 60 },
        }));
      const offert = await db.coursOffert.upsert({
        where: { coursId_promotionId: { coursId: cours.id, promotionId: promotion.id } },
        update: {},
        create: { coursId: cours.id, promotionId: promotion.id },
      });
      const prof = profs[k < 3 ? 0 : 1];
      await db.coursEnseignant.upsert({
        where: { coursOffertId_enseignantId: { coursOffertId: offert.id, enseignantId: prof.id } },
        update: {},
        create: { coursOffertId: offert.id, enseignantId: prof.id },
      });
      offerts.push(offert);

      // Évaluations : publiées, sauf l'examen du dernier cours, transmis au secrétariat.
      for (const [intitule, type, ponderation] of [
        ["Interrogation 1", "INTERROGATION", 40],
        ["Examen", "EXAMEN", 60],
      ] as const) {
        const statut = k === PROGRAMME.length - 1 && type === "EXAMEN" ? "SOUMISE" : "PUBLIEE";
        const ev =
          (await db.evaluation.findFirst({ where: { coursOffertId: offert.id, intitule } })) ??
          (await db.evaluation.create({
            data: { coursOffertId: offert.id, intitule, type, ponderation, statut },
          }));
        for (const e of etudiants) {
          const valeur = Math.round(Math.min(20, Math.max(4, 6 + tirer() * 13)) * 2) / 2;
          await db.note.upsert({
            where: { evaluationId_etudiantId: { evaluationId: ev.id, etudiantId: e.id } },
            update: {},
            create: { evaluationId: ev.id, etudiantId: e.id, valeur },
          });
        }
      }
    }

    // Horaire : semaine en cours, deux plages par jour (08 h–12 h et 13 h–16 h, heure de Bukavu).
    await db.seance.deleteMany({ where: { coursOffertId: { in: offerts.map((o) => o.id) } } });
    const lundi = new Date();
    lundi.setUTCDate(lundi.getUTCDate() - ((lundi.getUTCDay() + 6) % 7));
    for (let jour = 0; jour < 5; jour++) {
      for (const [plage, [debut, fin]] of [
        [6, 10],
        [11, 14],
      ].entries()) {
        const d = new Date(lundi);
        d.setUTCDate(lundi.getUTCDate() + jour);
        d.setUTCHours(debut, 0, 0, 0);
        const f = new Date(d);
        f.setUTCHours(fin, 0, 0, 0);
        await db.seance.create({
          data: {
            coursOffertId: offerts[(jour * 2 + plage) % offerts.length].id,
            debut: d,
            fin: f,
            salle: `Salle ${indexFiliere + 1}0${plage + 1}`,
          },
        });
      }
    }

    // Paiements fictifs pour une partie des étudiants.
    for (const [i, e] of etudiants.entries()) {
      if (i % 3 === 2) continue;
      const numero = `DEMO-${String(indexFiliere + 1)}-${String(numeroRecu++).padStart(4, "0")}`;
      if (await db.paiement.findUnique({ where: { numeroRecu: numero } })) continue;
      await db.paiement.create({
        data: {
          etudiantId: e.id,
          anneeId: annee.id,
          montant: i % 2 ? 300 : 150,
          mode: i % 2 ? "BANQUE" : "MOBILE_MONEY",
          reference: `REF-DEMO-${numero}`,
          payeLe: new Date(Date.now() - (i + 1) * 3 * 86_400_000),
          numeroRecu: numero,
          enregistreParId: caisse.id,
        },
      });
    }

    // Communiqué de promotion et devoir.
    const titre = `Démo · Bienvenue en ${bac1.code} ${filiere.nomCourt}`;
    if (!(await db.communique.findFirst({ where: { titre } })))
      await db.communique.create({
        data: {
          titre,
          contenu:
            "Ce communiqué fictif illustre la valve numérique : il ne s'affiche qu'aux étudiants de la promotion, qui accusent lecture en l'ouvrant.",
          cible: "PROMOTION",
          promotionId: promotion.id,
          statut: "PUBLIE",
          publieLe: new Date(),
          auteurId: academique.id,
          validateurId: direction.id,
        },
      });
    if (!(await db.devoir.findFirst({ where: { coursOffertId: offerts[2].id } })))
      await db.devoir.create({
        data: {
          coursOffertId: offerts[2].id,
          titre: "Démo · Exercices d'algorithmique",
          consignes: "Résoudre les trois exercices du support et déposer un fichier PDF.",
          echeance: new Date(Date.now() + 7 * 86_400_000),
          creeParId: profs[0].utilisateurId,
        },
      });
  }

  const titreInstitut = "Démo · Ouverture de la plateforme";
  if (!(await db.communique.findFirst({ where: { titre: titreInstitut } })))
    await db.communique.create({
      data: {
        titre: titreInstitut,
        contenu:
          "Communiqué fictif adressé à tout l'institut. En démonstration, toutes les données sont fictives et réinitialisées chaque nuit.",
        cible: "INSTITUT",
        statut: "PUBLIE",
        epingle: true,
        publieLe: new Date(),
        auteurId: direction.id,
        validateurId: direction.id,
      },
    });

  // Galerie, offre et ancien fictifs, pour montrer le module d'insertion.
  if (!(await db.album.findUnique({ where: { slug: "demo-travaux-pratiques" } }))) {
    const photos = await db.media.findMany({
      where: { dossier: "photos-officielles" },
      orderBy: { nomFichier: "asc" },
      take: 8,
    });
    if (photos.length)
      await db.album.create({
        data: {
          slug: "demo-travaux-pratiques",
          titre: "Démo · L'institut en images",
          description: "Album de démonstration composé des photos livrées avec le site.",
          publie: true,
          medias: { create: photos.map((m, ordre) => ({ mediaId: m.id, ordre })) },
        },
      });
  }
  if (!(await db.offreInsertion.findFirst({ where: { titre: { startsWith: "Démo ·" } } })))
    await db.offreInsertion.create({
      data: {
        titre: "Démo · Stage de maintenance industrielle",
        type: "STAGE",
        organisation: "Entreprise fictive de démonstration",
        lieu: "Bukavu",
        description:
          "Offre fictive affichée en démonstration : deux mois d'immersion dans un atelier de maintenance, encadrés par un technicien.",
        emailCandidature: "stages@example.org",
        statut: "PUBLIEE",
        publieeLe: new Date(),
        filieres: { connect: filieres.map((f) => ({ id: f.id })) },
      },
    });
  if (!(await db.ancien.findFirst({ where: { email: "demo.ancien@example.org" } })))
    await db.ancien.create({
      data: {
        prenom: "Démo",
        nom: "ANCIEN",
        email: "demo.ancien@example.org",
        filiereId: filieres[0]?.id,
        anneeSortie: 2020,
        poste: "Fiche fictive de démonstration",
        statut: "PUBLIE",
        consentementLe: new Date(),
      },
    });

  // Campagne d'admission ouverte et un candidat avec un dossier en cours.
  let campagne = await db.campagneAdmission.findFirst({
    where: { anneeId: annee.id, statut: "OUVERTE" },
  });
  if (!campagne) {
    campagne = await db.campagneAdmission.create({
      data: {
        anneeId: annee.id,
        libelle: "Démo · Admissions en BAC1",
        ouverture: new Date(Date.now() - 30 * 86_400_000),
        cloture: new Date(Date.now() + 60 * 86_400_000),
        fraisInscription: 0,
        statut: "OUVERTE",
        filieres: { connect: filieres.map((f) => ({ id: f.id })) },
        pieces: {
          create: [
            { libelle: "Diplôme d'État ou attestation de réussite", ordre: 1 },
            { libelle: "Pièce d'identité", ordre: 2 },
          ],
        },
      },
    });
  }
  const candidat = await compte("demo.candidat@example.org", "CANDIDAT", "Démo", ["candidat"]);
  await db.utilisateur.update({ where: { id: candidat.id }, data: { emailVerifieLe: new Date() } });
  if (!(await db.candidature.findFirst({ where: { candidatId: candidat.id } })))
    await db.candidature.create({
      data: {
        numero: "DEMO-2026-0001",
        campagneId: campagne.id,
        candidatId: candidat.id,
        filiereId: filieres[0]?.id,
        nom: "CANDIDAT",
        prenom: "Démo",
      },
    });
}

if (require.main === module) {
  const db = baseDemo();
  peupler(db)
    .then(() => console.log("Données de démonstration prêtes."))
    .finally(() => db.$disconnect());
}
