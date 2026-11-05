/* Chronologie du film (secondes). Les temps suivent le script de la voix off (script-voix-off.md). */
const P = new URLSearchParams(location.search);
const CAP = (P.get("captures") || "captures") + "/";
const BLASON = P.get("blason") || "blason.png";
const DOMAINE = "www.isptbukavu.org";
const VUE_L = 1652, VUE_H = 886;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lisse = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const doux = (x) => { x = clamp(x); return -(Math.cos(Math.PI * x) - 1) / 2; };
const mix = (a, b, k) => a + (b - a) * k;
// Opacité d'une couche visible de t0 à t1, avec fondus d'entrée et de sortie.
const fondu = (t, t0, t1, fi = 0.7, fo = 0.7) => Math.min(lisse((t - t0 + fi / 2) / fi), lisse((t1 + fo / 2 - t) / fo));

const chapitres = [
  [32, 62, "01", "Le site de l’institut"],
  [62, 90, "02", "Les admissions en ligne"],
  [90, 110, "03", "La valve numérique"],
  [110, 145, "04", "L’espace étudiant"],
  [145, 168, "05", "L’espace enseignant"],
  [168, 205, "06", "Notes et délibérations"],
  [205, 230, "07", "Des documents vérifiables"],
  [230, 255, "08", "Pilotage et administration"],
  [255, 275, "09", "Une plateforme fiable"],
];

const plans = [
  { type: "ouverture", t0: 0, t1: 10 },
  { type: "constat", t0: 10, t1: 32 },
  // 01 Site
  { type: "ecran", t0: 32, t1: 45, img: "accueil.jpg", url: "/", de: { x: 0, y: 0, w: 2880 }, a: { x: 0, y: 3900, w: 2880 } },
  { type: "ecran", t0: 45, t1: 53.5, img: "filiere.jpg", url: "/formations/genie-informatique", de: { x: 0, y: 0, w: 2880 }, a: { x: 240, y: 1350, w: 2400 } },
  { type: "ecran", t0: 53.5, t1: 62, img: "galerie.jpg", url: "/galerie", de: { x: 0, y: 0, w: 2880 }, a: { x: 120, y: 60, w: 2600 },
    tel: { img: "accueil-mobile.jpg", x: 1420, y: 250 } },
  // 02 Admissions
  { type: "ecran", t0: 62, t1: 71, img: "admissions.jpg", url: "/admissions", de: { x: 0, y: 0, w: 2880 }, a: { x: 0, y: 1750, w: 2880 } },
  { type: "ecran", t0: 71, t1: 90, img: "candidat.jpg", url: "/candidat", de: { x: 260, y: 0, w: 2360 }, a: { x: 360, y: 1500, w: 2160 } },
  // 03 Valve
  { type: "ecran", t0: 90, t1: 100, img: "admin-valve.jpg", url: "/admin/valve", de: { x: 330, y: 0, w: 2550 }, a: { x: 560, y: 60, w: 1700 } },
  { type: "tel", t0: 100, t1: 110, imgs: ["etu-valve.jpg"], texte: ["Tout l’institut, une filière ou une promotion", "Accusé de lecture", "Notification dans l’espace de l’étudiant"] },
  // 04 Étudiant
  { type: "tel", t0: 110, t1: 128, imgs: ["etu-accueil.jpg", "etu-notes.jpg", "etu-horaire.jpg"] },
  { type: "tel", t0: 128, t1: 145, imgs: ["etu-frais.jpg", "etu-resultats.jpg"], texte: ["Solde et reçus des frais", "Résultats et bulletins", "Lisible même sans réseau"] },
  // 05 Enseignant
  { type: "ecran", t0: 145, t1: 151.5, img: "ens-accueil.jpg", url: "/enseignant", de: { x: 0, y: 0, w: 2880 }, a: { x: 380, y: 40, w: 2150 } },
  { type: "ecran", t0: 151.5, t1: 157.5, img: "ens-cours.jpg", url: "/enseignant/cours", de: { x: 380, y: 0, w: 2150 }, a: { x: 420, y: 120, w: 1950 } },
  { type: "ecran", t0: 157.5, t1: 163, img: "ens-evaluation.jpg", url: "/enseignant/cours/evaluation", de: { x: 380, y: 0, w: 2150 }, a: { x: 420, y: 520, w: 1850 } },
  { type: "ecran", t0: 163, t1: 168, img: "ens-presences.jpg", url: "/enseignant/cours/presences", de: { x: 380, y: 0, w: 2150 }, a: { x: 430, y: 60, w: 2000 } },
  // 06 Notes et délibérations
  { type: "ecran", t0: 168, t1: 176.5, img: "adm-notes.jpg", url: "/admin/notes", de: { x: 330, y: 0, w: 2550 }, a: { x: 520, y: 40, w: 1750 } },
  { type: "ecran", t0: 176.5, t1: 194, img: "adm-deliberation.jpg", url: "/admin/deliberations", de: { x: 330, y: 0, w: 2550 }, a: { x: 420, y: 1600, w: 2300 } },
  { type: "ecran", t0: 194, t1: 205, img: "adm-pv.jpg", url: "/deliberations/proces-verbal", de: { x: 0, y: 0, w: 2880 }, a: { x: 560, y: 120, w: 1500 } },
  // 07 Documents
  { type: "ecran", t0: 205, t1: 218.5, img: "bulletin.jpg", url: "/documents/bulletin", de: { x: 120, y: 0, w: 2640 }, a: { x: 560, y: 1060, w: 1500 } },
  { type: "ecran", t0: 218.5, t1: 230, img: "verifier.jpg", url: "/verifier", de: { x: 0, y: 0, w: 2880 }, a: { x: 640, y: 40, w: 1500 } },
  // 08 Pilotage
  { type: "ecran", t0: 230, t1: 238, img: "dir-pilotage.jpg", url: "/admin/pilotage", de: { x: 330, y: 0, w: 2550 }, a: { x: 540, y: 40, w: 1700 } },
  { type: "ecran", t0: 238, t1: 244, img: "caisse-finances.jpg", url: "/admin/finances", de: { x: 330, y: 0, w: 2550 }, a: { x: 540, y: 40, w: 1800 } },
  { type: "ecran", t0: 244, t1: 249.5, img: "dir-journal.jpg", url: "/admin/journal", de: { x: 330, y: 0, w: 2550 }, a: { x: 540, y: 40, w: 1800 } },
  { type: "ecran", t0: 249.5, t1: 255, img: "dir-demarrage.jpg", url: "/admin/demarrage", de: { x: 330, y: 0, w: 2550 }, a: { x: 540, y: 40, w: 1800 } },
  // 09 Fiabilité
  { type: "chiffres", t0: 255, t1: 275 },
  // Conclusion
  { type: "suite", t0: 275, t1: 292.5 },
  { type: "fin", t0: 292.5, t1: 300 },
];

