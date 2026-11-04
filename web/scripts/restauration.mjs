/**
 * Restauration d'une sauvegarde produite par scripts/sauvegarde.mjs.
 *
 *   1. préparer une base vide au même niveau de migrations :  npx prisma migrate deploy
 *   2. node scripts/restauration.mjs <dossier> [--ecraser]
 *
 * Variables : DIRECT_URL ou DATABASE_URL (base cible) ; SUPABASE_URL et
 * SUPABASE_SERVICE_ROLE_KEY pour renvoyer les fichiers (sinon stockage-local).
 * Sans --ecraser, la restauration refuse une base qui contient déjà des données.
 */
import { createHash } from "node:crypto";
import { cp, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  connecter,
  migrationsAppliquees,
  ordreInsertion,
  stockageSupabase,
  tables,
} from "./sauvegarde-commun.mjs";

const dossier = process.argv[2] && path.resolve(process.argv[2]);
const ecraser = process.argv.includes("--ecraser");
const url =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const PAQUET = 500;

async function main() {
  if (!dossier) throw new Error("Indiquez le dossier de la sauvegarde.");
  const manifeste = JSON.parse(await readFile(path.join(dossier, "manifeste.json"), "utf8"));
  const client = await connecter(url);
  try {
    const cible = await migrationsAppliquees(client);
    const manquantes = manifeste.migrations.filter((m) => !cible.includes(m));
    if (manquantes.length)
      throw new Error(
        `La base cible n'a pas toutes les migrations de la sauvegarde (${manquantes.join(", ")}). Lancez d'abord « npx prisma migrate deploy ».`,
      );
    const noms = await tables(client);
    const absentes = Object.keys(manifeste.tables).filter((t) => !noms.includes(t));
    if (absentes.length) throw new Error(`Tables inconnues dans la cible : ${absentes.join(", ")}`);

    await client.query("begin");
    const occupees = [];
    for (const t of noms) {
      const r = await client.query(`select exists(select 1 from "${t}") as e`);
      if (r.rows[0].e) occupees.push(t);
    }
    if (occupees.length && !ecraser)
      throw new Error(
        `La base cible contient déjà des données (${occupees.slice(0, 5).join(", ")}…). Relancez avec --ecraser pour les remplacer.`,
      );
    if (occupees.length)
      await client.query(`truncate ${noms.map((t) => `"${t}"`).join(", ")} cascade`);

    for (const t of await ordreInsertion(client, Object.keys(manifeste.tables))) {
      const texte = await readFile(path.join(dossier, "base", `${t}.json`), "utf8");
      const empreinte = createHash("sha256").update(texte).digest("hex");
      if (empreinte !== manifeste.tables[t].sha256)
        throw new Error(`Fichier altéré : base/${t}.json (empreinte différente).`);
      const lignes = JSON.parse(texte);
      for (let i = 0; i < lignes.length; i += PAQUET)
        await client.query(
          `insert into "${t}" select * from json_populate_recordset(null::"${t}", $1::json)`,
          [JSON.stringify(lignes.slice(i, i + PAQUET))],
        );
      const n = (await client.query(`select count(*)::int as n from "${t}"`)).rows[0].n;
      if (n !== manifeste.tables[t].lignes)
        throw new Error(`${t} : ${n} lignes restaurées au lieu de ${manifeste.tables[t].lignes}.`);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    await client.end();
  }

  const source = path.join(dossier, "fichiers");
  const cles = Object.keys(manifeste.fichiers);
  if (cles.length && (await stat(source).catch(() => null))) {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const s = stockageSupabase(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        process.env.STOCKAGE_BUCKET ?? "medias",
      );
      for (const cle of cles) await s.ecrire(cle, await readFile(path.join(source, cle)));
    } else {
      await cp(source, path.join(process.cwd(), "stockage-local"), { recursive: true });
    }
  }
  const lignes = Object.values(manifeste.tables).reduce((n, t) => n + t.lignes, 0);
  console.log(
    `Restauration terminée : ${Object.keys(manifeste.tables).length} tables, ${lignes} lignes, ${cles.length} fichiers (sauvegarde du ${manifeste.date}).`,
  );
}

main().catch((e) => {
  console.error("Échec de la restauration :", e.message);
  process.exit(1);
});
