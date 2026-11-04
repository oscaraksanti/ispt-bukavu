import { expect, type Page, test } from "@playwright/test";
import { attendreRefus, D, lienConfirmation, seConnecter } from "./outils";

/**
 * Parcours complet d'une inscription en ligne : compte candidat, confirmation
 * de l'adresse, dossier, frais vérifiés par la caisse, admission, inscription
 * comme étudiant. Puis les tentatives d'intrusion.
 */
test.describe.configure({ mode: "serial" });

const n = Date.now();
const email = `candidat.${n}@example.org`;
const motDePasse = "Candidat-E2E-2026";
const matricule = `ADM${String(n).slice(-6)}`;
let dossierId = "";
let numero = "";

let ip = 0;

async function ouvrirCompte(page: Page, adresse: string) {
  ip += 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.32.${n % 250}.${ip}` });
  await page.goto("/candidater");
  await page.waitForLoadState("networkidle");
  await page.locator("#prenom").fill("Grâce");
  await page.locator("#nom").fill("Candidate");
  await page.locator("#telephone").fill("0990000000");
  await page.locator("#email").fill(adresse);
  await page.locator("#motDePasse").fill(motDePasse);
  await page.locator("#confirmation").fill(motDePasse);
  await page.getByLabel(/J'accepte que l'ISPT-Bukavu traite/).check();
  await page.getByRole("button", { name: "Ouvrir mon dossier" }).click();
  await expect(page.getByRole("heading", { name: "Consultez votre boîte mail" })).toBeVisible();
}

test("ouverture du compte sans révéler les adresses déjà connues", async ({ page }) => {
  await ouvrirCompte(page, email);
  // L'adresse, désormais connue, reçoit exactement la même réponse.
  await page.context().clearCookies();
  await ouvrirCompte(page, email);
});

test("un lien de confirmation inconnu est refusé", async ({ page }) => {
  await page.goto("/confirmer-email/jeton-inconnu-0123456789abcdef");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Confirmer mon adresse/ }).click();
  await expect(page.getByText(/Ce lien n'est plus valable/)).toBeVisible();
});

test("sans confirmation, le dossier ne peut pas être déposé", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "10.31.0.1" });
  await page.goto("/connexion");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill(email);
  await page.locator("#motDePasse").fill(motDePasse);
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/candidat/);
  await expect(page.getByText("Confirmez votre adresse email")).toBeVisible();
});

test("confirmation, dossier complet et dépôt", async ({ page }) => {
  await page.goto(await lienConfirmation(email));
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Confirmer mon adresse/ }).click();
  await page.waitForURL(/\/candidat$/);
  await expect(page.getByText("Confirmez votre adresse email")).toHaveCount(0);
  numero = (await page.getByRole("heading", { level: 1 }).textContent())!.replace(/\D+/, "");
  numero = numero.trim();

  await page.locator("#sexe").selectOption("F");
  await page.locator("#dateNaissance").fill("2006-03-14");
  await page.locator("#lieuNaissance").fill("Bukavu");
  await page.locator("#adresse").fill("Avenue E2E, Ibanda");
  await page.locator("#ecoleOrigine").fill("Institut E2E");
  await page.locator("#sectionHumanites").fill("Scientifique");
  await page.locator("#anneeDiplome").fill("2025");
  await page.locator("#filiereId").selectOption({ index: 1 });
  await page.locator("#modePaiement").selectOption("BANQUE");
  await page.locator("#referencePaiement").fill(`BK-${n}`);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Informations enregistrées.")).toBeVisible();

  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "identite.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"),
    });
  await expect(page.getByText("Déposée", { exact: true })).toBeVisible();
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Déposer mon dossier" }).click();
  await page.getByRole("button", { name: "Confirmer" }).click();
  // Le dossier passe en lecture seule : le bouton disparaît avec son message.
  await expect(page.getByText("À vérifier par la caisse")).toBeVisible();
  await expect(page.getByText("Dossier déposé").first()).toBeVisible();
});

test("la caisse vérifie les frais et émet le reçu", async ({ page }) => {
  await seConnecter(page, D.comptes.caisse);
  await page.goto("/admin/finances#frais-dossier");
  await page.waitForLoadState("networkidle");
  const ligne = page.locator("#frais-dossier li").filter({ hasText: `BK-${n}` });
  await ligne.getByRole("button", { name: /Paiement reçu/ }).click();
  await ligne.getByRole("button", { name: "Confirmer" }).click();
  await expect(ligne.getByRole("link", { name: /Reçu n° AD-\d{4}-\d{4}/ })).toBeVisible();

  // La caisse n'a pas accès à l'instruction des dossiers.
  await page.goto("/admin/admissions");
  await attendreRefus(page);
});

test("le secrétariat admet puis inscrit le candidat", async ({ page }) => {
  await seConnecter(page, D.comptes.admin);
  await page.goto(`/admin/admissions?campagne=${D.ids.campagne}&q=${n}`);
  await page.getByRole("link", { name: numero }).click();
  await page.waitForURL(/\/admin\/admissions\/[^/]+$/);
  dossierId = page.url().split("/").pop()!;
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Paiement vérifié")).toBeVisible();
  await page.locator("#decision").selectOption("ADMISE");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  // Une fois admis, le panneau de décision laisse place à l'inscription.
  await expect(page.getByRole("heading", { name: "Inscrire l'étudiant" })).toBeVisible();
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.locator("#matricule").fill(matricule);
  await page.getByRole("button", { name: "Inscrire" }).click();
  // L'historique du dossier garde la trace du matricule attribué.
  await expect(page.getByText(`Matricule ${matricule}`)).toBeVisible();
});

test("l'admis entre dans son espace étudiant et garde son reçu", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "10.31.0.2" });
  await page.goto("/connexion");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill(matricule);
  await page.locator("#motDePasse").fill(motDePasse);
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/etudiant$/);
  await page.goto(`/recu-dossier/${dossierId}`);
  await expect(page.getByRole("heading", { name: "Reçu des frais de dossier" })).toBeVisible();
  await expect(page.getByText(`BK-${n}`)).toBeVisible();
});

test("un autre étudiant n'ouvre pas ce reçu ; un visiteur doit se connecter", async ({ page }) => {
  await page.goto(`/recu-dossier/${dossierId}`);
  await expect(page).toHaveURL(/\/connexion/);
  await seConnecter(page, D.comptes.etudiantA);
  await page.goto(`/recu-dossier/${dossierId}`);
  await attendreRefus(page);
});
