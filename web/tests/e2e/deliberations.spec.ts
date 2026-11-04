import { type Browser, expect, type Page, test } from "@playwright/test";
import { attendreRefus, D, seConnecter } from "./outils";

/**
 * Délibération annuelle de bout en bout : calcul, décision du jury motivée,
 * clôture, proclamation, bulletin vérifiable, cloisonnement des résultats.
 */

test.describe.configure({ mode: "serial" });

async function session(browser: Browser, identifiant: string) {
  const page = await (await browser.newContext()).newPage();
  await seConnecter(page, identifiant);
  return page;
}

let deliberation = "";
let resultatA = "";
let bulletinA = "";

const ligne = (page: Page, nom: string) => page.getByRole("row", { name: new RegExp(nom) });

test("le secrétariat prépare la délibération annuelle", async ({ browser }) => {
  const admin = await session(browser, D.comptes.admin);
  await admin.goto("/admin/deliberations/reglement");
  await admin.waitForLoadState("networkidle");
  await admin.getByRole("button", { name: "Enregistrer le règlement" }).click();
  await expect(admin.getByText(/Règlement enregistré/)).toBeVisible();

  await admin.goto("/admin/deliberations");
  await admin.waitForLoadState("networkidle");
  await admin
    .getByRole("row", { name: new RegExp(D.ids.promotionLibelle) })
    .getByRole("button", { name: "Préparer : année" })
    .click();
  await admin.waitForURL(/\/admin\/deliberations\/[^/?]+$/);
  deliberation = new URL(admin.url()).pathname.split("/").pop()!;
  await expect(ligne(admin, "ETUDIANT-A")).toContainText("ADM");
  await expect(ligne(admin, "ETUDIANT-B")).toContainText("RATTRAPAGE");
});

test("une décision du jury exige un motif, puis le jury est clôturé et proclamé", async ({
  browser,
}) => {
  const admin = await session(browser, D.comptes.admin);
  await admin.goto(`/admin/deliberations/${deliberation}`);
  await admin.waitForLoadState("networkidle");
  const b = ligne(admin, "ETUDIANT-B");
  await b.getByText("Décision du jury").click();
  await b.getByLabel("Décision", { exact: true }).selectOption("COMP");
  await b.getByRole("button", { name: "Appliquer" }).click();
  await expect(b.getByText(/Indiquez le motif/)).toBeVisible();
  await b.getByLabel(/Motif/).fill("Assiduité et progression remarquables au second semestre");
  await b.getByRole("button", { name: "Appliquer" }).click();
  await expect(ligne(admin, "ETUDIANT-B")).toContainText("Proposée : RATTRAPAGE");

  // Sans jury renseigné, la clôture est refusée.
  await admin.getByRole("button", { name: "Clôturer le jury" }).click();
  await admin.getByRole("button", { name: "Confirmer" }).click();
  await expect(
    admin.getByText(/Indiquez le secrétaire et le président du jury/).first(),
  ).toBeVisible();
  await admin.locator("#secretaireJury").fill("Secrétaire de test");
  await admin.locator("#presidentJury").fill("Président de test");
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(admin.getByText(/Composition du jury enregistrée/)).toBeVisible();
  await admin.getByRole("button", { name: "Clôturer le jury" }).click();
  await admin
    .getByRole("button", { name: "Confirmer" })
    .click()
    .catch(() => undefined);
  await expect(admin.getByText(/Jury clôturé/).first()).toBeVisible();

  const pv = await admin.request.get(`/deliberations/${deliberation}/pv`);
  expect(pv.status()).toBe(200);
  const csv = await admin.request.get(`/deliberations/${deliberation}/export`);
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Décision du jury");

  await admin.getByRole("button", { name: "Proclamer les résultats" }).click();
  await admin
    .getByRole("button", { name: "Confirmer" })
    .click()
    .catch(() => undefined);
  await expect(admin.getByText(/bulletin\(s\) émis et vérifiables/)).toBeVisible();
});

test("l'étudiant consulte son résultat et télécharge un bulletin vérifiable", async ({
  browser,
}) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/resultats");
  await expect(a.getByText("Crédits validés vers la licence")).toBeVisible();
  const lien = a.getByRole("link", { name: /Résultat annuel/ }).first();
  resultatA = (await lien.getAttribute("href"))!;
  bulletinA = (await a
    .getByRole("link", { name: /Bulletin/ })
    .first()
    .getAttribute("href"))!;
  await a.goto(resultatA);
  await expect(a.getByText("Moyenne promo")).toBeVisible();
  await expect(a.getByText("ADM", { exact: true })).toBeVisible();
  await a.goto(bulletinA);
  await expect(a.getByRole("heading", { name: "Bulletin de notes" })).toBeVisible();
  const code = (await a.getByText(/^N° /).textContent())!.replace("N° ", "").trim();
  await a.goto(`/verifier/${code}`);
  await expect(a.getByRole("heading", { name: /Document authentique/ })).toBeVisible();
  await expect(a.getByText("Résultat annuel")).toBeVisible();
});

test("les résultats restent cloisonnés", async ({ browser }) => {
  const b = await session(browser, D.comptes.etudiantB);
  await b.goto("/etudiant/resultats");
  await expect(b.getByText("COMP", { exact: true })).toBeVisible();
  await b.goto(resultatA);
  await attendreRefus(b);
  await b.goto(bulletinA);
  await attendreRefus(b);
  expect((await b.request.get(`/deliberations/${deliberation}/export`)).status()).toBe(403);

  const prof = await session(browser, D.comptes.prof);
  await prof.goto(`/admin/deliberations/${deliberation}`);
  await attendreRefus(prof);
});
