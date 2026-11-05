import { type Browser, expect, type Page, test } from "@playwright/test";
import { attendreRefus, D, seConnecter } from "./outils";

/**
 * Messagerie : conversation privée entre deux étudiants d'une même promotion,
 * accusé de lecture, groupes automatiques, annonces réservées à l'enseignant,
 * signalement et modération, cloisonnement.
 */

test.describe.configure({ mode: "serial" });

async function session(browser: Browser, identifiant: string) {
  const page = await (await browser.newContext()).newPage();
  await seConnecter(page, identifiant);
  return page;
}

async function ecrire(page: Page, texte: string) {
  const champ = page.getByLabel("Votre message");
  await champ.fill(texte);
  await champ.press("Enter");
  await expect(page.getByRole("log").getByText(texte)).toBeVisible();
}

let conversation = "";
let piece = "";

test("deux étudiants de la même promotion échangent, avec accusé de lecture", async ({
  browser,
}) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/messages");
  await expect(a.getByRole("link", { name: /BAC1 .* · 2026-2027/ })).toBeVisible();
  await expect(a.getByRole("link", { name: /Cours de test E2E/ })).toBeVisible();

  await a.getByRole("link", { name: "Nouveau" }).click();
  await a.waitForLoadState("networkidle");
  await a.getByRole("button", { name: /ETUDIANT-B/ }).click();
  await a.waitForURL((u) => /^\/etudiant\/messages\/(?!nouveau)[^/]+$/.test(u.pathname));
  conversation = new URL(a.url()).pathname.split("/").pop()!;
  await a.waitForLoadState("networkidle");
  await ecrire(a, "Bonjour, tu as le cours de jeudi ?");

  const b = await session(browser, D.comptes.etudiantB);
  await b.goto("/etudiant");
  await expect(b.getByRole("link", { name: /Messages : 1 conversation non lue/ })).toBeVisible();
  await b.goto(`/etudiant/messages/${conversation}`);
  await b.waitForLoadState("networkidle");
  await expect(b.getByRole("log").getByText("Bonjour, tu as le cours de jeudi ?")).toBeVisible();
  await ecrire(b, "Oui, je te l'envoie ce soir.");

  // La réponse arrive chez A sans recharger, et son message est marqué « Vu ».
  await expect(a.getByRole("log").getByText("Oui, je te l'envoie ce soir.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(a.getByRole("log").getByText("Vu", { exact: true }).first()).toBeVisible({
    timeout: 20_000,
  });

  // Pièce jointe : un PDF, ouvert par le destinataire.
  await a.locator('input[type="file"]').setInputFiles({
    name: "programme.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"),
  });
  await a.getByRole("button", { name: "Envoyer" }).click();
  const lien = a.getByRole("log").getByRole("link", { name: /programme\.pdf/ });
  await expect(lien).toBeVisible();
  piece = (await lien.getAttribute("href"))!;
  const r = await b.request.get(piece);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("application/pdf");
});

test("un tiers ne peut ni lire la conversation ni ses pièces", async ({ browser }) => {
  const autre = await session(browser, D.comptes.autreProf);
  await autre.goto(`/enseignant/messages/${conversation}`);
  await attendreRefus(autre);
  expect(
    (await autre.request.get(`/api/messagerie/${conversation}?apres=2000-01-01`)).status(),
  ).toBe(404);
  expect((await autre.request.get(piece)).status()).toBe(404);
  const anonyme = await (
    await browser.newContext()
  ).request.get(`/api/messagerie/${conversation}?apres=2000-01-01`);
  expect(anonyme.status()).toBe(401);
});

test("l'enseignant réserve son groupe de cours aux annonces", async ({ browser }) => {
  const prof = await session(browser, D.comptes.prof);
  await prof.goto("/enseignant/messages");
  await prof.getByRole("link", { name: /Cours de test E2E/ }).click();
  await prof.waitForLoadState("networkidle");
  await ecrire(prof, "Le TP de jeudi est déplacé en salle E2E.");
  await prof.locator("summary", { hasText: "Options de la conversation" }).click();
  await prof.getByRole("button", { name: "Réserver l'écriture aux enseignants" }).click();
  await expect(prof.getByText(/Seuls les enseignants peuvent écrire/)).toBeVisible();

  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/messages");
  await a.getByRole("link", { name: /Cours de test E2E/ }).click();
  await expect(
    a.getByRole("log").getByText("Le TP de jeudi est déplacé en salle E2E."),
  ).toBeVisible();
  await expect(a.getByText(/Groupe d'annonces : seuls les enseignants/)).toBeVisible();
  await expect(a.getByLabel("Votre message")).toHaveCount(0);
});

test("un message signalé est masqué par la modération", async ({ browser }) => {
  const b = await session(browser, D.comptes.etudiantB);
  await b.goto(`/etudiant/messages/${conversation}`);
  await b.waitForLoadState("networkidle");
  const bulle = b.getByRole("listitem").filter({ hasText: "Bonjour, tu as le cours de jeudi ?" });
  await bulle.getByRole("button", { name: "Actions sur le message" }).click();
  await b.getByRole("button", { name: "Signaler" }).click();
  await b.getByRole("button", { name: "Harcèlement ou insulte" }).click();
  await expect(b.getByText(/la modération va examiner ce message/)).toBeVisible();

  const admin = await session(browser, D.comptes.admin);
  await admin.goto("/admin/messagerie/signalements");
  await admin.waitForLoadState("networkidle");
  await expect(admin.getByText("Bonjour, tu as le cours de jeudi ?")).toBeVisible();
  await admin.getByRole("button", { name: "Masquer le message" }).first().click();
  await admin.getByRole("button", { name: "Confirmer" }).click();
  await expect(admin.getByText("Aucun signalement en attente.")).toBeVisible();

  await b.reload();
  await expect(b.getByRole("log").getByText("Message masqué par la modération")).toBeVisible();
});
