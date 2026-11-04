/**
 * Sauvegarde complète de la plateforme : toutes les tables de la base et tous
 * les fichiers déposés (photos, pièces de candidature, supports, rapports).
 *
 *   node scripts/sauvegarde.mjs [dossier]
 *
 * Variables : DIRECT_URL ou DATABASE_URL (base à sauvegarder) ; SUPABASE_URL et
 * SUPABASE_SERVICE_ROLE_KEY pour les fichiers (sinon le dossier stockage-local).
 * Le dossier produit contient des données personnelles : il doit être chiffré
 * avant de quitter la machine (voir .github/workflows/sauvegarde.yml).
 */
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { connecter, migrationsAppliquees, stockageSupabase, tables } from "./sauvegarde-commun.mjs";

const horodatage = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const dossier = path.resolve(process.argv[2] ?? `sauvegarde-${horodatage}`);
const url =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;

async function fichiersLocaux(racine, prefixe = "") {
  const sortie = [];
  for (const e of await readdir(path.join(racine, prefixe), { withFileTypes: true }).catch(
    () => [],
  )) {
    const rel = prefixe ? `${prefixe}/${e.name}` : e.name;
    if (e.isDirectory()) sortie.push(...(await fichiersLocaux(racine, rel)));
    else sortie.push(rel);
  }
  return sortie;
}

async function main() {
  await mkdir(path.join(dossier, "base"), { recursive: true });
  const client = await connecter(url);
  const manifeste = { date: new Date().toISOString(), migrations: [], tables: {}, fichiers: {} };
  try {
    // Instantané cohérent : toutes les tables lues dans la même transaction.
    await client.query("begin isolation level repeatable read read only");
    manifeste.migrations = await migrationsAppliquees(client);
    for (const t of await tables(client)) {
      const r = await client.query(`select coalesce(json_agg(x), '[]') as l from "${t}" x`);
      const texte = JSON.stringify(r.rows[0].l);
      await writeFile(path.join(dossier, "base", `${t}.json`), texte);
      manifeste.tables[t] = {
        lignes: r.rows[0].l.length,
        sha256: createHash("sha256").update(texte).digest("hex"),
      };
    }
    await client.query("commit");
  } finally {
    await client.end();
  }

  const destination = path.join(dossier, "fichiers");
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const s = stockageSupabase(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.STOCKAGE_BUCKET ?? "medias",
    );
    for (const cle of await s.lister()) {
      const { contenu } = await s.lire(cle);
      await mkdir(path.dirname(path.join(destination, cle)), { recursive: true });
      await writeFile(path.join(destination, cle), contenu);
      manifeste.fichiers[cle] = createHash("sha256").update(contenu).digest("hex");
    }
  } else {
    const racine = path.join(process.cwd(), "stockage-local");
    if ((await stat(racine).catch(() => null))?.isDirectory()) {
      await cp(racine, destination, { recursive: true });
      for (const cle of await fichiersLocaux(destination)) manifeste.fichiers[cle] = "local";
    }
  }

  await writeFile(path.join(dossier, "manifeste.json"), JSON.stringify(manifeste, null, 2));
  const lignes = Object.values(manifeste.tables).reduce((n, t) => n + t.lignes, 0);
  console.log(
    `Sauvegarde terminée : ${Object.keys(manifeste.tables).length} tables, ${lignes} lignes, ${Object.keys(manifeste.fichiers).length} fichiers → ${dossier}`,
  );
}

main().catch((e) => {
  console.error("Échec de la sauvegarde :", e.message);
  process.exit(1);
});
