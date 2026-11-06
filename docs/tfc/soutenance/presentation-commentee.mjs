/**
 * Vidéo de présentation à commenter en voix off (script :
 * script-voix-off-presentation.md) : cartons de présentation du travail, la
 * démonstration enregistrée, puis cartons sur le dossier remis à l'institut.
 *
 *   RACINE_WEB=<dossier web avec node_modules> node docs/tfc/soutenance/presentation-commentee.mjs
 *
 * Entrée : docs/tfc/sortie/soutenance/Demo-secours-ISPT-Bukavu.mp4
 * Sortie : docs/tfc/sortie/soutenance/Presentation-ISPT-Bukavu-a-commenter.mp4
 * Les durées des cartons doivent rester alignées sur le script.
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "../../..");
const WEB = process.env.RACINE_WEB ?? path.join(RACINE, "web");
const { chromium } = createRequire(path.join(WEB, "package.json"))("@playwright/test");
const SORTIE = path.join(RACINE, "docs/tfc/sortie/soutenance");
const DEMO = path.join(SORTIE, "Demo-secours-ISPT-Bukavu.mp4");
const CIBLE = path.join(SORTIE, "Presentation-ISPT-Bukavu-a-commenter.mp4");

const fichier = (p) => pathToFileURL(path.join(RACINE, p)).href;
const blason = fichier("web/public/brand/blason-blanc-sans-devise.svg");
const photo = fichier("web/public/photos/campus-batiment-facade.jpg");

const CSS = `
  * { box-sizing: border-box; margin: 0; }
  body { width: 1280px; height: 720px; overflow: hidden; background: #141b4a; color: #fff;
    font: 400 24px/1.45 "Helvetica Neue", Helvetica, Arial, sans-serif; }
  .carton { position: relative; width: 1280px; height: 720px; padding: 72px 96px; display: flex; flex-direction: column; justify-content: center; }
  .carton::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: #fef200; }
  .surtitre { font: 600 15px/1 "Helvetica Neue", sans-serif; letter-spacing: .18em; text-transform: uppercase; color: #fef200; margin-bottom: 22px; }
  h1 { font: 600 54px/1.12 Georgia, "Times New Roman", serif; margin-bottom: 26px; }
  h2 { font: 600 42px/1.15 Georgia, "Times New Roman", serif; margin-bottom: 30px; }
  p.chapeau { font-size: 25px; color: #d9dcef; max-width: 980px; }
  ul { list-style: none; padding: 0; display: grid; gap: 16px; }
  li { position: relative; padding-left: 34px; font-size: 25px; color: #eef0f8; }
  li::before { content: ""; position: absolute; left: 0; top: 13px; width: 16px; height: 3px; background: #fef200; }
  .deux { grid-template-columns: 1fr 1fr; column-gap: 56px; }
  .pied { position: absolute; left: 96px; right: 96px; bottom: 48px; display: flex; justify-content: space-between; align-items: center; font-size: 17px; color: #aab0d6; }
  .pied img { height: 44px; }
  .photo { position: absolute; inset: 0; background: url(${photo}) center/cover; opacity: .22; }
  .fort { color: #fef200; font-weight: 600; }
`;

const pied = `<div class="pied"><span>ISPT-Bukavu · Plateforme académique</span><img src="${blason}" alt=""></div>`;

/** [nom, durée en secondes, contenu] — durées alignées sur le script de voix off. */
const AVANT = [
  ["ouverture", 10, `<div class="photo"></div><div class="carton">
    <div class="surtitre">Travail de fin de cycle · Génie Informatique · 2025-2026</div>
    <h1>La plateforme numérique<br>de l'ISPT-Bukavu</h1>
    <p class="chapeau">Présentation du travail et du dossier de remise<br>Oscar AKSANTI CIRHUZA<br>Sous la direction du Professeur SINDANO WA KITWANGA Expédit</p>
    ${pied}</div>`],
  ["constat", 22, `<div class="carton"><div class="surtitre">Le constat</div>
    <h2>Aujourd'hui, à l'institut</h2><ul>
    <li>L'information officielle est affichée à la valve, puis relayée de manière informelle</li>
    <li>Les démarches se font sur papier et au guichet</li>
    <li>Les documents délivrés ne peuvent pas être vérifiés à distance</li>
    <li>La connexion est souvent faible et coûteuse</li></ul>${pied}</div>`],
  ["reponse", 24, `<div class="carton"><div class="surtitre">La réponse</div>
    <h2>Une seule plateforme, administrée par l'institut</h2><ul class="deux">
    <li>Site institutionnel</li><li>Admissions en ligne</li>
    <li>Valve numérique ciblée</li><li>Espaces étudiant, enseignant, candidat</li>
    <li>Notes, délibérations, examens</li><li>Frais académiques et reçus</li>
    <li>Documents vérifiables par code QR</li><li>Campus et messagerie</li></ul>
    <p class="chapeau" style="margin-top:34px">En ligne : <span class="fort">www.isptbukavu.org</span></p>${pied}</div>`],
  ["demarche", 16, `<div class="carton"><div class="surtitre">La démarche</div>
    <h2>Analyser, concevoir, réaliser, vérifier</h2><ul>
    <li>Cinq processus de l'institut analysés ; neuf établissements congolais comparés</li>
    <li>Cadre LMD et Code du numérique ; modélisation UML</li>
    <li>Réalisation itérative ; 203 tests unitaires et 117 tests de bout en bout réussis</li></ul>${pied}</div>`],
  ["demonstration", 6, `<div class="carton" style="align-items:flex-start"><div class="surtitre">Démonstration</div>
    <h1>La plateforme en action</h1>
    <p class="chapeau">Données fictives · demo.isptbukavu.org</p>${pied}</div>`],
];

