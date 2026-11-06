import { type Browser, expect, type Page, test } from "@playwright/test";
import { attendreRefus, D, seConnecter } from "./outils";

/**
 * Campus : règles à accepter, publication pour une promotion avec photo,
 * J'aime, commentaire et réponse, enregistrement, cloisonnement, épinglage,
 * signalement et masquage, validation préalable.
 */

test.describe.configure({ mode: "serial" });

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const TEXTE = "Qui a les notes du cours de test E2E ? Merci d'avance.";
let publication = "";
let photo = "";

async function session(browser: Browser, identifiant: string) {
  const page = await (await browser.newContext()).newPage();
  await seConnecter(page, identifiant);
  return page;
}

const carte = (page: Page, texte: string) => page.getByRole("article").filter({ hasText: texte });

test("un étudiant accepte les règles et publie pour sa promotion, avec une photo", async ({
  browser,
}) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/campus");
  await a.waitForLoadState("networkidle");
  await a.getByRole("button", { name: "J'ai lu et j'accepte les règles" }).click();
  await expect(a.getByLabel("Votre publication")).toBeVisible();
  await a.getByLabel("Votre publication").fill(TEXTE);
  await a.getByLabel("Visible par").selectOption({ label: D.ids.promotionLibelle });
  await a.locator('input[type="file"]').setInputFiles({
    name: "tableau.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await a.getByRole("button", { name: "Publier", exact: true }).click();
  await expect(a.getByText("Publié.")).toBeVisible();
  const c = carte(a, TEXTE);
  await expect(c).toBeVisible();
  publication = (await c.getByRole("link", { name: /à l'instant|il y a/ }).getAttribute("href"))!
    .split("/")
    .pop()!;
  photo = (await c.locator('a[href^="/campus/photos/"]').first().getAttribute("href"))!;
});

test("un camarade aime, commente, enregistre ; l'auteur est prévenu et répond", async ({
  browser,
}) => {
  const b = await session(browser, D.comptes.etudiantB);
  await b.goto("/etudiant/campus");
  await b.waitForLoadState("networkidle");
  const c = carte(b, TEXTE);
  await expect(c).toBeVisible();
  expect((await b.request.get(photo)).status()).toBe(200);

  const jaime = c.getByRole("button", { name: /J'aime/ });
  await jaime.click();
  await expect(jaime).toHaveAttribute("aria-pressed", "true");
  await expect(jaime).toContainText("1");

  await c.getByLabel("Écrire un commentaire").fill("Je te les envoie ce soir.");
  await c.getByRole("button", { name: "Publier" }).click();
  await expect(c.getByText("Je te les envoie ce soir.")).toBeVisible();

  // L'affichage change aussitôt : on attend la réponse du serveur avant de quitter la page.
  const enregistrement = b.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().includes("/etudiant/campus"),
  );
  await c.getByRole("button", { name: "Enregistrer" }).click();
  await expect(c.getByRole("button", { name: "Enregistré" })).toBeVisible();
  await enregistrement;
  await b.goto("/etudiant/campus?filtre=enregistres");
  await expect(carte(b, TEXTE)).toBeVisible();

  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/notifications");
  await expect(a.getByText(/a commenté votre publication/).first()).toBeVisible();
  await a.goto(`/etudiant/campus/${publication}`);
  await a.waitForLoadState("networkidle");
  await a.getByRole("button", { name: "Répondre" }).first().click();
  await a.getByLabel(/Répondre à/).fill("Merci beaucoup !");
  await a.getByRole("button", { name: "Publier" }).first().click();
  await expect(a.getByText("Merci beaucoup !")).toBeVisible();
});

test("une mention propose la personne et la prévient", async ({ browser }) => {
  const b = await session(browser, D.comptes.etudiantB);
  await b.goto(`/etudiant/campus/${publication}`);
  await b.waitForLoadState("networkidle");
  const champ = b.getByLabel("Écrire un commentaire");
  await champ.pressSequentially("Merci @Test TIT", { delay: 30 });
  const option = b.getByRole("option", { name: /Test TITULAIRE/ });
  await expect(option).toBeVisible();
  await option.click();
  await expect(champ).toHaveValue(/@Test TITULAIRE $/);
  await champ.pressSequentially("pour le TP.");
  await b.getByRole("button", { name: "Publier" }).last().click();
  await expect(b.getByText("@Test TITULAIRE", { exact: true })).toBeVisible();

  const prof = await session(browser, D.comptes.prof);
  await prof.goto("/enseignant/notifications");
  await expect(prof.getByText(/vous a mentionné dans un commentaire/).first()).toBeVisible();
});

test("hors de la promotion, la publication et sa photo restent invisibles", async ({ browser }) => {
  const autre = await session(browser, D.comptes.autreProf);
  await autre.goto("/enseignant/campus");
  await expect(autre.getByRole("heading", { name: "Campus", level: 1 })).toBeVisible();
  await expect(carte(autre, TEXTE)).toHaveCount(0);
  await autre.goto(`/enseignant/campus/${publication}`);
  await attendreRefus(autre);
  expect((await autre.request.get(photo)).status()).toBe(404);
});

test("la modération épingle, puis masque un contenu signalé", async ({ browser }) => {
  const admin = await session(browser, D.comptes.admin);
  await admin.goto("/admin/campus");
  await admin.waitForLoadState("networkidle");
  const c = carte(admin, TEXTE);
  await c.getByRole("button", { name: "Options de la publication" }).click();
  await admin.getByRole("button", { name: "Épingler en tête du Campus" }).click();
  await admin.reload();
  await expect(carte(admin, TEXTE).getByText("Épinglé par l'institut")).toBeVisible();

  const b = await session(browser, D.comptes.etudiantB);
  await b.goto("/etudiant/campus");
  await b.waitForLoadState("networkidle");
  await carte(b, TEXTE).getByRole("button", { name: "Options de la publication" }).click();
  // Le premier « Signaler » est celui du menu de la publication (les suivants : commentaires).
  await carte(b, TEXTE).getByRole("button", { name: "Signaler" }).first().click();
  await b.getByRole("button", { name: "Contenu inapproprié" }).click();
  await expect(b.getByText(/la modération va examiner ce contenu/)).toBeVisible();

  await admin.goto("/admin/messagerie/signalements");
  await admin.waitForLoadState("networkidle");
  const signale = admin.locator("#campus");
  await expect(signale.getByText(TEXTE)).toBeVisible();
  await signale.getByRole("button", { name: "Masquer" }).first().click();
  await admin.getByRole("button", { name: "Confirmer" }).click();
  await expect(signale.getByText("Aucun signalement en attente.")).toBeVisible();

  await b.reload();
  await expect(carte(b, TEXTE)).toHaveCount(0);
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/campus?filtre=miennes");
  await expect(carte(a, TEXTE).getByText(/Masquée/)).toBeVisible();
});

test("avec la validation préalable, une publication attend la modération", async ({ browser }) => {
  const admin = await session(browser, D.comptes.admin);
  await admin.goto("/admin/messagerie/signalements");
  await admin.waitForLoadState("networkidle");
  await admin.getByLabel(/Valider les publications des étudiants/).check();
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await expect(admin.getByText("Réglages du Campus enregistrés.")).toBeVisible();

  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/campus");
  await a.waitForLoadState("networkidle");
  await a.getByLabel("Votre publication").fill("Sortie de terrain samedi : qui vient ?");
  await a.getByRole("button", { name: "Publier", exact: true }).click();
  await expect(a.getByText(/paraîtra après validation/)).toBeVisible();

  const b = await session(browser, D.comptes.etudiantB);
  await b.goto("/etudiant/campus");
  await expect(carte(b, "Sortie de terrain samedi")).toHaveCount(0);

  await admin.reload();
  await admin.waitForLoadState("networkidle");
  const attente = admin.locator("#campus-a-valider");
  await expect(attente.getByText("Sortie de terrain samedi : qui vient ?")).toBeVisible();
  await attente.getByRole("button", { name: "Publier" }).click();
  await expect(attente.getByText("Aucune publication en attente.")).toBeVisible();

  await b.reload();
  await expect(carte(b, "Sortie de terrain samedi")).toBeVisible();

  // Retour au réglage par défaut.
  await admin.getByLabel(/Valider les publications des étudiants/).uncheck();
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await expect(admin.getByText("Réglages du Campus enregistrés.")).toBeVisible();
});
