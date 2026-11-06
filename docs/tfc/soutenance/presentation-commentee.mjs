/**
 * Vidéo de présentation à commenter en voix off (script :
 * script-voix-off-presentation.md) : cartons de présentation du travail, la
 * démonstration enregistrée, puis cartons sur le dossier remis à l'institut.
 *
 *   RACINE_WEB=<dossier web avec node_modules> [VOIX=<enregistrement>] node docs/tfc/soutenance/presentation-commentee.mjs
 *
 * Entrée : docs/tfc/sortie/soutenance/Demo-secours-ISPT-Bukavu.mp4
 * Sortie : docs/tfc/sortie/soutenance/Presentation-ISPT-Bukavu-a-commenter.mp4
 * Les durées des cartons doivent rester alignées sur le script.
 */
import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "../../..");
const WEB = process.env.RACINE_WEB ?? path.join(RACINE, "web");
const { chromium } = createRequire(path.join(WEB, "package.json"))("@playwright/test");
const SORTIE = path.join(RACINE, "docs/tfc/sortie/soutenance");
const DEMO = path.join(SORTIE, "Demo-secours-ISPT-Bukavu.mp4");
const CIBLE = path.join(
  SORTIE,
  process.env.VOIX ? "Presentation-ISPT-Bukavu.mp4" : "Presentation-ISPT-Bukavu-a-commenter.mp4",
);

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

/**
 * Mode voix off (VOIX=<enregistrement>) : chaque passage du script est calé sur
 * ses images. Les cartons prennent la durée du passage ; un extrait de la
 * démonstration est accéléré (1,5 fois au plus) pour tenir dans la voix, ou
 * prolongé sur sa dernière image ; s'il reste plus long, un silence suit la voix.
 */
const VOIX = process.env.VOIX;
// Calage propre à l'enregistrement (calage-voix-off.json) : début de chaque
// passage dans la voix (recalé sur les silences de la voix nettoyée) et, pour
// certains passages de la démonstration, découpage plus fin.
const CALAGE = VOIX ? JSON.parse(readFileSync(path.join(ICI, "calage-voix-off.json"), "utf8")) : null;
const DEBUTS_VOIX = CALAGE?.debuts ?? [];
// Extraits de la démonstration (secondes), passages 6 à 18 du script.
const COUPES_DEMO = [0, 16.25, 25, 35.12, 54.12, 78.8, 108.32, 126.5, 151, 195.4, 212.48, 227.04, 253.56, null];
const ACCELERATION_MAX = 1.5;
const AMORCE = 0.8; // avant la première phrase
const QUEUE = 2.5; // après la dernière

const travail = mkdtempSync(path.join(os.tmpdir(), "presentation-"));
const navigateur = await chromium.launch();
const onglet = await navigateur.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const sonde = (f) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args]);

