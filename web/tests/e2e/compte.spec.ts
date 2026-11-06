import { type Browser, expect, type Page, test } from "@playwright/test";
import { D, seConnecter } from "./outils";

/** « Mon compte » : changement de mot de passe, appareils connectés, purge protégée. */

test.describe.configure({ mode: "serial" });

async function session(browser: Browser, identifiant: string) {
  const page = await (await browser.newContext()).newPage();
  await seConnecter(page, identifiant);
  return page;
}

async function changer(page: Page, actuel: string, nouveau: string) {
  await page.locator("#actuel").fill(actuel);
  await page.locator("#nouveau").fill(nouveau);
  await page.locator("#confirmation").fill(nouveau);
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
}

test("changer son mot de passe exige l'actuel et déconnecte les autres appareils", async ({
  browser,
}) => {
  const nouveau = "Nouveau-Essai-2027";
  const ici = await session(browser, D.comptes.caisse);
  const ailleurs = await session(browser, D.comptes.caisse);
  await ici.goto("/admin/compte");
  await ici.waitForLoadState("networkidle");
  await expect(ici.getByText("Cet appareil")).toBeVisible();
  await expect(ici.getByRole("button", { name: "Déconnecter les autres" })).toBeVisible();

  await changer(ici, "Pas-le-bon-2026", nouveau);
  await expect(ici.getByText("Mot de passe actuel incorrect.")).toBeVisible();

  await changer(ici, D.motDePasse, nouveau);
  await expect(ici.getByText(/Mot de passe modifié/)).toBeVisible();

  // L'autre appareil a perdu sa session.
  await ailleurs.goto("/admin");
  await ailleurs.waitForURL(/\/connexion/);

  // Retour au mot de passe de test, vérifié par une nouvelle connexion.
  await ici.reload();
  await ici.waitForLoadState("networkidle");
  await changer(ici, nouveau, D.motDePasse);
  await expect(ici.getByText(/Mot de passe modifié/)).toBeVisible();
  await session(browser, D.comptes.caisse);
});

test("l'étudiant retrouve son identité dans « Mon compte »", async ({ browser }) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant");
  await a.getByRole("link", { name: /Mon compte/ }).click();
  await expect(a.getByRole("heading", { name: "Mon compte", level: 1 })).toBeVisible();
  await expect(a.getByRole("definition").filter({ hasText: D.comptes.etudiantA })).toBeVisible();
});

test("les notifications sur le téléphone se règlent dans « Mon compte »", async ({ browser }) => {
  const a = await session(browser, D.comptes.etudiantA);
  await a.goto("/etudiant/compte");
  await expect(a.getByRole("heading", { name: "Notifications sur ce téléphone" })).toBeVisible();
  // Sans clés VAPID (base de test), l'option est annoncée indisponible plutôt que cassée.
  await expect(
    a.getByText(/ne permet pas les notifications|Activer sur cet appareil|bloquées/),
  ).toBeVisible();
  // Le lien d'une notification de message conduit à la conversation dans l'espace de chacun.
  const r = await a.request.get("/messages/aller/inconnue", { maxRedirects: 0 });
  expect(r.headers().location).toBe("/etudiant/messages/inconnue");
});

test("la purge planifiée refuse tout appel sans le secret", async ({ request }) => {
  const essais: Record<string, string>[] = [{}, { authorization: "Bearer devine" }];
  for (const headers of essais) {
    const r = await request.get("/api/taches/purge", { headers });
    expect([401, 503]).toContain(r.status());
  }
});

test("la déconnexion supprime l'abonnement aux notifications de l'appareil", async ({
  browser,
}) => {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  if (!url || /supabase|neon\.tech/.test(url)) throw new Error("Base de test requise.");
  const { Client } = await import("pg");
  const { createHash, randomBytes } = await import("node:crypto");
  const contexte = await browser.newContext();
  const page = await contexte.newPage();
  await seConnecter(page, D.comptes.etudiantA);
  const jeton = (await contexte.cookies()).find((c) => c.name === "ispt_session")?.value;
  expect(jeton).toBeTruthy();
  const endpoint = `https://fcm.googleapis.com/fcm/send/e2e-${randomBytes(6).toString("hex")}`;
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    // Abonnement de cet appareil, tel que l'enregistre la page « Mon compte ».
    await c.query(
      `INSERT INTO "AbonnementPush" (id, "utilisateurId", "sessionId", endpoint, p256dh, auth)
       SELECT $1, s."utilisateurId", s.id, $2, $3, $4 FROM "Session" s WHERE s."jetonHash" = $5`,
      [
        `e2e${randomBytes(8).toString("hex")}`,
        endpoint,
        "B".repeat(60),
        "a".repeat(16),
        createHash("sha256").update(jeton!).digest("hex"),
      ],
    );
    const compter = async () =>
      Number(
        (await c.query(`SELECT count(*) FROM "AbonnementPush" WHERE endpoint = $1`, [endpoint]))
          .rows[0].count,
      );
    expect(await compter()).toBe(1);
    await page.goto("/etudiant");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Se déconnecter" }).first().click();
    await page.waitForURL(/\/connexion/);
    expect(await compter()).toBe(0);
  } finally {
    await c.end();
    await contexte.close();
  }
});

test("photo de profil : ajout, affichage, visibilité réservée aux membres", async ({
  browser,
  request,
}) => {
  const sharp = (await import("sharp")).default;
  const image = await sharp({
    create: { width: 600, height: 400, channels: 3, background: { r: 40, g: 56, b: 144 } },
  })
    .jpeg()
    .toBuffer();
  const a = await (await browser.newContext()).newPage();
  await seConnecter(a, D.comptes.etudiantA);
  await a.goto("/etudiant/compte");
  await a.waitForLoadState("networkidle");
  await a.locator("#photo-profil").setInputFiles({
    name: "portrait.jpg",
    mimeType: "image/jpeg",
    buffer: image,
  });
  await expect(a.getByText("Photo de profil enregistrée.")).toBeVisible();
  // La photo remplace l'icône dans l'en-tête de l'espace.
  const img = a.locator('header img[src^="/profils/photo/"]');
  await expect(img).toBeVisible();
  const adresse = (await img.getAttribute("src"))!;
  expect((await a.request.get(adresse)).status()).toBe(200);

  // Un autre étudiant la voit ; un visiteur non connecté, non.
  const b = await (await browser.newContext()).newPage();
  await seConnecter(b, D.comptes.etudiantB);
  const vue = await b.request.get(adresse);
  expect(vue.status()).toBe(200);
  expect(vue.headers()["content-type"]).toBe("image/webp");
  expect((await request.get(adresse)).status()).toBe(404);

  // Retrait : l'icône revient, l'adresse ne sert plus rien.
  await a.goto("/etudiant/compte");
  await a.waitForLoadState("networkidle");
  await a.getByRole("button", { name: "Retirer la photo" }).click();
  await a.getByRole("button", { name: "Confirmer" }).click();
  await expect(a.locator('header img[src^="/profils/photo/"]')).toHaveCount(0);
  expect((await b.request.get(adresse)).status()).toBe(404);
});
