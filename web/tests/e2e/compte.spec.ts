import { type Browser, expect, type Page, test } from "@playwright/test";
import { D, seConnecter } from "./outils";

/** « Mon compte » : changement de mot de passe, appareils connectés, purge protégée. */

test.describe.configure({ mode: "serial" });

async function session(browser: Browser, identifiant: string) {
  const page = await (await browser.newContext()).newPage();
  await seConnecter(page, identifiant);
  return page;
}

async function changer(page: Page, actuel: string, nouveau: string) {
  await page.locator("#actuel").fill(actuel);
  await page.locator("#nouveau").fill(nouveau);
  await page.locator("#confirmation").fill(nouveau);
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
}

test("changer son mot de passe exige l'actuel et déconnecte les autres appareils", async ({
  browser,
}) => {
  const nouveau = "Nouveau-Essai-2027";
  const ici = await session(browser, D.comptes.caisse);
  const ailleurs = await session(browser, D.comptes.caisse);
  await ici.goto("/admin/compte");
  await ici.waitForLoadState("networkidle");
  await expect(ici.getByText("Cet appareil")).toBeVisible();
  await expect(ici.getByRole("button", { name: "Déconnecter les autres" })).toBeVisible();

  await changer(ici, "Pas-le-bon-2026", nouveau);
  await expect(ici.getByText("Mot de passe actuel incorrect.")).toBeVisible();

  await changer(ici, D.motDePasse, nouveau);
  await expect(ici.getByText(/Mot de passe modifié/)).toBeVisible();

  // L'autre appareil a perdu sa session.
  await ailleurs.goto("/admin");
  await ailleurs.waitForURL(/\/connexion/);

  // Retour au mot de passe de test, vérifié par une nouvelle connexion.
  await ici.reload();
  await ici.waitForLoadState("networkidle");
  await changer(ici, nouveau, D.motDePasse);
  await expect(ici.getByText(/Mot de passe modifié/)).toBeVisible();
  await session(browser, D.comptes.caisse);
});

test("l'étudiant retrouve son identité dans « Mon compte »", async ({ browser }) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant");
  await a.getByRole("link", { name: /Mon compte/ }).click();
  await expect(a.getByRole("heading", { name: "Mon compte", level: 1 })).toBeVisible();
  await expect(a.getByRole("definition").filter({ hasText: D.comptes.etudiantA })).toBeVisible();
});

test("la purge planifiée refuse tout appel sans le secret", async ({ request }) => {
  const essais: Record<string, string>[] = [{}, { authorization: "Bearer devine" }];
  for (const headers of essais) {
    const r = await request.get("/api/taches/purge", { headers });
    expect([401, 503]).toContain(r.status());
  }
});
