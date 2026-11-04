/** Outils partagés par la sauvegarde et la restauration. */
import pg from "pg";

/** Même règle que src/lib/connexion.ts : TLS de Supabase accepté via libpq. */
export function chaineConnexion(url) {
  if (!url) throw new Error("Adresse de la base manquante (DATABASE_URL).");
  const u = new URL(url);
  if (u.searchParams.get("sslmode") === "require" && !u.searchParams.has("uselibpqcompat"))
    u.searchParams.set("uselibpqcompat", "true");
  return u.toString();
}

export async function connecter(url) {
  const client = new pg.Client({ connectionString: chaineConnexion(url) });
  await client.connect();
  return client;
}

/** Tables de l'application (schéma public), hors suivi des migrations. */
export async function tables(client) {
  const r = await client.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> '_prisma_migrations'
     order by table_name`,
  );
  return r.rows.map((x) => x.table_name);
}

/** Ordre d'insertion respectant les clés étrangères (parents d'abord). */
export async function ordreInsertion(client, noms) {
  const r = await client.query(
    `select cl.relname as enfant, cp.relname as parent
     from pg_constraint c
     join pg_class cl on cl.oid = c.conrelid
     join pg_class cp on cp.oid = c.confrelid
     join pg_namespace n on n.oid = cl.relnamespace
     where c.contype = 'f' and n.nspname = 'public' and cl.relname <> cp.relname`,
  );
  const dependances = new Map(noms.map((t) => [t, new Set()]));
  for (const { enfant, parent } of r.rows)
    if (dependances.has(enfant) && dependances.has(parent)) dependances.get(enfant).add(parent);
  const ordre = [];
  const restant = new Set(noms);
  while (restant.size) {
    const prets = [...restant].filter((t) => [...dependances.get(t)].every((p) => !restant.has(p)));
    if (!prets.length) throw new Error(`Dépendances circulaires : ${[...restant].join(", ")}`);
    for (const t of prets.sort()) {
      ordre.push(t);
      restant.delete(t);
    }
  }
  return ordre;
}

export async function migrationsAppliquees(client) {
  const r = await client.query(
    `select migration_name from "_prisma_migrations"
     where finished_at is not null and rolled_back_at is null order by migration_name`,
  );
  return r.rows.map((x) => x.migration_name);
}

const TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export function typeDepuisCle(cle) {
  return TYPES[cle.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

/** Accès au stockage Supabase (API REST, clé de service). */
export function stockageSupabase(url, cle, bucket) {
  const base = `${url.replace(/\/$/, "")}/storage/v1/object`;
  const entetes = { Authorization: `Bearer ${cle}`, apikey: cle };
  return {
    async lister(prefixe = "") {
      const cles = [];
      for (let offset = 0; ; offset += 1000) {
        const r = await fetch(`${base}/list/${bucket}`, {
          method: "POST",
          headers: { ...entetes, "Content-Type": "application/json" },
          body: JSON.stringify({ prefix: prefixe, limit: 1000, offset }),
        });
        if (!r.ok) throw new Error(`Stockage : liste impossible (${r.status})`);
        const elements = await r.json();
        for (const e of elements) {
          const chemin = prefixe ? `${prefixe}/${e.name}` : e.name;
          if (e.id === null) cles.push(...(await this.lister(chemin)));
          else cles.push(chemin);
        }
        if (elements.length < 1000) break;
      }
      return cles;
    },
    async lire(cleFichier) {
      const r = await fetch(`${base}/${bucket}/${cleFichier}`, { headers: entetes });
      if (!r.ok) throw new Error(`Stockage : lecture impossible de ${cleFichier} (${r.status})`);
      return { contenu: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") };
    },
    async ecrire(cleFichier, contenu, type) {
      const r = await fetch(`${base}/${bucket}/${cleFichier}`, {
        method: "POST",
        headers: {
          ...entetes,
          "Content-Type": type ?? typeDepuisCle(cleFichier),
          "x-upsert": "true",
        },
        body: new Uint8Array(contenu),
      });
      if (!r.ok) throw new Error(`Stockage : écriture impossible de ${cleFichier} (${r.status})`);
    },
  };
}
