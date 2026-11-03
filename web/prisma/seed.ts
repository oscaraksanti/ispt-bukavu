/**
 * Initialisation de la base : référentiels, rôles, contenus officiels.
 * Idempotent : peut être relancé sans effacer les modifications faites dans
 * l'administration (les contenus existants ne sont jamais écrasés).
 */
import "dotenv/config";
import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { PAGES } from "../src/features/contenu/definitions";
import { REGLAGES_INSTITUT } from "../src/features/contenu/reglages";
import { autorites, debouchesAnciens, filieres, stages } from "../src/contenu/institut";
import { adapterChaine } from "../src/lib/connexion";
import { PERMISSIONS, ROLES_PAR_DEFAUT } from "../src/lib/permissions";
import { PHOTOS_OFFICIELLES as PHOTOS } from "../src/features/medias/photos-officielles";

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DIRECT_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquante.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: adapterChaine(url) }),
});

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
    } else if (r.code === "enseignant") {
      // Correctif : un enseignant ne publie que pour ses cours, sans droit général sur la valve.
      await db.rolePermission.deleteMany({
        where: { roleId: existant.id, permissionCode: "valve.publier" },
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
    // Dénomination en usage à l'institut (horaires, registres).
    { code: "BAC1", libelle: "BAC 1", ordre: 1 },
    { code: "BAC2", libelle: "BAC 2", ordre: 2 },
    { code: "BAC3", libelle: "BAC 3", ordre: 3 },
    { code: "BAC4", libelle: "BAC 4", ordre: 4 },
  ];
  for (const n of niveaux) {
    await db.niveau.upsert({ where: { code: n.code }, update: {}, create: n });
  }
  const annees = [
    {
      libelle: "2025-2026",
      debut: new Date("2025-10-01"),
      fin: new Date("2026-09-30"),
      courante: false,
    },
    {
      libelle: "2026-2027",
      debut: new Date("2026-10-01"),
      fin: new Date("2027-09-30"),
      courante: true,
    },
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
    const chemin = path.join(process.cwd(), "public", "photos", fichier);
    const meta = await sharp(chemin).metadata();
    const taille = (await stat(chemin)).size;
    const dimensions = { largeur: meta.width ?? null, hauteur: meta.height ?? null, taille };
    const m = await db.media.upsert({
      where: { cle },
      update: dimensions,
      create: {
        cle,
        nomFichier: fichier,
        typeMime: "image/jpeg",
        ...dimensions,
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
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, resoudrePhotos(v, ids)]));
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
      ...stages.professionnel.lieux.map((nom) => ({
        nom,
        categorie: "STAGE_PROFESSIONNEL" as const,
      })),
      ...stages.pedagogique.lieux.map((nom) => ({ nom, categorie: "STAGE_PEDAGOGIQUE" as const })),
      ...debouchesAnciens.professionnels.map((nom) => ({ nom, categorie: "EMPLOYEUR" as const })),
      ...debouchesAnciens.enseignement.map((nom) => ({
        nom,
        categorie: "INSTITUTIONNEL" as const,
      })),
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
