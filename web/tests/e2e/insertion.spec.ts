import { expect, test } from "@playwright/test";
import { attendreRefus, D, lienRetraitAncien, seConnecter } from "./outils";

/** Galerie, annuaire des anciens et offres d'insertion : parcours et cloisonnement. */
test.describe.configure({ mode: "serial" });

const n = Date.now();
const album = `Album E2E ${n}`;
const offre = `Stage E2E ${n}`;
const emailAncien = `ancien.${n}@example.org`;

test("la communication publie un album ; le visiteur le parcourt", async ({ page }) => {
  await seConnecter(page, D.comptes.admin);
  await page.goto("/admin/galerie");
  await page.waitForLoadState("networkidle");
  await page.locator("#titre").fill(album);
  await page.getByRole("button", { name: "Créer l'album" }).click();
  await page.waitForURL(/\/admin\/galerie\/[^/]+$/);
  await page.waitForLoadState("networkidle");
  // Publier un album vide est refusé.
  await page.getByRole("button", { name: "Publier l'album" }).click();
  await expect(page.getByText("Ajoutez au moins une photo.")).toBeVisible();
  const cases = page.locator('input[name="medias"]');
  await cases.nth(0).check();
  await cases.nth(1).check();
  await page.getByRole("button", { name: "Ajouter la sélection" }).click();
  await expect(page.getByText("2 photo(s) ajoutée(s).")).toBeVisible();
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Publier l'album" }).click();
  await expect(page.getByRole("button", { name: "Retirer du site" })).toBeVisible();

  await page.goto("/galerie");
  await page.getByRole("link", { name: new RegExp(album) }).click();
  await expect(page.getByRole("heading", { level: 1, name: album })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Agrandir la photo 1 sur 2" }).click();
  const visionneuse = page.getByRole("dialog");
  await expect(visionneuse).toBeVisible();
  await expect(visionneuse.getByText("1 / 2")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(visionneuse.getByText("2 / 2")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(visionneuse).toBeHidden();
});

test("un ancien s'inscrit, l'institut publie, puis il se retire lui-même", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.40.${n % 250}.1` });
  await page.goto("/anciens/rejoindre");
  await page.waitForLoadState("networkidle");
  await page.locator("#prenom").fill("Esther");
  await page.locator("#nom").fill(`Ancienne${n}`);
  await page.locator("#email").fill(emailAncien);
  await page.locator("#anneeSortie").fill("2019");
  await page.locator("#poste").fill("Ingénieure de maintenance");
  await page.locator("#lienProfessionnel").fill("http://non-securise.example.org");
  await page.getByLabel(/J'accepte que ces informations/).check();
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByText(/doit commencer par https/)).toBeVisible();
  await page.locator("#lienProfessionnel").fill("");
  await page.getByLabel(/J'accepte que ces informations/).check();
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByText(/publiée après vérification/)).toBeVisible();

  // Pas encore visible avant vérification.
  await page.goto(`/anciens?q=Ancienne${n}`);
  await expect(page.getByText(`ANCIENNE${n}`)).toHaveCount(0);

  const admin = await page.context().browser()!.newPage();
  await seConnecter(admin, D.comptes.admin);
  await admin.goto("/admin/anciens");
  await admin.waitForLoadState("networkidle");
  const fiche = admin.getByRole("listitem").filter({ hasText: emailAncien });
  await fiche.getByRole("button", { name: "Publier" }).click();
  await fiche.getByRole("button", { name: "Confirmer" }).click();
  // La fiche quitte la liste « À vérifier » une fois publiée.
  await expect(fiche).toHaveCount(0);

  await page.goto(`/anciens?q=Ancienne${n}`);
  await expect(page.getByText(`Esther ANCIENNE${n}`)).toBeVisible();
  await expect(page.getByText(emailAncien)).toHaveCount(0);

  await page.goto("/anciens/retrait/lien-inconnu-0123456789abcdef");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Me retirer de l'annuaire" }).click();
  await expect(page.getByText(/plus valable/)).toBeVisible();

  await page.goto(await lienRetraitAncien(emailAncien));
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Me retirer de l'annuaire" }).click();
  await page.waitForURL(/\/anciens\?retrait=1/);
  await expect(page.getByText("Vous êtes retiré de l'annuaire")).toBeVisible();
  await page.goto(`/anciens?q=Ancienne${n}`);
  await expect(page.getByText(`Esther ANCIENNE${n}`)).toHaveCount(0);
});

test("une offre publiée paraît sur le site et prévient les étudiants", async ({ page }) => {
  await seConnecter(page, D.comptes.admin);
  await page.goto("/admin/offres");
  await page.waitForLoadState("networkidle");
  await page.locator("#titre").fill(offre);
  await page.locator("#organisation").fill("Entreprise E2E");
  await page
    .locator("#description")
    .fill("Stage de deux mois en maintenance industrielle, encadré.");
  await page.getByRole("button", { name: "Créer l'offre" }).click();
  await expect(page.getByText(/lien ou une adresse pour postuler/)).toBeVisible();
  await page.locator("#emailCandidature").fill("rh@example.org");
  await page.getByRole("button", { name: "Créer l'offre" }).click();
  await page.waitForURL(/\/admin\/offres\/[^/]+$/);
  const id = page.url().split("/").pop()!;

  // Brouillon : invisible sur le site.
  const visiteur = await page.context().browser()!.newPage();
  await visiteur.goto(`/offres/${id}`);
  await attendreRefus(visiteur);

  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Publier" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByRole("button", { name: "Retirer du site" })).toBeVisible();

  const lecteur = await page.context().browser()!.newPage();
  await lecteur.goto("/offres");
  await lecteur.getByRole("link", { name: new RegExp(offre) }).click();
  await expect(lecteur.getByRole("heading", { level: 1, name: offre })).toBeVisible();
  await visiteur.goto(`/offres/${id}`);
  await expect(visiteur.getByRole("heading", { level: 1, name: offre })).toBeVisible();
  await expect(visiteur.getByRole("link", { name: "rh@example.org" })).toBeVisible();

  const etudiant = await page.context().browser()!.newPage();
  await seConnecter(etudiant, D.comptes.etudiantA);
  await etudiant.goto("/etudiant/notifications");
  await expect(etudiant.getByText(`Stage : ${offre}`)).toBeVisible();

  // Retrait du site en fin de test.
  await page.getByRole("button", { name: "Retirer du site" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByRole("button", { name: "Publier" })).toBeVisible();
});

test("ces écrans restent fermés aux rôles non concernés", async ({ page }) => {
  await seConnecter(page, D.comptes.etudiantA);
  for (const chemin of ["/admin/galerie", "/admin/anciens", "/admin/offres"]) {
    await page.goto(chemin);
    await attendreRefus(page);
  }
});
