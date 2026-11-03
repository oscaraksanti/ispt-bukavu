/**
 * Initialisation de la base : référentiels, rôles, contenus officiels.
 * Idempotent : peut être relancé sans effacer les modifications faites dans
 * l'administration (les contenus existants ne sont jamais écrasés).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { PAGES } from "../src/features/contenu/definitions";
import { REGLAGES_INSTITUT } from "../src/features/contenu/reglages";
import { autorites, debouchesAnciens, filieres, stages } from "../src/contenu/institut";
import { PERMISSIONS, ROLES_PAR_DEFAUT } from "../src/lib/permissions";

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DIRECT_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquante.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

/** Textes alternatifs des photographies officielles. */
const PHOTOS: Record<string, string> = {
  "atelier-mecanique.jpg": "Étudiant au travail sur un tour dans l'atelier de mécanique.",
  "campus-batiment-allee.jpg": "Étudiants marchant le long d'un bâtiment du campus.",
  "campus-batiment-facade.jpg": "Façade d'un bâtiment du campus avec des étudiants au balcon, entourée de végétation.",
  "campus-entree-escalier.jpg": "Étudiants à l'entrée d'un bâtiment du campus, devant un escalier.",
  "campus-jardin-etudiants.jpg": "Étudiants échangeant dans le jardin, devant un bâtiment du campus.",
  "campus-panneau-entree.jpg": "Panneau d'entrée de l'institut présentant les filières organisées.",
  "collation-2026-corps-academique.jpg": "Membres du corps académique lors de la collation des grades 2026.",
  "collation-2026-jury.jpg": "Membre du jury annotant un mémoire.",
  "collation-2026-laureate-portrait.jpg": "Portrait d'une lauréate de la collation 2026, écharpe et bouquet de fleurs.",
  "collation-2026-laureats-exterieur.jpg": "Cinq lauréats en costume, casque et gilet, lors de la collation des grades 2026.",
  "collation-2026-laureats-portrait.jpg": "Deux lauréats souriants, casque sur la tête, lors de la collation 2026.",
  "collation-2026-laureats-salle.jpg": "Lauréats et membres du corps académique réunis en salle lors de la collation 2026.",
  "collation-2026-remise-casque-1.jpg": "Remise du casque à un lauréat lors de la collation des grades 2026.",
  "collation-2026-remise-casque-2.jpg": "Un professeur pose le casque sur la tête d'un lauréat.",
  "evenement-salle-public.jpg": "Présentation devant un public nombreux dans une salle de l'institut.",
  "presentation-projet-salle.jpg": "Présentation d'un projet technique devant un jury.",
  "promotion-photo-groupe.jpg": "Photo de groupe d'une promotion devant un bâtiment.",
  "salle-cours-examen.jpg": "Étudiants composant en salle de cours.",
  "salle-informatique-cours.jpg": "Étudiants travaillant sur ordinateur portable en salle de cours.",
  "stage-centrale-electrique.jpg": "Étudiants en tenue de travail et casque devant les installations d'une centrale électrique.",
  "stage-genie-civil-chantier.jpg": "Étudiants en casque et gilet de sécurité sur un chantier routier.",
  "tp-electronique.jpg": "Étudiants soudant des composants électroniques, multimètre à portée de main.",
  "tp-topographie-1.jpg": "Étudiant en gilet réfléchissant réglant un niveau topographique.",
  "tp-topographie-2.jpg": "Travaux pratiques de topographie : un étudiant règle un niveau sur trépied en plein air.",
  "tp-topographie-3.jpg": "Étudiant en casque visant à travers un niveau topographique.",
  "tp-topographie-4.jpg": "Groupe d'étudiants autour d'un niveau topographique en plein air.",
};

async function permissionsEtRoles() {
  for (const [code, p] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({
      where: { code },
      update: { libelle: p.libelle, domaine: p.domaine },
      create: { code, libelle: p.libelle, domaine: p.domaine },
    });
  }
  for (const r of ROLES_PAR_DEFAUT) {
    const existant = await db.role.findUnique({ where: { code: r.code } });
    if (!existant) {
      await db.role.create({
        data: {
          code: r.code,
          libelle: r.libelle,
          description: r.description,
          systeme: true,
          permissions: { create: r.permissions.map((permissionCode) => ({ permissionCode })) },
        },
      });
    } else if (r.code === "super_admin") {
      // L'administrateur technique conserve toujours toutes les permissions.
      for (const permissionCode of r.permissions) {
        await db.rolePermission.upsert({
          where: { roleId_permissionCode: { roleId: existant.id, permissionCode } },
          update: {},
          create: { roleId: existant.id, permissionCode },
        });
      }
    }
  }
}

