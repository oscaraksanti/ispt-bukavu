import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { D, seConnecter } from "./outils";

/** Contrôle automatique WCAG 2.2 AA (axe-core) des pages les plus consultées. */
const NORMES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.use({ contextOptions: { reducedMotion: "reduce" } });

async function analyser(page: Page) {
  await page.waitForLoadState("networkidle");
  // Cast : @axe-core/playwright embarque ses propres types de Playwright.
  const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0])
    .withTags(NORMES)
    .analyze();
  expect(
    r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}

for (const chemin of [
  "/",
  "/institut",
  "/formations",
  "/admissions",
  "/candidater",
  "/actualites",
  "/valve",
  "/contact",
  "/verifier",
  "/connexion",
]) {
  test(`page publique ${chemin}`, async ({ page }) => {
    await page.goto(chemin);
    await analyser(page);
  });
}

test("espace étudiant", async ({ page }) => {
  await seConnecter(page, D.comptes.etudiantA);
  for (const chemin of [
    "/etudiant",
    "/etudiant/horaire",
    "/etudiant/notes",
    "/etudiant/frais",
    "/etudiant/notifications",
    `/etudiant/cours/${D.ids.coursOffert}`,
  ]) {
    await page.goto(chemin);
    await analyser(page);
  }
});

test("espace enseignant", async ({ page }) => {
  await seConnecter(page, D.comptes.prof);
  for (const chemin of [
    "/enseignant",
    `/enseignant/cours/${D.ids.coursOffert}`,
    `/enseignant/cours/${D.ids.coursOffert}/devoirs`,
    `/enseignant/cours/${D.ids.coursOffert}/presences`,
    `/enseignant/cours/${D.ids.coursOffert}/presences/${D.ids.seance}`,
  ]) {
    await page.goto(chemin);
    await analyser(page);
  }
});

test("administration", async ({ page }) => {
  await seConnecter(page, D.comptes.admin);
  for (const chemin of [
    "/admin",
    "/admin/pilotage",
    "/admin/utilisateurs",
    "/admin/notes",
    "/admin/notifications",
  ]) {
    await page.goto(chemin);
    await analyser(page);
  }
});