const APRES = [
  ["dossier", 34, `<div class="carton"><div class="surtitre">Le dossier remis</div>
    <h2>Ce que l'institut reçoit</h2><ul class="deux">
    <li>La lettre de remise</li><li>La fiche des données et décisions attendues</li>
    <li>Le mémoire</li><li>Le support de soutenance</li>
    <li>Les vidéos de présentation</li><li>Le guide de création des comptes</li>
    <li>Le dossier de passation et l'exploitation</li><li>Le code source</li></ul>
    <p class="chapeau" style="margin-top:34px">Aucun mot de passe dans le dossier ; la phrase de chiffrement des sauvegardes est remise sous pli fermé.</p>${pied}</div>`],
  ["suite", 26, `<div class="carton"><div class="surtitre">La suite</div>
    <h2>Pour ouvrir la plateforme aux étudiants</h2><ul>
    <li>Désigner l'administrateur technique et les responsables des services</li>
    <li>Transmettre les données officielles : programme des cours, frais, calendrier, listes</li>
    <li>Valider les textes proposés et le règlement de délibération</li>
    <li>Planifier le transfert des comptes des services à l'institut</li></ul>${pied}</div>`],
  ["fin", 12, `<div class="photo"></div><div class="carton">
    <div class="surtitre">Merci</div>
    <h1>www.isptbukavu.org</h1>
    <p class="chapeau">Démonstration : demo.isptbukavu.org<br>Oscar AKSANTI CIRHUZA · oscaraksanti@gmail.com</p>${pied}</div>`],
];

const travail = mkdtempSync(path.join(os.tmpdir(), "presentation-"));
const navigateur = await chromium.launch();
const onglet = await navigateur.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });

async function segment([nom, duree, html]) {
  const page = path.join(travail, `${nom}.html`);
  const image = path.join(travail, `${nom}.png`);
  const video = path.join(travail, `${nom}.mp4`);
  writeFileSync(page, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`);
  await onglet.goto(pathToFileURL(page).href, { waitUntil: "load" });
  await onglet.screenshot({ path: image });
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-loop", "1", "-t", String(duree), "-i", image,
    "-vf", `scale=1280:720:flags=lanczos,fps=25,format=yuv420p,fade=in:st=0:d=0.5,fade=out:st=${duree - 0.5}:d=0.5`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", "25", video,
  ]);
  return video;
}

const morceaux = [];
for (const c of AVANT) morceaux.push(await segment(c));
morceaux.push(DEMO);
for (const c of APRES) morceaux.push(await segment(c));
await navigateur.close();

// Concaténation avec réencodage (formats identiques : 1280×720, 25 i/s, sans son).
const entrees = morceaux.flatMap((m) => ["-i", m]);
const filtre = morceaux.map((_, i) => `[${i}:v]setsar=1[v${i}]`).join(";") +
  ";" + morceaux.map((_, i) => `[v${i}]`).join("") + `concat=n=${morceaux.length}:v=1:a=0[v]`;
execFileSync("ffmpeg", [
  "-v", "error", "-y", ...entrees, "-filter_complex", filtre, "-map", "[v]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", CIBLE,
]);
rmSync(travail, { recursive: true, force: true });

const duree = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", CIBLE]).toString());
const total = [...AVANT, ...APRES].reduce((s, [, d]) => s + d, 0);
console.log(`${CIBLE} : ${Math.floor(duree / 60)} min ${Math.round(duree % 60)} s (cartons : ${total} s)`);