async function segment([nom, duree, html]) {
  const page = path.join(travail, `${nom}.html`);
  const image = path.join(travail, `${nom}.png`);
  const video = path.join(travail, `${nom}.mp4`);
  writeFileSync(page, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`);
  await onglet.goto(pathToFileURL(page).href, { waitUntil: "load" });
  await onglet.screenshot({ path: image });
  ff("-loop", "1", "-t", duree.toFixed(3), "-i", image,
    "-vf", `scale=1280:720:flags=lanczos,fps=25,format=yuv420p,fade=in:st=0:d=0.5,fade=out:st=${(duree - 0.5).toFixed(3)}:d=0.5`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", "25", video);
  return video;
}

/** Extrait de la démonstration ramené à `cible` secondes (accéléré ou prolongé). */
function extraitDemo(nom, debut, fin, cible) {
  const video = path.join(travail, `demo-${nom}.mp4`);
  const vitesse = Math.max(1, (fin - debut) / cible);
  const reste = Math.max(0, cible - (fin - debut) / vitesse);
  ff("-ss", String(debut), "-to", String(fin), "-i", DEMO,
    "-vf", `setpts=(PTS-STARTPTS)/${vitesse.toFixed(4)},fps=25,tpad=stop_mode=clone:stop_duration=${reste.toFixed(3)},format=yuv420p`,
    "-t", cible.toFixed(3), "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", "25", video);
  return video;
}

/** Passages du script : texte de chaque « ### » (lignes « > »), découpé aux « / ». */
function passagesDuScript() {
  const md = readFileSync(path.join(ICI, "script-voix-off-presentation.md"), "utf8");
  return md.split(/^### /m).slice(1).map((bloc) =>
    bloc.split("\n").filter((l) => l.startsWith(">")).map((l) => l.replace(/^>\s?/, "")).join(" ")
      .split(" / ").map((t) => t.trim()).filter(Boolean));
}

/** Intervalles de parole [début, fin] d'après la détection des silences. */
function parole(fichier, total) {
  // silencedetect écrit sur la sortie d'erreur : la lire via spawnSync.
  const journal = spawnSync("ffmpeg", ["-hide_banner", "-i", fichier, "-af", "silencedetect=noise=-38dB:d=0.35", "-f", "null", "-"]).stderr.toString();
  const silences = [];
  for (const m of journal.matchAll(/silence_(start|end): ([\d.]+)/g)) {
    if (m[1] === "start") silences.push([Number(m[2]), total]);
    else if (silences.length) silences[silences.length - 1][1] = Number(m[2]);
  }
  const intervalles = [];
  let t = 0;
  for (const [a, b] of silences) {
    if (a > t) intervalles.push([t, a]);
    t = b;
  }
  if (t < total) intervalles.push([t, total]);
  return { silences, intervalles };
}

const srtHeure = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

if (!VOIX) {
  const morceaux = [];
  for (const c of AVANT) morceaux.push(await segment(c));
  morceaux.push(DEMO);
  for (const c of APRES) morceaux.push(await segment(c));
  await navigateur.close();
  assembler(morceaux, CIBLE);
} else {
  const passages = passagesDuScript();
  if (DEBUTS_VOIX.length !== passages.length || passages.length !== AVANT.length + 13 + APRES.length)
    throw new Error(`calage-voix-off.json : ${DEBUTS_VOIX.length} débuts pour ${passages.length} passages`);

  // Voix nettoyée : coupe des basses, débruitage léger, niveau de diffusion (-16 LUFS).
  const voix = path.join(travail, "voix.wav");
  ff("-i", VOIX, "-ac", "1", "-ar", "48000", "-af", "highpass=f=80,afftdn=nf=-30,loudnorm=I=-16:TP=-1.5:LRA=11", voix);
  const totalVoix = sonde(voix);
  const { silences, intervalles } = parole(voix, totalVoix);

  // Coupe de chaque passage : fin du silence le plus proche du début indiqué.
  const coupes = DEBUTS_VOIX.map((t, i) => {
    if (i === 0) return 0;
    const proches = silences.filter(([, fin]) => fin > t - 0.3 && fin < t + 0.5);
    if (!proches.length) return t;
    const [, fin] = proches.sort((a, b) => Math.abs(a[1] - t) - Math.abs(b[1] - t))[0];
    return Math.max(0, fin - 0.15);
  });
  coupes.push(totalVoix);

  const morceaux = [];
  const pistes = [];
  const sousTitres = [];
  let horloge = 0;
  for (let i = 0; i < passages.length; i++) {
    const [a, b] = [coupes[i], coupes[i + 1]];
    const amorce = i === 0 ? AMORCE : 0;
    const queue = i === passages.length - 1 ? QUEUE : 0;
    let cible = b - a + amorce + queue;
    if (i < AVANT.length) {
      const [nom, , html] = AVANT[i];
      morceaux.push(await segment([nom, cible, html]));
    } else if (i < AVANT.length + 13) {
      const k = i - AVANT.length;
      const sous = CALAGE.sousParties?.[String(i + 1)];
      if (sous) {
        // Plusieurs extraits, chacun calé sur l'instant de la voix qui le cite.
        const extraits = sous.map(([debut, fin, t], j) => {
          const voixFin = j + 1 < sous.length ? sous[j + 1][2] : b;
          const duree = Math.max(voixFin - (j === 0 ? a : t), (fin - debut) / ACCELERATION_MAX);
          return extraitDemo(`${k}-${j}`, debut, fin, duree);
        });
        const video = path.join(travail, `demo-${k}.mp4`);
        assembler(extraits, video);
        cible = Math.max(cible, sonde(video));
        morceaux.push(video);
      } else {
        const [debut, fin] = [COUPES_DEMO[k], COUPES_DEMO[k + 1] ?? sonde(DEMO)];
        cible = Math.max(cible, (fin - debut) / ACCELERATION_MAX);
        morceaux.push(extraitDemo(k, debut, fin, cible));
      }
    } else {
      const [nom, , html] = APRES[i - AVANT.length - 13];
      morceaux.push(await segment([nom, cible, html]));
    }
    pistes.push({ a, b, place: horloge + amorce, cible });

    // Sous-titres : phrases du script réparties sur le temps de parole du passage.
    const morceauxParole = intervalles.map(([x, y]) => [Math.max(x, a), Math.min(y, b)]).filter(([x, y]) => y - x > 0.05);
    const dureeParole = morceauxParole.reduce((s, [x, y]) => s + y - x, 0);
    const lignes = [];
    for (const phrase of passages[i]) {
      const der = lignes[lignes.length - 1];
      if (der && der.length + phrase.length + 1 <= 84 && !/[.?!:]$/.test(der)) lignes[lignes.length - 1] = `${der} ${phrase}`;
      else lignes.push(phrase);
    }
    const totalCar = lignes.reduce((s, l) => s + l.length, 0);
    const versSortie = (tParole) => {
      // temps de parole cumulé → instant dans l'enregistrement → instant dans la vidéo
      let r = tParole;
      for (const [x, y] of morceauxParole) {
        if (r <= y - x) return horloge + amorce + (x + r - a);
        r -= y - x;
      }
      return horloge + amorce + (b - a);
    };
    let cumul = 0;
    for (const l of lignes) {
      const debut = versSortie((cumul / totalCar) * dureeParole);
      cumul += l.length;
      const fin = versSortie((cumul / totalCar) * dureeParole - 0.05);
      sousTitres.push([debut, Math.max(fin, debut + 1), l]);
    }
    horloge += cible;
  }
  await navigateur.close();

  // Piste audio : chaque passage placé au début de ses images.
  const audio = path.join(travail, "piste.wav");
  const filtres = pistes.map((p, i) =>
    `[0:a]atrim=start=${p.a.toFixed(3)}:end=${p.b.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${Math.round(p.place * 1000)}|${Math.round(p.place * 1000)}[a${i}]`);
  ff("-i", voix, "-filter_complex",
    `${filtres.join(";")};${pistes.map((_, i) => `[a${i}]`).join("")}amix=inputs=${pistes.length}:normalize=0,apad=whole_dur=${horloge.toFixed(3)}[a]`,
    "-map", "[a]", "-ac", "2", audio);

  // Niveau final ramené à -16 LUFS (les silences ajoutés faussent le premier réglage).
  const mesure = spawnSync("ffmpeg", ["-hide_banner", "-i", audio, "-af", "ebur128", "-f", "null", "-"]).stderr.toString();
  const integre = Number([...mesure.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop()?.[1] ?? -16);
  const audioFinal = path.join(travail, "piste-niveau.wav");
  ff("-i", audio, "-af", `volume=${(-16 - integre).toFixed(2)}dB,alimiter=limit=0.89`, audioFinal);

  const srt = CIBLE.replace(/\.mp4$/, ".srt");
  writeFileSync(srt, sousTitres.map(([d, f, t], i) => `${i + 1}\n${srtHeure(d)} --> ${srtHeure(f)}\n${t}\n`).join("\n"));
  const muet = path.join(travail, "image.mp4");
  assembler(morceaux, muet);
  ff("-i", muet, "-i", audioFinal, "-i", srt, "-map", "0:v", "-map", "1:a", "-map", "2:s",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-c:s", "mov_text", "-metadata:s:s:0", "language=fre",
    "-shortest", "-movflags", "+faststart", CIBLE);
  console.log(pistes.map((p, i) => `${i + 1}. voix ${p.a.toFixed(1)}–${p.b.toFixed(1)} → vidéo ${p.place.toFixed(1)} (${p.cible.toFixed(1)} s)`).join("\n"));
  console.log(`Sous-titres : ${srt} (${sousTitres.length})`);
}

function assembler(morceaux, cible) {
  // Concaténation avec réencodage (formats identiques : 1280×720, 25 i/s, sans son).
  const entrees = morceaux.flatMap((m) => ["-i", m]);
  const filtre = morceaux.map((_, i) => `[${i}:v]setsar=1[v${i}]`).join(";") +
    ";" + morceaux.map((_, i) => `[v${i}]`).join("") + `concat=n=${morceaux.length}:v=1:a=0[v]`;
  ff(...entrees, "-filter_complex", filtre, "-map", "[v]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", cible);
}

rmSync(travail, { recursive: true, force: true });
const duree = sonde(CIBLE);
console.log(`${CIBLE} : ${Math.floor(duree / 60)} min ${Math.round(duree % 60)} s`);
