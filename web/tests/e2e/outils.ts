import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

type Donnees = {
  motDePasse: string;
  comptes: Record<
    "admin" | "gestionnaire" | "caisse" | "prof" | "autreProf" | "etudiantA" | "etudiantB",
    string
  >;
  ids: Record<
    | "gestionnaire"
    | "campagne"
    | "coursOffert"
    | "evaluationPubliee"
    | "evaluationBrouillon"
    | "recuA"
    | "documentA"
    | "codeDocumentA"
    | "promotion"
    | "etudiantB"
    | "seance"
    | "niveau"
    | "promotionLibelle",
    string
  >;
};

/** Données créées par tests/e2e/preparer.ts. */
export const D: Donnees = JSON.parse(readFileSync(path.join(__dirname, ".donnees.json"), "utf8"));

let adresse = 0;

/** Se connecte ; chaque connexion utilise une adresse IP distincte (limite de tentatives). */
export async function seConnecter(page: Page, identifiant: string) {
  adresse += 1;
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `10.20.${Math.floor(adresse / 250)}.${adresse % 250}`,
  });
  await page.goto("/connexion");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill(identifiant);
  await page.locator("#motDePasse").fill(D.motDePasse);
  await page.locator("button[type=submit]").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/connexion"));
}

/** La page est refusée : redirection vers « accès refusé » ou page introuvable. */
export async function attendreRefus(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /ne vous est pas ouverte|introuvable|n'existe pas/i,
  );
}

/**
 * Lien de confirmation d'adresse pour un compte de la base de TEST : les
 * emails n'étant pas envoyés en test, le jeton est créé directement.
 */
export async function lienConfirmation(email: string) {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  if (!url || /supabase|neon\.tech/.test(url)) throw new Error("Base de test requise.");
  const { Client } = await import("pg");
  const { createHash, randomBytes } = await import("node:crypto");
  const jeton = randomBytes(32).toString("base64url");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    const r = await c.query<{ id: string }>(`SELECT id FROM "Utilisateur" WHERE email = $1`, [
      email,
    ]);
    if (!r.rows[0]) throw new Error(`Aucun compte pour ${email}`);
    await c.query(
      `INSERT INTO "JetonReinitialisation" (id, "jetonHash", "utilisateurId", "expireLe")
       VALUES ($1, $2, $3, now() + interval '1 hour')`,
      [
        `e2e${randomBytes(8).toString("hex")}`,
        createHash("sha256").update(`confirmation:${jeton}`).digest("hex"),
        r.rows[0].id,
      ],
    );
  } finally {
    await c.end();
  }
  return `/confirmer-email/${jeton}`;
}

/** Lien de retrait de l'annuaire pour un ancien de la base de TEST (les emails ne partent pas). */
export async function lienRetraitAncien(email: string) {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  if (!url || /supabase|neon\.tech/.test(url)) throw new Error("Base de test requise.");
  const { Client } = await import("pg");
  const { createHash, randomBytes } = await import("node:crypto");
  const jeton = randomBytes(32).toString("base64url");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    const r = await c.query(
      `UPDATE "Ancien" SET "jetonRetraitHash" = $1 WHERE email = $2 AND statut = 'PUBLIE'`,
      [createHash("sha256").update(`retrait:${jeton}`).digest("hex"), email],
    );
    if (r.rowCount !== 1) throw new Error(`Aucune fiche publiée pour ${email}`);
  } finally {
    await c.end();
  }
  return `/anciens/retrait/${jeton}`;
}
