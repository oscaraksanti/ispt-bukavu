import { type Browser, expect, test } from "@playwright/test";
import { attendreRefus, D, seConnecter } from "./outils";

/** Devoirs (dépôt, cloisonnement des copies, correction) et appel des séances. */

test.describe.configure({ mode: "serial" });

async function session(browser: Browser, identifiant: string) {
  const page = await (await browser.newContext()).newPage();
  await seConnecter(page, identifiant);
  return page;
}

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
let devoirUrl = "";
let copieUrl = "";
const titre = `Devoir E2E ${Date.now()}`;

test("l'enseignant publie un devoir et les étudiants sont prévenus", async ({ browser }) => {
  const prof = await session(browser, D.comptes.prof);
  await prof.goto(`/enseignant/cours/${D.ids.coursOffert}/devoirs`);
  await prof.waitForLoadState("networkidle");
  await prof.locator("#titre").fill(titre);
  await prof.locator("#consignes").fill("Résoudre les exercices 1 à 3 du chapitre 2.");
  await prof.getByRole("button", { name: "Publier le devoir" }).click();
  await prof.waitForURL(/\/devoirs\/[^/]+$/);
  devoirUrl = new URL(prof.url()).pathname.replace("/enseignant/", "/etudiant/");

  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/notifications");
  await expect(
    a.getByRole("button", { name: new RegExp(`Nouveau devoir : ${titre}`) }),
  ).toBeVisible();
});

test("l'étudiant dépose sa copie, que personne d'autre ne peut ouvrir", async ({ browser }) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto(devoirUrl);
  await a.waitForLoadState("networkidle");
  await a
    .locator("#copie")
    .setInputFiles({ name: "copie.pdf", mimeType: "application/pdf", buffer: PDF });
  await a.getByRole("button", { name: "Déposer ma copie" }).click();
  await expect(a.getByText(/Copie déposée/)).toBeVisible();
  await a.reload();
  copieUrl = (await a.getByRole("link", { name: "copie.pdf" }).getAttribute("href")) ?? "";
  expect(copieUrl).toMatch(/^\/devoirs\/copie\//);
  expect((await a.request.get(copieUrl)).status()).toBe(200);

  const b = await session(browser, D.comptes.etudiantB);
  expect((await b.request.get(copieUrl)).status()).toBe(404);
  await b.goto(devoirUrl);
  await expect(b.getByText("Aucune copie déposée.")).toBeVisible();

  const autre = await session(browser, D.comptes.autreProf);
  expect((await autre.request.get(copieUrl)).status()).toBe(404);
  await autre.goto(devoirUrl.replace("/etudiant/", "/enseignant/"));
  await attendreRefus(autre);
});

test("la correction est transmise à l'étudiant", async ({ browser }) => {
  const prof = await session(browser, D.comptes.prof);
  await prof.goto(devoirUrl.replace("/etudiant/", "/enseignant/"));
  await prof.waitForLoadState("networkidle");
  expect((await prof.request.get(copieUrl)).status()).toBe(200);
  await prof.getByLabel("Note / 20").first().fill("15");
  await prof.getByRole("button", { name: "Enregistrer la correction" }).first().click();
  await expect(prof.getByText("Corrigé · 15/20")).toBeVisible();

  const a = await session(browser, D.comptes.etudiantA);
  await a.goto(devoirUrl);
  await expect(a.getByText("15/20")).toBeVisible();
  await expect(a.getByRole("button", { name: "Remplacer ma copie" })).toHaveCount(0);
  await a.goto("/etudiant/notifications");
  await expect(
    a.getByRole("button", { name: new RegExp(`Devoir corrigé : ${titre}`) }),
  ).toBeVisible();
});

test("l'appel d'une séance alimente l'assiduité de l'étudiant", async ({ browser }) => {
  const appel = `/enseignant/cours/${D.ids.coursOffert}/presences/${D.ids.seance}`;
  const autre = await session(browser, D.comptes.autreProf);
  await autre.goto(appel);
  await attendreRefus(autre);

  const prof = await session(browser, D.comptes.prof);
  await prof.goto(appel);
  await prof.waitForLoadState("networkidle");
  await prof
    .getByRole("group", { name: /ETUDIANT-A/ })
    .getByText("Absent", { exact: true })
    .click();
  await prof.getByRole("button", { name: "Enregistrer l'appel" }).click();
  await expect(prof.getByText(/Appel enregistré : 1 présent\(s\), 1 absent\(s\)/)).toBeVisible();

  const a = await session(browser, D.comptes.etudiantA);
  await a.goto(`/etudiant/cours/${D.ids.coursOffert}`);
  await expect(a.getByText("0 %")).toBeVisible();
  const b = await session(browser, D.comptes.etudiantB);
  await b.goto(`/etudiant/cours/${D.ids.coursOffert}`);
  await expect(b.getByText("100 %")).toBeVisible();
});
