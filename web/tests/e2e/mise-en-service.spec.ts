import { expect, type Page, test } from "@playwright/test";
import { attendreRefus, D, seConnecter } from "./outils";

/** Mise en service : liste calculée, invitation en masse, codes, aide, textes légaux. */

async function deposerCsv(page: Page, nom: string, contenu: string) {
  await page.locator('input[type=file][accept*="csv"]').setInputFiles({
    name: nom,
    mimeType: "text/csv",
    buffer: Buffer.from(contenu, "utf8"),
  });
}

test.describe("liste de mise en service", () => {
  test("l'administration voit l'avancement et les étapes à compléter", async ({ page }) => {
    await seConnecter(page, D.comptes.admin);
    await page.goto("/admin/demarrage");
    await expect(page.getByRole("heading", { level: 1, name: "Mise en service" })).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Barèmes des frais" })).toBeVisible();
    await expect(page.getByText("Donnée de l'institut").first()).toBeVisible();
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Mise en service : \d+ %/ })).toBeVisible();
  });

  test("un rôle limité voit la liste sans les liens qui lui sont fermés", async ({ page }) => {
    await seConnecter(page, D.comptes.gestionnaire);
    await page.goto("/admin/demarrage");
    await expect(page.getByText(/Réservé à : enregistrer les paiements/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Compléter : Comptes du personnel/ }),
    ).toBeVisible();
  });

  test("un étudiant n'y a pas accès", async ({ page }) => {
    await seConnecter(page, D.comptes.etudiantA);
    await page.goto("/admin/demarrage");
    await attendreRefus(page);
  });
});

test.describe("invitation en masse", () => {
  test("aperçu, création des comptes, puis refus des doublons", async ({ page }) => {
    const n = Date.now();
    const csv =
      "Prénom;Nom;Post-nom;Email;Rôle;Titre;Domaine\n" +
      `Grâce;BAHATI;MUKENGERE;appariteur.${n}@example.org;Appariteur;;\n` +
      `Paul;AMANI;;prof.${n}@example.org;Enseignant;CT;Génie civil\n` +
      `Eve;MAPENDO;;eve.${n}@example.org;Pilote;;\n`;
    await seConnecter(page, D.comptes.admin);
    await page.goto("/admin/utilisateurs");
    await page.waitForLoadState("networkidle");
    await deposerCsv(page, "personnel.csv", csv);
    const apercu = page.getByRole("region", { name: "Aperçu de la liste" });
    await expect(apercu.getByText(`appariteur.${n}@example.org`)).toBeVisible();
    await expect(
      apercu.getByText("Rôle non reconnu ou non attribuable : « Pilote »"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Créer et inviter 2 personne(s)" }).click();
    await expect(page.getByText(/2 compte\(s\) créé\(s\)/)).toBeVisible();

    await page.goto(`/admin/utilisateurs?statut=INVITE&q=${n}`);
    await expect(page.getByRole("link", { name: /Grâce BAHATI MUKENGERE/ })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Liste des comptes" }).getByText("Invitation en attente"),
    ).toHaveCount(2);

    await page.waitForLoadState("networkidle");
    await deposerCsv(page, "personnel.csv", csv);
    await expect(
      apercu.getByText("Un compte existe déjà avec cette adresse").first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Créer et inviter/ })).toBeDisabled();
  });

  test("un gestionnaire ne peut pas attribuer un rôle qu'il ne détient pas", async ({ page }) => {
    await seConnecter(page, D.comptes.gestionnaire);
    await page.goto("/admin/utilisateurs");
    await page.waitForLoadState("networkidle");
    await deposerCsv(
      page,
      "caisse.csv",
      `Nom;Email;Rôle\nKAHINDO;caisse.${Date.now()}@example.org;Caisse\n`,
    );
    await expect(page.getByText("Rôle non reconnu ou non attribuable : « Caisse »")).toBeVisible();
  });
});

test.describe("documents et textes à compléter", () => {
  test("le signataire saisi apparaît sur les documents", async ({ page }) => {
    await seConnecter(page, D.comptes.admin);
    await page.goto("/admin/documents#parametres");
    await page.waitForLoadState("networkidle");
    const panneau = page.locator("#parametres");
    await panneau.getByLabel("Fonction du signataire").fill("Le Secrétaire Général Académique");
    await panneau.getByLabel("Nom du signataire").fill("SIGNATAIRE E2E");
    await panneau.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Les paramètres des documents sont enregistrés.")).toBeVisible();
    await page.goto(`/documents/${D.ids.documentA}`);
    await expect(page.getByText("SIGNATAIRE E2E")).toBeVisible();

    await page.goto("/admin/documents#parametres");
    await page.waitForLoadState("networkidle");
    await panneau.getByLabel("Nom du signataire").fill("");
    await panneau.getByLabel("Fonction du signataire").fill("");
    await panneau.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Les paramètres des documents sont enregistrés.")).toBeVisible();
  });

  test("les textes juridiques proposés sont publiés et datés", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page.getByRole("heading", { name: "Directeur de la publication" })).toBeVisible();
    await expect(page.getByText(/6 novembre 2026/)).toBeVisible();
    await page.goto("/confidentialite");
    await expect(page.getByRole("heading", { name: "Responsable du traitement" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vos droits" })).toBeVisible();
  });
});

test.describe("centre d'aide", () => {
  test("chaque espace renvoie à son guide", async ({ page }) => {
    await page.goto("/aide");
    for (const titre of [
      "Guide de l'étudiant",
      "Guide de l'enseignant",
      "Guide du candidat",
      "Guide de l'administration",
    ])
      await expect(page.getByRole("link", { name: new RegExp(titre) })).toBeVisible();
    await seConnecter(page, D.comptes.etudiantA);
    await page.getByRole("link", { name: "Aide" }).click();
    await expect(page).toHaveURL(/\/aide\/etudiant$/);
    await expect(
      page.getByRole("heading", { name: "Activer son compte (première fois)" }),
    ).toBeVisible();
  });
});

test("codes d'activation : fiches avec QR code", async ({ page }) => {
  await seConnecter(page, D.comptes.admin);
  await page.goto(`/admin/etudiants?promotion=${D.ids.promotion}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Générer les fiches à imprimer" }).click();
  // Les comptes E2E sont déjà activés : aucun code n'est (re)généré pour eux.
  await expect(page.getByText(/ont déjà activé leur compte/)).toBeVisible();
});
