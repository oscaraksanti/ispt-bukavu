import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { D, seConnecter } from "./outils";

/** Contrôle automatique WCAG 2.2 AA (axe-core) des pages les plus consultées. */
const NORMES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.use({ contextOptions: { reducedMotion: "reduce" } });
test.setTimeout(120_000);

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
  "/aide",
  "/aide/etudiant",
  "/mentions-legales",
  "/confirmer-email/exemple-de-lien-0123456789",
  "/galerie",
  "/anciens",
  "/anciens/rejoindre",
  "/offres",
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
    "/etudiant/examens",
    "/etudiant/notes",
    "/etudiant/frais",
    "/etudiant/notifications",
    "/etudiant/resultats",
    "/etudiant/compte",
    "/etudiant/messages",
    "/etudiant/campus",
    "/etudiant/messages/nouveau",
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
    "/enseignant/examens",
    "/enseignant/compte",
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
    "/admin/demarrage",
    "/admin/documents",
    "/admin/pilotage",
    "/admin/utilisateurs",
    "/admin/notes",
    "/admin/notifications",
    "/admin/compte",
    "/admin/exports",
    "/admin/messagerie",
    "/admin/campus",
    "/admin/messagerie/signalements",
    "/admin/deliberations",
    "/admin/deliberations/reglement",
    "/admin/admissions",
    "/admin/examens",
    "/admin/galerie",
    "/admin/anciens",
    "/admin/offres",
    "/admin/finances",
    `/affiche/${D.ids.campagne}`,
  ]) {
    await page.goto(chemin);
    await analyser(page);
  }
});

test("menu du site sur téléphone : visible, accessible, avec la connexion", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "menu réservé aux petits écrans");
  await page.goto("/actualites");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "Connexion à votre espace" })).toBeVisible();
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const menu = page.getByRole("navigation", { name: "Menu" });
  await expect(menu).toBeVisible();
  // Le panneau couvre l'écran sous l'en-tête (et non une hauteur nulle).
  const boite = await page.locator("#menu-mobile").boundingBox();
  expect(boite?.height ?? 0).toBeGreaterThan(400);
  await expect(menu.getByRole("link", { name: "Formations" })).toBeVisible();
  await analyser(page);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});
