import { expect, test } from "@playwright/test";
import { attendreRefus, D, seConnecter } from "./outils";

/**
 * Cloisonnement par rôle, vérifié côté serveur : chaque test tente d'atteindre
 * ce qui n'est pas ouvert au compte connecté.
 */

test.describe("visiteur non connecté", () => {
  for (const chemin of ["/admin", "/etudiant", "/enseignant", "/candidat"]) {
    test(`${chemin} renvoie vers la connexion`, async ({ page }) => {
      await page.goto(chemin);
      await expect(page).toHaveURL(/\/connexion\?suite=/);
    });
  }

  test("un reçu et un document exigent une connexion", async ({ page }) => {
    await page.goto(`/recu/${D.ids.recuA}`);
    await expect(page).toHaveURL(/\/connexion/);
    await page.goto(`/documents/${D.ids.documentA}`);
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("les en-têtes de sécurité sont présents", async ({ request }) => {
    const r = await request.get("/");
    const h = r.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-powered-by"]).toBeUndefined();
  });
});

test.describe("étudiant", () => {
  test("n'atteint ni l'administration ni l'espace enseignant", async ({ page }) => {
    await seConnecter(page, D.comptes.etudiantA);
    await expect(page).toHaveURL(/\/etudiant$/);
    await page.goto("/admin");
    await attendreRefus(page);
    await page.goto("/admin/finances");
    await attendreRefus(page);
    await page.goto("/enseignant");
    await attendreRefus(page);
  });

  test("ne voit que les notes publiées", async ({ page }) => {
    await seConnecter(page, D.comptes.etudiantA);
    await page.goto("/etudiant/notes");
    await expect(page.getByText("Interrogation publiée E2E")).toBeVisible();
    await expect(page.getByText("Interrogation brouillon E2E")).toHaveCount(0);
  });

  test("ouvre son propre reçu et son propre document", async ({ page }) => {
    await seConnecter(page, D.comptes.etudiantA);
    await page.goto(`/recu/${D.ids.recuA}`);
    await expect(page.getByText("E2E-0001").first()).toBeVisible();
    await page.goto(`/documents/${D.ids.documentA}`);
    await expect(page.getByText(D.ids.codeDocumentA).first()).toBeVisible();
  });

  test("n'ouvre pas le reçu ni le document d'un autre étudiant", async ({ page }) => {
    await seConnecter(page, D.comptes.etudiantB);
    await page.goto(`/recu/${D.ids.recuA}`);
    await attendreRefus(page);
    await page.goto(`/documents/${D.ids.documentA}`);
    await attendreRefus(page);
  });
});

test.describe("enseignant", () => {
  test("gère le cours qui lui est confié", async ({ page }) => {
    await seConnecter(page, D.comptes.prof);
    await page.goto(`/enseignant/cours/${D.ids.coursOffert}`);
    await expect(page.getByRole("heading", { name: "Cours de test E2E" })).toBeVisible();
  });

  test("n'ouvre pas le cours d'un collègue ni l'administration", async ({ page }) => {
    await seConnecter(page, D.comptes.autreProf);
    await page.goto(`/enseignant/cours/${D.ids.coursOffert}`);
    await attendreRefus(page);
    await page.goto(
      `/enseignant/cours/${D.ids.coursOffert}/evaluations/${D.ids.evaluationPubliee}`,
    );
    await attendreRefus(page);
    await page.goto("/admin");
    await attendreRefus(page);
  });
});

test.describe("personnel", () => {
  test("un gestionnaire de comptes ne modifie pas ses propres rôles", async ({ page }) => {
    await seConnecter(page, D.comptes.gestionnaire);
    await page.goto(`/admin/utilisateurs/${D.ids.gestionnaire}`);
    await expect(page.getByText(/Vos propres rôles ne peuvent/)).toBeVisible();
  });

  test("un gestionnaire de comptes ne voit ni les finances ni les rôles", async ({ page }) => {
    await seConnecter(page, D.comptes.gestionnaire);
    await page.goto("/admin/roles");
    await attendreRefus(page);
    await page.goto("/admin/notes");
    await attendreRefus(page);
    await page.goto("/admin/utilisateurs");
    const roles = await page
      .locator("input[name=roles]")
      .evaluateAll((l) => l.map((x) => (x as HTMLInputElement).value));
    expect(roles).not.toContain("super_admin");
    expect(roles).not.toContain("direction");
  });

  test("l'administrateur technique atteint le pilotage", async ({ page }) => {
    await seConnecter(page, D.comptes.admin);
    await page.goto("/admin/pilotage");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("vérification publique des documents", () => {
  test("un document authentique est reconnu", async ({ page }) => {
    await page.goto(`/verifier/${D.ids.codeDocumentA}`);
    await expect(page.getByRole("heading", { name: /Document authentique/ })).toBeVisible();
  });

  test("un code inconnu est signalé", async ({ page }) => {
    await page.goto("/verifier/ZZZZ-ZZZZ-ZZZZ");
    await expect(page.getByRole("heading", { name: /Code inconnu/ })).toBeVisible();
  });
});
