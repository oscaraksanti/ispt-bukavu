import { type Browser, expect, test } from "@playwright/test";
import { D, seConnecter } from "./outils";

/** Exports normalisés (Excel, CSV) et droit d'accès aux données personnelles. */

async function session(browser: Browser, identifiant: string) {
  const page = await (await browser.newContext()).newPage();
  await seConnecter(page, identifiant);
  return page;
}

test("le secrétariat télécharge le registre en Excel et en CSV", async ({ browser }) => {
  const admin = await session(browser, D.comptes.admin);
  await admin.goto("/admin/exports");
  await expect(admin.getByRole("heading", { name: "Registre des inscriptions" })).toBeVisible();

  const xlsx = await admin.request.get("/admin/exports/inscriptions?format=xlsx");
  expect(xlsx.status()).toBe(200);
  expect(xlsx.headers()["content-type"]).toContain("spreadsheetml");
  expect((await xlsx.body()).subarray(0, 2).toString()).toBe("PK");

  const csv = await admin.request.get("/admin/exports/inscriptions?format=csv");
  expect(csv.status()).toBe(200);
  const texte = await csv.text();
  expect(texte).toContain("Matricule");
  expect(texte).toContain(D.comptes.etudiantA);

  for (const type of ["effectifs", "notes", "resultats"])
    expect((await admin.request.get(`/admin/exports/${type}?format=csv`)).status()).toBe(200);
});

test("un enseignant ou un étudiant ne peut rien exporter", async ({ browser }) => {
  for (const compte of [D.comptes.prof, D.comptes.etudiantA]) {
    const page = await session(browser, compte);
    const r = await page.request.get("/admin/exports/inscriptions?format=csv");
    expect(r.status()).toBe(403);
  }
});

test("l'étudiant télécharge ses données, sans aucun secret", async ({ browser }) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/compte");
  await expect(a.getByRole("link", { name: "Télécharger mes données" })).toBeVisible();
  const r = await a.request.get("/compte/donnees");
  expect(r.status()).toBe(200);
  const texte = await r.text();
  const donnees = JSON.parse(texte);
  expect(donnees.scolarite.matricule).toBe(D.comptes.etudiantA);
  expect(texte).not.toContain("motDePasseHash");
  expect(texte).not.toContain("jetonHash");
  expect(texte).not.toContain("$argon2");

  // L'export d'un autre compte est réservé aux gestionnaires des comptes.
  const b = await session(browser, D.comptes.etudiantB);
  const refus = await b.request.get(`/admin/utilisateurs/${D.ids.gestionnaire}/donnees`);
  expect(refus.status()).toBe(403);
  const anonyme = await (
    await browser.newContext()
  ).request.get("/compte/donnees", {
    maxRedirects: 0,
  });
  expect([302, 303, 307, 401]).toContain(anonyme.status());
});