plans.forEach((p, i) => { p.prev = plans[i - 1]; p.next = plans[i + 1]; });
const DUREE = 300;
const scene = document.getElementById("scene");
const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || scene).appendChild(e); return e; };

/* ---------- Construction ---------- */
function construireTel(parent, img) {
  const t = el("div", "tel", parent);
  const e = el("div", "ecran", t);
  el("div", "encoche", e);
  const i = el("img", null, e); i.src = CAP + img;
  return t;
}

for (const p of plans) {
  p.c = el("div", "couche" + (["ouverture", "constat", "suite", "fin"].includes(p.type) ? " sombre" : ""));
  if (p.type === "ecran") {
    const f = el("div", "fenetre", p.c);
    const b = el("div", "barre", f);
    el("span", "pt", b); el("span", "pt", b); el("span", "pt", b);
    el("span", "url", b, `<b>${DOMAINE}</b>${p.url === "/" ? "" : p.url}`);
    const v = el("div", "vue", f);
    p.i = el("img", null, v); p.i.src = CAP + p.img;
    if (p.tel) { p.t = construireTel(p.c, p.tel.img); p.t.style.left = p.tel.x + "px"; p.t.style.top = p.tel.y + "px"; }
  }
  if (p.type === "tel") {
    const n = p.imgs.length, larg = 372, ecart = 80;
    const total = n * larg + (n - 1) * ecart;
    const x0 = p.texte ? 250 : (1920 - total) / 2;
    p.tels = p.imgs.map((im, k) => { const t = construireTel(p.c, im); t.style.left = x0 + k * (larg + ecart) + "px"; t.style.top = "200px"; return t; });
    if (p.texte) {
      const u = el("ul", "puces", p.c); u.style.cssText = `position:absolute; left:${x0 + total + 140}px; top:380px; width:${1920 - (x0 + total + 140) - 160}px`;
      p.lis = p.texte.map((tx) => el("li", null, u, tx));
    }
  }
  if (p.type === "ouverture") {
    const i = el("img", null, p.c); i.src = BLASON; i.style.cssText = "position:absolute; left:50%; top:250px; height:300px; margin-left:-128px;";
    p.blason = i;
    p.a = el("div", "kicker", p.c, "Institut Supérieur Pédagogique et Technique de Bukavu"); p.a.style.cssText = "position:absolute; left:0; right:0; top:600px; text-align:center; color:#C9CCE0";
    p.b = el("div", "grand", p.c, "La plateforme numérique<br>de l’ISPT-Bukavu"); p.b.style.cssText = "position:absolute; left:0; right:0; top:650px; text-align:center";
    p.d = el("div", "kicker", p.c, "Démonstration · données fictives"); p.d.style.cssText = "position:absolute; left:0; right:0; top:1000px; text-align:center; color:#8F94BB; font-size:15px";
  }
  if (p.type === "constat") {
    p.a = el("div", "kicker", p.c, "Aujourd’hui"); p.a.style.cssText = "position:absolute; left:200px; top:210px; color:var(--jaune)";
    const u = el("ul", "puces", p.c); u.style.cssText = "position:absolute; left:200px; top:270px; width:1000px";
    p.lis = ["Des communiqués affichés à la valve, relayés de groupe en groupe", "Des dossiers qui circulent sur papier", "Des déplacements pour connaître une note ou un solde"].map((x) => el("li", null, u, x));
    p.b = el("div", "grand", p.c, "Un seul outil,<br>en ligne."); p.b.style.cssText = "position:absolute; left:200px; top:690px; color:#fff";
  }
  if (p.type === "chiffres") {
    const d = [["150", "tests automatiques des règles de calcul et de sécurité"], ["95", "parcours testés de bout en bout, dont des accès interdits"], ["0", "violation des règles d’accessibilité WCAG 2.2 (niveau AA)"],
      ["602 Ko", "pour la page d’accueil, environ quatre fois moins que la médiane du web mobile"], ["Hors ligne", "les pages déjà consultées restent lisibles sans réseau"], ["QR", "chaque document officiel est vérifiable en ligne"]];
    p.cartes = d.map(([n, l], k) => { const c = el("div", "chiffre", p.c, `<div class="n">${n}</div><div class="l">${l}</div>`); c.style.left = 134 + (k % 3) * 566 + "px"; c.style.top = 200 + Math.floor(k / 3) * 300 + "px"; return c; });
    p.note = el("div", "corps", p.c, "Résultats des tests et mesures, novembre 2026"); p.note.style.cssText = "position:absolute; left:134px; top:830px; color:var(--pierre); font-size:20px";
  }
  if (p.type === "suite") {
    p.a = el("div", "kicker", p.c, "Déjà en ligne"); p.a.style.cssText = "position:absolute; left:200px; top:190px; color:var(--jaune)";
    p.b = el("div", "grand", p.c, DOMAINE); p.b.style.cssText = "position:absolute; left:200px; top:240px";
    p.d = el("div", "moyen", p.c, "Pour l’ouvrir aux étudiants, il reste à intégrer les données officielles de l’institut :"); p.d.style.cssText = "position:absolute; left:200px; top:440px; width:1300px; color:#E4E6F0";
    const z = el("div", null, p.c); z.style.cssText = "position:absolute; left:200px; top:640px; width:1500px";
    p.pastilles = ["Les frais académiques", "Le programme des cours", "Les règles d’évaluation", "Les textes juridiques"].map((x) => el("span", "pastille", z, x));
  }
  if (p.type === "fin") {
    const i = el("img", null, p.c); i.src = BLASON; i.style.cssText = "position:absolute; left:50%; top:270px; height:220px; margin-left:-94px;";
    p.b = el("div", "moyen", p.c, "Oscar AKSANTI CIRHUZA"); p.b.style.cssText = "position:absolute; left:0; right:0; top:560px; text-align:center; color:#fff";
    p.d = el("div", "kicker", p.c, "Génie Informatique · Travail de fin de cycle 2025-2026"); p.d.style.cssText = "position:absolute; left:0; right:0; top:640px; text-align:center; color:#C9CCE0";
    p.e = el("div", "kicker", p.c, "Sous la direction du Prof. SINDANO WA KITWANGA Expédit"); p.e.style.cssText = "position:absolute; left:0; right:0; top:680px; text-align:center; color:#8F94BB; font-size:15px";
  }
}
const chap = chapitres.map(([t0, t1, num, tit]) => { const c = el("div", "chapitre", scene, `<span class="num">${num}</span><span class="tit">${tit}</span>`); return { t0, t1, c }; });
const noir = document.getElementById("noir");

