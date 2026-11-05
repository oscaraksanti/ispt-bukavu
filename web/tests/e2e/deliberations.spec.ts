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

/** Émission directe d'un document depuis /admin/documents ; renvoie le message affiché. */
async function emettre(admin: Page, matricule: string, type: string) {
  await admin.goto("/admin/documents");
  await admin.waitForLoadState("networkidle");
  const formulaire = admin.locator("form", { has: admin.locator("#matricule") });
  await formulaire.locator("#matricule").fill(matricule);
  await formulaire.locator("#type").selectOption(type);
  await formulaire.getByRole("button", { name: "Émettre" }).click();
  const message = admin.getByRole("status").locator("p").first();
  await expect(message).toBeVisible();
  return (await message.textContent()) ?? "";
}

test("le secrétariat prépare la délibération annuelle", async ({ browser }) => {
  const admin = await session(browser, D.comptes.admin);
  // Avant toute proclamation, pas d'attestation de réussite.
  expect(await emettre(admin, D.comptes.etudiantA, "ATTESTATION_REUSSITE")).toMatch(
    /Aucun résultat annuel proclamé/,
  );

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

  // Le cours n'a que 50 % de ses évaluations publiées : la clôture est refusée.
  await admin.getByRole("button", { name: "Clôturer le jury" }).click();
  await admin
    .getByRole("button", { name: "Confirmer" })
    .click()
    .catch(() => undefined);
  await expect(admin.getByText(/ne totalisent pas 100 %/).first()).toBeVisible();

  // L'enseignant transmet la seconde évaluation ; le secrétariat la valide et la publie.
  const prof = await session(browser, D.comptes.prof);
  await prof.goto(
    `/enseignant/cours/${D.ids.coursOffert}/evaluations/${D.ids.evaluationBrouillon}`,
  );
  await prof.waitForLoadState("networkidle");
  await prof.getByRole("button", { name: "Transmettre au secrétariat" }).click();
  await prof.getByRole("button", { name: "Confirmer" }).click();
  await expect(prof.getByText("Notes transmises", { exact: true })).toBeVisible();
  await admin.goto(`/admin/notes/${D.ids.evaluationBrouillon}`);
  await admin.waitForLoadState("networkidle");
  await admin.getByRole("button", { name: "Valider", exact: true }).click();
  await expect(admin.getByRole("button", { name: "Publier aux étudiants" })).toBeVisible();
  await admin.getByRole("button", { name: "Publier aux étudiants" }).click();
  await admin.getByRole("button", { name: "Confirmer" }).click();
  await expect(admin.getByRole("button", { name: "Retirer la publication" })).toBeVisible();

  await admin.goto(`/admin/deliberations/${deliberation}`);
  await admin.waitForLoadState("networkidle");
  await admin.getByRole("button", { name: "Clôturer le jury" }).click();
  await admin
    .getByRole("button", { name: "Confirmer" })
    .click()
    .catch(() => undefined);
  await expect(admin.getByText(/Jury clôturé/).first()).toBeVisible();
  await expect(ligne(admin, "ETUDIANT-A")).toContainText("ADM");

  // Jury clôturé : les notes publiées du cours sont figées.
  await admin.goto(`/admin/notes/${D.ids.evaluationPubliee}`);
  await admin.waitForLoadState("networkidle");
  await admin.getByRole("button", { name: "Retirer la publication" }).click();
  await admin.getByRole("button", { name: "Confirmer" }).click();
  await expect(admin.getByText(/notes publiées sont figées/)).toBeVisible();
  await admin.goto(`/admin/deliberations/${deliberation}`);
  await admin.waitForLoadState("networkidle");

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

test("relevé et attestation reprennent le résultat proclamé, vérifiable en ligne", async ({
  browser,
}) => {
  const admin = await session(browser, D.comptes.admin);
  const releve = await emettre(admin, D.comptes.etudiantA, "RELEVE_NOTES");
  const code = releve.match(/code ([A-Z0-9-]{14})/)?.[1];
  expect(code, releve).toBeTruthy();
  await admin.goto(`/verifier/${code}`);
  await expect(admin.getByRole("heading", { name: /Document authentique/ })).toBeVisible();
  await expect(admin.getByText("14/20")).toBeVisible();
  await expect(admin.getByText("Décision du jury")).toBeVisible();
  // B a été admis par décision motivée du jury : l'attestation de réussite est délivrée.
  expect(await emettre(admin, D.comptes.etudiantB, "ATTESTATION_REUSSITE")).toMatch(
    /Attestation de réussite émis/,
  );
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
