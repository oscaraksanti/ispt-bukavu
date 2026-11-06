/**
 * Vidéo de secours de la démonstration (soutenance).
 *
 * Rejoue le scénario de scenario-demonstration.md sur une instance de démonstration
 * (données fictives uniquement) et enregistre une vidéo par profil, assemblées ensuite avec ffmpeg.
 *
 *   BASE_URL=http://localhost:3000 PW_CHROMIUM_PATH=… node video-secours.cjs <dossier>
 *
 * Refuse de tourner sur le site de production.
 */
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE || "playwright-core");

const B = process.env.BASE_URL || "http://localhost:3000";
if (/isptbukavu\.org|ispt-bukavu\.vercel\.app/.test(B)) throw new Error("Jamais sur la production.");
const SORTIE = process.argv[2] || "video";
const MDP = "Demo-ISPT-2026";
const TAILLE = { width: 1280, height: 720 };
fs.mkdirSync(SORTIE, { recursive: true });

const RYTHME = Number(process.env.RYTHME || 1.8); // allonge toutes les pauses
const pause = (p, ms) => p.waitForTimeout(ms * RYTHME);

/** Bandeau de légende incrusté en bas de l'écran. */
async function legende(p, etape, texte) {
  await p.evaluate(
    ([etape, texte]) => {
      let d = document.getElementById("legende-demo");
      if (!d) {
        d = document.createElement("div");
        d.id = "legende-demo";
        d.style.cssText =
          "position:fixed;left:24px;bottom:24px;z-index:99999;max-width:760px;padding:12px 18px;border-radius:10px;" +
          "background:rgba(20,27,74,.94);color:#fff;font:600 18px/1.35 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)";
        document.body.appendChild(d);
      }
      d.innerHTML = `<span style="color:#FEF200;margin-right:10px">${etape}</span>${texte}`;
    },
    [etape, texte],
  );
}

async function defiler(p, total = 1400, pas = 6) {
  for (let y = 0; y < total; y += pas * 10) {
    await p.mouse.wheel(0, pas * 10);
    await pause(p, 60);
  }
}

async function aller(p, url) {
  await p.goto(B + url, { waitUntil: "networkidle" });
  await pause(p, 600);
}

// SCENES=1,2,3 : ne tourner que certaines scènes (par lots, si le temps d'exécution est limité).
const SCENES = process.env.SCENES ? process.env.SCENES.split(",") : null;
const FICHIER_ETAT = path.join(SORTIE, "etat.json");

async function scene(navigateur, nom, identifiant, jouer) {
  if (SCENES && !SCENES.includes(nom.split("-")[0])) return null;
  const ctx = await navigateur.newContext({
    viewport: TAILLE,
    recordVideo: { dir: path.join(SORTIE, "brut", nom), size: TAILLE },
    serviceWorkers: "block",
    extraHTTPHeaders: { "x-forwarded-for": "10.20.30." + Math.floor(Math.random() * 200) },
  });
  const p = await ctx.newPage();
  if (identifiant) {
    await aller(p, "/connexion");
    await legende(p, "Connexion", identifiant);
    await p.fill("#email", identifiant);
    await pause(p, 500);
    await p.fill("#motDePasse", MDP);
    await p.click("button[type=submit]");
    await p.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 20000 });
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(1500);
  }
  await jouer(p);
  const video = p.video();
  await ctx.close();
  const fichier = path.join(SORTIE, `${nom}.webm`);
  await video.saveAs(fichier);
  console.log("scène", nom, "→", fichier);
  return fichier;
}