async function referentiels() {
  const niveaux = [
    { code: "L1", libelle: "Licence 1", ordre: 1 },
    { code: "L2", libelle: "Licence 2", ordre: 2 },
    { code: "L3", libelle: "Licence 3", ordre: 3 },
    { code: "L4", libelle: "Licence 4", ordre: 4 },
  ];
  for (const n of niveaux) {
    await db.niveau.upsert({ where: { code: n.code }, update: {}, create: n });
  }
  const annees = [
    { libelle: "2025-2026", debut: new Date("2025-10-01"), fin: new Date("2026-09-30"), courante: false },
    { libelle: "2026-2027", debut: new Date("2026-10-01"), fin: new Date("2027-09-30"), courante: true },
  ];
  for (const a of annees) {
    await db.anneeAcademique.upsert({ where: { libelle: a.libelle }, update: {}, create: a });
  }
}

/** Enregistre les photographies officielles livrées avec le site. */
async function medias() {
  const ids: Record<string, string> = {};
  for (const [fichier, alt] of Object.entries(PHOTOS)) {
    const cle = `public/photos/${fichier}`;
    const m = await db.media.upsert({
      where: { cle },
      update: {},
      create: {
        cle,
        nomFichier: fichier,
        typeMime: "image/jpeg",
        taille: 0,
        texteAlternatif: alt,
        dossier: "photos-officielles",
      },
    });
    ids[fichier] = m.id;
  }
  return ids;
}

function resoudrePhotos(valeur: unknown, ids: Record<string, string>): unknown {
  if (typeof valeur === "string" && valeur.startsWith("photo:")) {
    return ids[valeur.slice("photo:".length)] ?? null;
  }
  if (Array.isArray(valeur)) return valeur.map((v) => resoudrePhotos(v, ids));
  if (valeur && typeof valeur === "object") {
    return Object.fromEntries(
      Object.entries(valeur).map(([k, v]) => [k, resoudrePhotos(v, ids)]),
    );
  }
  return valeur;
}

async function contenus(ids: Record<string, string>) {
  await db.reglage.upsert({
    where: { cle: REGLAGES_INSTITUT.cle },
    update: {},
    create: { cle: REGLAGES_INSTITUT.cle, valeur: REGLAGES_INSTITUT.defaut as object },
  });

  for (const page of PAGES) {
    const p = await db.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: { slug: page.slug, titre: page.titre },
    });
    for (const [ordre, bloc] of page.blocs.entries()) {
      await db.blocPage.upsert({
        where: { pageId_cle: { pageId: p.id, cle: bloc.cle } },
        update: {},
        create: {
          pageId: p.id,
          cle: bloc.cle,
          ordre,
          donnees: resoudrePhotos(bloc.defaut, ids) as object,
        },
      });
    }
  }

  for (const [ordre, f] of filieres.entries()) {
    const fichier = f.photo.src.split("/").pop()!;
    await db.filiere.upsert({
      where: { slug: f.slug },
      update: {},
      create: {
        slug: f.slug,
        nom: f.nom,
        nomCourt: f.nomCourt,
        accroche: f.accroche,
        presentation: f.presentation,
        domaines: [...f.domaines],
        metiers: [...f.metiers],
        debouches: f.debouches,
        entreprendre: f.entreprendre,
        photoId: ids[fichier] ?? null,
        ordre,
      },
    });
  }

  if ((await db.autorite.count()) === 0) {
    await db.autorite.createMany({
      data: autorites.map((a, ordre) => ({ fonction: a.fonction, nom: a.nom, ordre })),
    });
  }

  if ((await db.partenaire.count()) === 0) {
    const lignes = [
      ...stages.professionnel.lieux.map((nom) => ({ nom, categorie: "STAGE_PROFESSIONNEL" as const })),
      ...stages.pedagogique.lieux.map((nom) => ({ nom, categorie: "STAGE_PEDAGOGIQUE" as const })),
      ...debouchesAnciens.professionnels.map((nom) => ({ nom, categorie: "EMPLOYEUR" as const })),
      ...debouchesAnciens.enseignement.map((nom) => ({ nom, categorie: "INSTITUTIONNEL" as const })),
    ];
    await db.partenaire.createMany({ data: lignes.map((l, ordre) => ({ ...l, ordre })) });
  }
}

async function administrateur() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) return;
  const role = await db.role.findUniqueOrThrow({ where: { code: "super_admin" } });
  const motDePasse = process.env.ADMIN_MOT_DE_PASSE;
  const existant = await db.utilisateur.findUnique({ where: { email } });
  if (existant) return;
  await db.utilisateur.create({
    data: {
      email,
      nom: "Administrateur",
      prenom: "Technique",
      statut: motDePasse ? "ACTIF" : "INVITE",
      motDePasseHash: motDePasse ? await hash(motDePasse) : null,
      roles: { create: { roleId: role.id } },
    },
  });
}

async function main() {
  await permissionsEtRoles();
  await referentiels();
  const ids = await medias();
  await contenus(ids);
  await administrateur();
  console.log("Initialisation terminée.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