/* ---------- Rendu de l’instant t ---------- */
function camera(img, r) {
  const s = VUE_L / r.w;
  img.style.transform = `scale(${s}) translate(${-r.x}px, ${-r.y}px)`;
}

window.render = function (t) {
  for (const p of plans) {
    // Deux écrans successifs : le nouveau apparaît par-dessus l'ancien, qui reste opaque (pas de voile).
    // Autres changements : l'ancien s'efface, puis le nouveau apparaît (pas de double image).
    const SOMBRES = ["ouverture", "constat", "suite", "fin"];
    const lie = (a, b) => a && b && ((a.type === "ecran" && b.type === "ecran") || (SOMBRES.includes(a.type) && SOMBRES.includes(b.type)));
    const lie_prec = lie(p.prev, p);
    const lie_suiv = lie(p, p.next);
    const ouv = lie_prec ? lisse((t - (p.t0 - 0.4)) / 0.8) : p.prev ? lisse((t - p.t0) / 0.7) : lisse((t - p.t0 + 0.35) / 0.7);
    const ferm = lie_suiv ? (t < p.t1 + 0.45 ? 1 : 0) : p.next ? lisse((p.t1 - t) / 0.6) : lisse((p.t1 + 0.35 - t) / 0.7);
    const o = Math.min(ouv, ferm);
    p.c.style.opacity = o;
    p.c.style.visibility = o > 0.001 ? "visible" : "hidden";
    if (o <= 0.001) continue;
    const k = (t - p.t0) / (p.t1 - p.t0);
    if (p.type === "ecran") {
      const m = doux(k);
      camera(p.i, { x: mix(p.de.x, p.a.x, m), y: mix(p.de.y, p.a.y, m), w: mix(p.de.w, p.a.w, m) });
      const entree = lie_prec ? 1 : lisse((t - p.t0) / 1.0);
      p.c.style.transform = `translateY(${(1 - entree) * 24}px)`;
      if (p.t) { const e = Math.min(lisse((t - p.t0 - 1.2) / 1.2), lisse((p.t1 - 0.2 - t) / 0.6)); p.t.style.opacity = e; p.t.style.transform = `translateY(${(1 - e) * 80 + Math.sin(t * 0.8) * 4}px)`; }
    }
    if (p.type === "tel") {
      p.tels.forEach((tl, i) => { const e = lisse((t - p.t0 - i * 0.35) / 1.1); tl.style.opacity = e; tl.style.transform = `translateY(${(1 - e) * 90 + Math.sin(t * 0.7 + i) * 5}px)`; });
      if (p.lis) p.lis.forEach((li, i) => { const e = lisse((t - p.t0 - 1.4 - i * 0.9) / 0.9); li.style.opacity = e; li.style.transform = `translateX(${(1 - e) * 30}px)`; });
    }
    if (p.type === "ouverture") {
      const a = lisse((t - 0.6) / 2.0), b = lisse((t - 1.6) / 2.0), c = lisse((t - 2.6) / 2.0);
      p.blason.style.opacity = a; p.blason.style.transform = `scale(${0.94 + 0.06 * a})`;
      p.a.style.opacity = b; p.b.style.opacity = c; p.b.style.transform = `translateY(${(1 - c) * 26}px)`; p.d.style.opacity = c * 0.9;
    }
    if (p.type === "constat") {
      p.a.style.opacity = lisse((t - p.t0 - 0.3) / 1);
      p.lis.forEach((li, i) => { const e = lisse((t - p.t0 - 1.5 - i * 3.6) / 1.1); li.style.opacity = e; li.style.transform = `translateX(${(1 - e) * 30}px)`; });
      const e = lisse((t - p.t0 - 14.5) / 1.4); p.b.style.opacity = e; p.b.style.transform = `translateY(${(1 - e) * 26}px)`;
    }
    if (p.type === "chiffres") p.cartes.forEach((c, i) => { const e = lisse((t - p.t0 - 0.4 - i * 0.55) / 1.0); c.style.opacity = e; c.style.transform = `translateY(${(1 - e) * 40}px)`; });
    if (p.type === "chiffres") p.note.style.opacity = lisse((t - p.t0 - 4) / 1);
    if (p.type === "suite") {
      p.a.style.opacity = lisse((t - p.t0 - 0.2) / 1); const b = lisse((t - p.t0 - 0.6) / 1.2); p.b.style.opacity = b; p.b.style.transform = `translateY(${(1 - b) * 24}px)`;
      p.d.style.opacity = lisse((t - p.t0 - 5.5) / 1.2);
      p.pastilles.forEach((x, i) => { const e = lisse((t - p.t0 - 8 - i * 1.2) / 0.9); x.style.opacity = e; x.style.transform = `translateY(${(1 - e) * 20}px)`; });
    }
    if (p.type === "fin") { const e = lisse((t - p.t0 - 0.3) / 1.4); p.b.style.opacity = e; p.d.style.opacity = e; p.e.style.opacity = e; }
  }
  for (const c of chap) {
    const o = Math.min(lisse((t - c.t0 - 0.15) / 0.7), lisse((c.t1 - 0.05 - t) / 0.5));
    c.c.style.opacity = o; c.c.style.transform = `translateX(${(1 - lisse((t - c.t0) / 1.2)) * -20}px)`;
  }
  noir.style.opacity = Math.max(lisse((0.8 - t) / 0.8), lisse((t - (DUREE - 2.2)) / 2.2));
};

window.pret = Promise.all([...document.images].map((i) => i.decode().catch(() => null))).then(() => document.fonts.ready).then(() => true);
render(0);
