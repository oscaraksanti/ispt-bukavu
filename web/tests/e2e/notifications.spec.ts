import { type Browser, expect, type Page, test } from "@playwright/test";
import { D, seConnecter } from "./outils";

/**
 * Notifications de bout en bout : une action réelle du personnel prévient
 * les bons étudiants, et eux seuls ; ouvrir une notification la marque lue.
 */

async function nouvellePage(browser: Browser, identifiant: string) {
  const contexte = await browser.newContext();
  const page = await contexte.newPage();
  await seConnecter(page, identifiant);
  return page;
}

async function compteur(page: Page) {
  const etiquette = await page
    .getByRole("link", { name: /^Notifications/ })
    .getAttribute("aria-label");
  const m = etiquette?.match(/(\d+) non lue/);
  return m ? Number(m[1]) : 0;
}

test("un communiqué publié pour une promotion prévient ses étudiants", async ({ browser }) => {
  const titre = `Communiqué E2E ${Date.now()}`;
  // Point de départ connu : aucune notification non lue.
  const etudiant = await nouvellePage(browser, D.comptes.etudiantA);
  await etudiant.goto("/etudiant/notifications");
  await etudiant.waitForLoadState("networkidle");
  const toutLu = etudiant.getByRole("button", { name: "Tout marquer comme lu" });
  if (await toutLu.count()) {
    await toutLu.click();
    await expect(etudiant.getByText("Vous êtes à jour.")).toBeVisible();
  }
  const admin = await nouvellePage(browser, D.comptes.admin);
  await admin.goto("/admin/valve/nouveau");
  await admin.waitForLoadState("networkidle");
  await admin.locator("#titre").fill(titre);
  await admin.locator("#cible").selectOption("PROMOTION");
  await admin.locator("#promotionId").selectOption(D.ids.promotion);
  await admin.locator("#texte-communique").fill("Texte du communiqué de test de bout en bout.");
  await admin.getByRole("button", { name: "Publier" }).click();
  await admin.waitForURL(/\/admin\/valve\/[^/]+\?enregistre=1/);

  await etudiant.goto("/etudiant");
  const avant = await compteur(etudiant);
  expect(avant).toBe(1);
  await etudiant.getByRole("link", { name: /^Notifications/ }).click();
  await expect(etudiant).toHaveURL(/\/etudiant\/notifications$/);
  const ligne = etudiant.getByRole("button", { name: new RegExp(titre) });
  await expect(ligne).toBeVisible();
  await etudiant.waitForLoadState("networkidle");
  await ligne.click();
  // L'ouverture mène au communiqué et le marque lu.
  await expect(etudiant).toHaveURL(/\/etudiant\/valve\/[^/]+$/);
  await expect(etudiant.getByRole("heading", { name: titre })).toBeVisible();
  expect(await compteur(etudiant)).toBe(avant - 1);

  // L'enseignant n'est pas destinataire d'un communiqué de promotion.
  const prof = await nouvellePage(browser, D.comptes.prof);
  await prof.goto("/enseignant/notifications");
  await expect(prof.getByText(titre)).toHaveCount(0);
});

test("un paiement enregistré prévient l'étudiant concerné, et lui seul", async ({ browser }) => {
  const reference = `E2E-${Date.now()}`;
  const admin = await nouvellePage(browser, D.comptes.admin);
  await admin.goto(`/admin/finances/etudiants/${D.ids.etudiantB}`);
  await admin.waitForLoadState("networkidle");
  await admin.locator("#montant").fill("25");
  await admin.locator("#reference").fill(reference);
  await admin.getByRole("button", { name: "Enregistrer et émettre le reçu" }).click();
  await expect(admin.getByText(/Paiement enregistré/)).toBeVisible();

  const b = await nouvellePage(browser, D.comptes.etudiantB);
  await b.goto("/etudiant/notifications");
  await expect(b.getByRole("button", { name: /Paiement enregistré/ }).first()).toBeVisible();

  const a = await nouvellePage(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/notifications");
  await expect(a.getByText(/Paiement enregistré/)).toHaveCount(0);
});

test("« Tout marquer comme lu » remet le compteur à zéro", async ({ browser }) => {
  const b = await nouvellePage(browser, D.comptes.etudiantB);
  await b.goto("/etudiant/notifications");
  await b.waitForLoadState("networkidle");
  const bouton = b.getByRole("button", { name: "Tout marquer comme lu" });
  if (await bouton.count()) await bouton.click();
  await expect(b.getByText("Vous êtes à jour.")).toBeVisible();
  expect(await compteur(b)).toBe(0);
});
