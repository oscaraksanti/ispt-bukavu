/**
 * Réinitialisation nocturne de l'instance de démonstration : vide toutes les
 * tables, puis rejoue l'initialisation officielle et les données fictives.
 * Mêmes garde-fous que peupler.ts (mode démonstration, jamais la production).
 */
import { execSync } from "node:child_process";
import { baseDemo, peupler } from "./peupler";

async function main() {
  const db = baseDemo();
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length > 0)
    await db.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"public"."${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`,
    );
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  await peupler(db);
  await db.$disconnect();
  console.log("Démonstration réinitialisée.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