(async () => {
  const navigateur = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH,
    args: ["--no-sandbox"],
  });
  const fichiers = [];
  const etat = fs.existsSync(FICHIER_ETAT) ? JSON.parse(fs.readFileSync(FICHIER_ETAT, "utf8")) : {};

  fichiers.push(
    await scene(navigateur, "1-site-public", null, async (p) => {
      await aller(p, "/");
      await legende(p, "1 · Site public", "Accueil du site institutionnel, administré par l’institut");
      await pause(p, 3500);
      await defiler(p, 1800);
      await pause(p, 1500);
      await aller(p, "/formations/genie-informatique");
      await legende(p, "1 · Site public", "Fiche d’une filière, avec ses débouchés");
      await pause(p, 3000);
      await defiler(p, 900);
      await aller(p, "/admissions");
      await legende(p, "1 · Site public", "Admissions : conditions, pièces et candidature en ligne");
      await pause(p, 3000);
      await defiler(p, 900);
      await pause(p, 1500);
    }),
  );

  fichiers.push(
    await scene(navigateur, "2-candidat", "demo.candidat@example.org", async (p) => {
      await legende(p, "2 · Candidat", "Le dossier de candidature et son état");
      await pause(p, 3500);
      await defiler(p, 900);
      await legende(p, "2 · Candidat", "Pièces exigées par la campagne, déposées en ligne");
      await pause(p, 3500);
    }),
  );

  fichiers.push(
    await scene(navigateur, "3-enseignant", "demo.enseignant@example.org", async (p) => {
      await legende(p, "3 · Enseignant", "Ses cours de l’année");
      await pause(p, 3000);
      await p.getByRole("link", { name: /Algorithmique/ }).first().click();
      await p.waitForLoadState("networkidle");
      await legende(p, "3 · Enseignant", "Évaluations du cours : saisie, puis transmission au secrétariat");
      await pause(p, 3500);
      await p.getByRole("link", { name: /Interrogation 1/ }).first().click();
      await p.waitForLoadState("networkidle");
      await legende(p, "3 · Enseignant", "Grille de notes d’une évaluation");
      await pause(p, 2500);
      await defiler(p, 700);
      await pause(p, 1500);
    }),
  );

  fichiers.push(
    await scene(navigateur, "4-administration", "demo.academique@example.org", async (p) => {
      await aller(p, "/admin/notes");
      await legende(p, "4 · Secrétariat académique", "Évaluations transmises, à valider");
      await pause(p, 3000);
      const lien = p.locator('main a[href^="/admin/notes/"]').first();
      if (await lien.count()) {
        await lien.click();
        await p.waitForLoadState("networkidle");
        await legende(p, "4 · Secrétariat académique", "Contrôle des notes avant validation");
        await pause(p, 3000);
        const valider = p.getByRole("button", { name: "Valider" });
        if (await valider.count()) {
          await valider.click();
          await p.waitForLoadState("networkidle");
          await pause(p, 1500);
        }
        const publier = p.getByRole("button", { name: /Publier/ });
        if (await publier.count()) {
          await legende(p, "4 · Secrétariat académique", "Publication : les étudiants sont notifiés");
          await pause(p, 1500);
          await publier.first().click();
          await p.waitForLoadState("networkidle");
          await pause(p, 2000);
        }
      }
    }),
  );

  fichiers.push(
    await scene(navigateur, "5-etudiant", "DEMO0001", async (p) => {
      await legende(p, "5 · Étudiante", "Son espace : la cloche signale la note qui vient d’être publiée");
      await pause(p, 3000);
      await aller(p, "/etudiant/notes");
      await legende(p, "5 · Étudiante", "Notes publiées et moyenne de chaque cours : seulement les siennes");
      await pause(p, 3500);
      await aller(p, "/etudiant/campus");
      await legende(p, "5 · Campus", "Avant la première publication : les règles du Campus et de la messagerie");
      await pause(p, 4000);
      const accepter = p.getByRole("button", { name: /accepte les règles/ });
      if (await accepter.count()) {
        await accepter.click();
        await p.waitForLoadState("networkidle");
        await pause(p, 1500);
      }
      await legende(p, "5 · Campus", "Publication épinglée par l’institut, questions et réponses entre étudiants");
      await pause(p, 2500);
      await defiler(p, 700);
      const jaime = p.getByRole("button", { name: /J'aime/ }).nth(1);
      if (await jaime.count()) {
        await jaime.click();
        await pause(p, 1500);
      }
      await defiler(p, 600);
      await pause(p, 1500);
      await aller(p, "/etudiant/messages");
      await legende(p, "5 · Messages", "Groupes de la promotion et des cours, créés à partir des inscriptions");
      await pause(p, 3000);
      await p.getByRole("link", { name: /BAC1/ }).first().click();
      await p.waitForLoadState("networkidle");
      await legende(p, "5 · Messages", "Le groupe de la promotion");
      await pause(p, 3500);
      await aller(p, "/etudiant/messages");
      await p.getByRole("link", { name: /ENSEIGNANT/ }).first().click();
      await p.waitForLoadState("networkidle");
      await legende(p, "5 · Messages", "Un message privé de l’enseignant");
      await pause(p, 3500);
    }),
  );

  fichiers.push(
    await scene(navigateur, "5b-direction", "demo.direction@example.org", async (p) => {
      await aller(p, "/admin/pilotage");
      await legende(p, "Direction", "Tableau de bord de pilotage");
      await pause(p, 3500);
      await defiler(p, 900);
      await pause(p, 1500);
    }),
  );

  fichiers.push(
    await scene(navigateur, "5c-demande", "DEMO0001", async (p) => {
      await aller(p, "/etudiant/documents");
      await legende(p, "5 · Étudiante", "Demande d’une attestation de fréquentation");
      await pause(p, 2000);
      const motif = p.locator('[name="motif"]');
      if (await motif.count()) await motif.first().fill("Dossier de bourse");
      await p.getByRole("button", { name: "Envoyer la demande" }).click();
      await p.waitForLoadState("networkidle");
      await pause(p, 2500);
    }),
  );

  fichiers.push(
    await scene(navigateur, "6-document", "demo.academique@example.org", async (p) => {
      await aller(p, "/admin/documents");
      await legende(p, "6 · Secrétariat académique", "La demande arrive : émission du document");
      await pause(p, 3000);
      const emettre = p.getByRole("button", { name: /^Émettre$/ }).first();
      await emettre.click();
      await p.waitForLoadState("networkidle");
      await pause(p, 2000);
      const doc = p.locator('main a[href^="/documents/"]').first();
      const href = await doc.getAttribute("href");
      await aller(p, href);
      await legende(p, "6 · Document officiel", "Attestation imprimable, avec code QR de vérification");
      await pause(p, 4000);
      const chemin = await p.evaluate(() => {
        // « …/verifier/CODE » ou « …/verifier » suivi du code sur la ligne suivante.
        const t = document.body.innerText;
        const m = t.match(/\/verifier\/([A-Za-z0-9-]{6,})/) || t.match(/\/verifier\s+([A-Z0-9][A-Z0-9-]{5,})/);
        return m ? "/verifier/" + m[1] : null;
      });
      etat.verifier = chemin;
      fs.writeFileSync(FICHIER_ETAT, JSON.stringify(etat));
      console.log("vérification :", etat.verifier);
    }),
  );

  fichiers.push(
    await scene(navigateur, "7-verification", null, async (p) => {
      await aller(p, etat.verifier || "/verifier");
      await legende(p, "7 · Vérification publique", "Toute personne qui lit le code QR voit si le document est authentique");
      await pause(p, 5000);
    }),
  );

  await navigateur.close();
  // Liste de toutes les scènes déjà tournées, dans l'ordre, pour l'assemblage par ffmpeg.
  const toutes = fs.readdirSync(SORTIE).filter((f) => f.endsWith(".webm")).sort();
  fs.writeFileSync(path.join(SORTIE, "liste.txt"), toutes.map((f) => `file '${path.resolve(SORTIE, f)}'`).join("\n"));
})();
