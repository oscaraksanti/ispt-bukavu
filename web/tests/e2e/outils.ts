import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

type Donnees = {
  motDePasse: string;
  comptes: Record<
    "admin" | "gestionnaire" | "prof" | "autreProf" | "etudiantA" | "etudiantB",
    string
  >;
  ids: Record<
    | "gestionnaire"
    | "coursOffert"
    | "evaluationPubliee"
    | "evaluationBrouillon"
    | "recuA"
    | "documentA"
    | "codeDocumentA"
    | "promotion"
    | "etudiantB",
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
