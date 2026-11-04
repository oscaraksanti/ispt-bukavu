import { expect, test } from "@playwright/test";
import { attendreRefus, D, seConnecter } from "./outils";

/**
 * Examens : session, épreuves, conflits bloquant la publication, calendrier
 * de l'étudiant et de l'enseignant, export d'agenda, cloisonnement.
 */
test.describe.configure({ mode: "serial" });

const n = Date.now();
const libelle = `Session E2E ${n}`;
/** Jour J+offset au format AAAA-MM-JJ, heure de Bukavu. */
const jour = (offset: number) =>
  new Date(Date.now() + 2 * 3600_000 + offset * 86_400_000).toISOString().slice(0, 10);
let sessionId = "";

test("le secrétariat planifie, voit le conflit puis publie", async ({ page }) => {
  await seConnecter(page, D.comptes.admin);
  await page.goto("/admin/examens");
  await page.waitForLoadState("networkidle");
  await page.locator("#libelle").fill(libelle);
  await page.locator("#debut").fill(jour(1));
  await page.locator("#fin").fill(jour(10));
  await page.getByRole("button", { name: "Créer la session" }).click();
  await page.waitForURL(/\/admin\/examens\/[^/]+$/);
  sessionId = page.url().split("/").pop()!;
  await page.waitForLoadState("networkidle");

  const ajouter = async (debut: string, fin: string, salle: string) => {
    await page.locator("#nouvelle-cours").selectOption(D.ids.coursOffert);
    await page.locator("#nouvelle-jour").fill(jour(3));
    await page.locator("#nouvelle-debut").fill(debut);
    await page.locator("#nouvelle-fin").fill(fin);
    await page.locator("#nouvelle-salle").fill(salle);
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page.getByText("Épreuve ajoutée.")).toBeVisible();
  };
  await ajouter("08:00", "11:00", "A1");
  await page.reload();
  await page.waitForLoadState("networkidle");
  // Même promotion, horaires qui se chevauchent : conflit.
  await ajouter("10:00", "12:00", "A2");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /1 conflit à résoudre/ })).toBeVisible();
  await page.getByRole("button", { name: "Publier le calendrier" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText(/Publication impossible : 1 conflit/)).toBeVisible();

  // Retrait de l'épreuve en trop, puis publication.
  await page
    .getByRole("listitem")
    .filter({ hasText: "Salle A2" })
    .getByRole("button", { name: /Supprimer l'épreuve/ })
    .click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByRole("heading", { name: /conflit/ })).toHaveCount(0);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Publier le calendrier" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByRole("button", { name: "Retirer la publication" })).toBeVisible();
});

test("l'étudiant voit son épreuve, reçoit la notification et exporte son agenda", async ({
  page,
}) => {
  await seConnecter(page, D.comptes.etudiantA);
  await page.goto("/etudiant/examens");
  await expect(page.getByText("Salle A1")).toBeVisible();
  await expect(page.getByText(libelle)).toBeVisible();
  const ics = await page.request.get("/etudiant/examens/agenda");
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  expect(await ics.text()).toContain("BEGIN:VEVENT");
  await page.goto("/etudiant/notifications");
  await expect(page.getByText("Calendrier des examens publié").first()).toBeVisible();
});

test("l'enseignant du cours le voit ; un collègue non concerné ne voit rien", async ({
  browser,
}) => {
  const prof = await browser.newPage();
  await seConnecter(prof, D.comptes.prof);
  await prof.goto("/enseignant/examens");
  await expect(prof.getByText("Mon cours").first()).toBeVisible();

  const autre = await browser.newPage();
  await seConnecter(autre, D.comptes.autreProf);
  await autre.goto("/enseignant/examens");
  await expect(autre.getByText("Salle A1")).toHaveCount(0);
  await autre.goto("/admin/examens");
  await attendreRefus(autre);
  await autre.goto(`/examens/${sessionId}/imprimer`);
  await attendreRefus(autre);
});

test("une modification après publication est signalée, puis la session est retirée", async ({
  page,
}) => {
  await seConnecter(page, D.comptes.admin);
  await page.goto(`/admin/examens/${sessionId}`);
  await page.waitForLoadState("networkidle");
  await page
    .getByText(/^Modifier/)
    .first()
    .click();
  const salle = page.locator('input[name="salle"]').first();
  await salle.fill("B2");
  await page.getByRole("button", { name: "Enregistrer" }).first().click();
  await expect(page.getByText("Épreuve modifiée.")).toBeVisible();

  const etudiant = await page.context().browser()!.newPage();
  await seConnecter(etudiant, D.comptes.etudiantA);
  await etudiant.goto("/etudiant/examens");
  await expect(etudiant.getByText("Salle B2")).toBeVisible();
  await expect(etudiant.getByText("Modifiée")).toBeVisible();

  await page.goto(`/examens/${sessionId}/imprimer`);
  await expect(page.getByRole("heading", { name: /Calendrier des examens/ })).toBeVisible();

  // Nettoyage : la session de test disparaît des espaces.
  await page.goto(`/admin/examens/${sessionId}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Retirer la publication" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByRole("button", { name: "Publier le calendrier" })).toBeVisible();
  await page.getByRole("button", { name: "Supprimer la session" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await page.waitForURL(/\/admin\/examens$/);
});
