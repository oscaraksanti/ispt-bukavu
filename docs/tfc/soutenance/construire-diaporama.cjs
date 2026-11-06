/**
 * Diaporama de soutenance du TFC (PowerPoint, 16:9).
 *
 *   TFC_RACINE=<chemin de docs/tfc> node construire-diaporama.cjs <dossier de sortie>
 *
 * Dépendances : pptxgenjs (et jszip), react, react-dom, react-icons, sharp.
 * Le thème (palette et polices de la charte) est appliqué par appliquer-theme.cjs.
 * Tous les chiffres viennent du mémoire (docs/tfc/memoire) ; ne rien ajouter qui n'y figure pas.
 */
const path = require("node:path");
const fs = require("node:fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const Lu = require("react-icons/lu");

const RACINE = process.env.TFC_RACINE || path.resolve(__dirname, "..");
const DOCS = path.resolve(RACINE, "..");
const SORTIE = process.argv[2] || path.join(RACINE, "sortie");
const FICHIER = path.join(SORTIE, "Soutenance-Aksanti-Cirhuza-Oscar.pptx");

/* ---------- Charte (docs/design/charte.md) ---------- */
const ENCRE = "141B4A";
const BLEU = "283890";
const JAUNE = "FEF200";
const ROUGE = "E31D2F";
const VIOLET = "612D89";
const PAPIER = "F7F6F2";
const PIERRE = "6B675E";
const TEXTE = "1C1B18";
const SUCCES = "1F7A4D";
const ATTENTION = "B25E09";

const THEME = {
  name: "ISPT-Bukavu",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: TEXTE, lt1: "FFFFFF", dk2: ENCRE, lt2: PAPIER,
    accent1: BLEU, accent2: JAUNE, accent3: ROUGE, accent4: VIOLET,
    accent5: SUCCES, accent6: ATTENTION, hlink: BLEU, folHlink: VIOLET,
  },
};

const W = 13.333;
const H = 7.5;
const MX = 0.6; // marge latérale
const LARGEUR = W - 2 * MX;

const img = (rel) => path.join(DOCS, rel);
const ratio = (fichier) => {
  const b = fs.readFileSync(fichier);
  if (b[0] === 0x89) return b.readUInt32BE(16) / b.readUInt32BE(20); // PNG
  let i = 2; // JPEG : chercher SOF
  while (i < b.length) {
    const m = b[i + 1];
    const l = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return b.readUInt16BE(i + 7) / b.readUInt16BE(i + 5);
    i += 2 + l;
  }
  throw new Error("dimensions introuvables : " + fichier);
};

async function icone(nom, couleur, taille = 256) {
  const svg = renderToStaticMarkup(
    React.createElement(Lu[nom], { color: "#" + couleur, size: taille }),
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "AKSANTI CIRHUZA Oscar";
  pres.company = "ISPT-Bukavu";
  pres.title = "Soutenance du travail de fin de cycle";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  /* ---------- Gabarits ---------- */
  pres.defineSlideMaster({
    title: "Sombre",
    background: { color: ENCRE },
    objects: [],
  });
  pres.defineSlideMaster({
    title: "Contenu",
    background: { color: "FFFFFF" },
    margin: [0.5, MX, 0.6, MX],
    objects: [
      {
        placeholder: {
          options: {
            name: "rubrique", type: "body", x: MX, y: 0.42, w: LARGEUR, h: 0.32,
            fontSize: 12, bold: true, color: C.accent1, charSpacing: 2, margin: 0,
          },
          text: "",
        },
      },
      {
        placeholder: {
          options: {
            name: "title", type: "title", x: MX, y: 0.74, w: LARGEUR, h: 0.8,
            fontFace: "Cambria", fontSize: 30, bold: true, color: C.text2, margin: 0, valign: "top", align: "left",
          },
          text: "",
        },
      },
      {
        text: {
          text: "AKSANTI CIRHUZA Oscar  ·  Plateforme web intégrée de l’ISPT-Bukavu",
          options: { x: MX, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: PIERRE, margin: 0 },
        },
      },
    ],
    slideNumber: { x: W - MX - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: PIERRE, align: "right" },
  });

  let section = "";
  const nouvelle = (titre, rubrique, sec) => {
    if (sec && sec !== section) {
      pres.addSection({ title: sec });
      section = sec;
    }
    const s = pres.addSlide({ masterName: "Contenu", sectionTitle: section });
    s.addText(rubrique.toUpperCase(), { placeholder: "rubrique" });
    s.addText(titre, { placeholder: "title" });
    return s;
  };
  const sombre = (sec) => {
    if (sec !== section) {
      pres.addSection({ title: sec });
      section = sec;
    }
    return pres.addSlide({ masterName: "Sombre", sectionTitle: section });
  };
  const texte = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontSize: 16, color: C.text1, valign: "top", ...o });
  const carte = (s, x, y, w, h, nom, couleur = C.background2) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.12, fill: { color: couleur }, line: { type: "none" }, objectName: nom,
    });
  // Motif : pastille ronde numérotée ou porteuse d'une icône.
  const pastille = (s, x, y, d, contenu, fond = C.accent1, encre = C.background1) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fond }, line: { type: "none" } });
    if (contenu.startsWith("image/"))
      s.addImage({ data: contenu, x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56 });
    else
      s.addText(contenu, {
        isTextBox: true, x, y, w: d, h: d, margin: 0, align: "center", valign: "middle",
        fontFace: "Cambria", bold: true, fontSize: Math.round(d * 26), color: encre,
      });
  };
  const image = (s, fichier, x, y, w, h, alt) => {
    const r = ratio(fichier);
    let iw = w, ih = w / r;
    if (ih > h) { ih = h; iw = h * r; }
    s.addImage({ path: fichier, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih, altText: alt });
    return { x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih };
  };
  const source = (s, t) =>
    texte(s, t, { x: MX, y: 6.62, w: LARGEUR, h: 0.28, fontSize: 10, color: PIERRE, italic: true });

  const I = {};
  for (const [cle, nom, coul] of [
    ["valve", "LuMegaphone", "FFFFFF"], ["papier", "LuFileText", "FFFFFF"], ["tableur", "LuSheet", "FFFFFF"],
    ["sceau", "LuStamp", "FFFFFF"], ["site", "LuGlobe", "FFFFFF"], ["admission", "LuUserPlus", "FFFFFF"],
    ["espaces", "LuSmartphone", "FFFFFF"], ["notes", "LuCalculator", "FFFFFF"], ["frais", "LuWallet", "FFFFFF"],
    ["qr", "LuQrCode", "FFFFFF"], ["admin", "LuShieldCheck", "FFFFFF"], ["cle", "LuKeyRound", "FFFFFF"],
    ["journal", "LuScrollText", "FFFFFF"], ["base", "LuDatabase", "FFFFFF"], ["serveur", "LuServer", "FFFFFF"],
    ["ok", "LuCircleCheck", "FFFFFF"], ["partiel", "LuCircleDashed", "FFFFFF"], ["jouer", "LuMonitorPlay", ENCRE],
    ["limite", "LuTriangleAlert", "FFFFFF"], ["fleche", "LuArrowRight", "FFFFFF"],
  ])
    I[cle] = await icone(nom, coul);

  /* ================= 1. Titre ================= */
  {
    const s = sombre("Ouverture");
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.55, w: 3.3, h: 3.9, rectRadius: 0.2, fill: { color: "FFFFFF" }, line: { type: "none" }, objectName: "Écrin du blason",
    });
    image(s, path.join(RACINE, "ressources", "blason.png"), 1.05, 1.8, 2.8, 3.4, "Blason de l’ISPT-Bukavu");
    texte(s, "Travail de fin de cycle  ·  Licence en Génie Informatique", {
      x: 4.7, y: 1.2, w: 8, h: 0.35, fontSize: 14, color: JAUNE, bold: true,
    });
    texte(s, "Conception et réalisation d’une plateforme web intégrée de gestion académique et de communication institutionnelle", {
      x: 4.7, y: 1.7, w: 8.1, h: 2.3, fontFace: "Cambria", fontSize: 32, bold: true, color: "FFFFFF",
    });
    texte(s, "Cas de l’ISPT-Bukavu", { x: 4.7, y: 4.05, w: 8, h: 0.5, fontFace: "Cambria", italic: true, fontSize: 24, color: JAUNE });
    texte(s, [
      { text: "Présenté par ", options: { color: "C9CCE0" } },
      { text: "AKSANTI CIRHUZA Oscar", options: { bold: true, breakLine: true } },
      { text: "Directeur : ", options: { color: "C9CCE0" } },
      { text: "Prof. SINDANO WA KITWANGA Expédit", options: { bold: true } },
    ], { x: 4.7, y: 4.85, w: 8, h: 0.8, fontSize: 16, color: "FFFFFF", paraSpaceAfter: 4 });
    texte(s, "Section Électronique et Informatique  ·  Année académique 2025-2026", {
      x: 4.7, y: 6.35, w: 8, h: 0.35, fontSize: 13, color: "C9CCE0",
    });
    s.addNotes(
      "≈ 30 s. Saluer le jury : « Monsieur le Président, honorables membres du jury, chers invités. » " +
        "Présenter le titre et le directeur. Annoncer la durée : environ vingt minutes d’exposé, dont cinq minutes de démonstration.",
    );
  }

  /* ================= 2. Plan ================= */
  {
    const s = nouvelle("Plan de l’exposé", "Ouverture", "Ouverture");
    const parties = [
      ["Contexte et problématique", "Pourquoi cette plateforme"],
      ["Démarche de recherche", "Hypothèses et méthodes"],
      ["Analyse et état de l’art", "Existant, besoins, solutions"],
      ["Conception", "UML, architecture, sécurité"],
      ["Réalisation et démonstration", "La plateforme en ligne"],
      ["Résultats", "Tests et vérification des hypothèses"],
      ["Conclusion", "Limites et perspectives"],
    ];
    parties.forEach(([t, d], i) => {
      const col = i < 4 ? 0 : 1;
      const lig = i < 4 ? i : i - 4;
      const x = MX + col * 6.2;
      const y = 1.95 + lig * 1.15;
      pastille(s, x, y, 0.75, String(i + 1));
      texte(s, t, { x: x + 1.0, y: y + 0.02, w: 5, h: 0.4, fontSize: 20, bold: true, color: C.text2 });
      texte(s, d, { x: x + 1.0, y: y + 0.42, w: 5, h: 0.32, fontSize: 14, color: PIERRE });
    });
    s.addNotes("≈ 20 s. Lire le plan sans s’attarder.");
  }

  /* ================= 3. Contexte ================= */
  {
    const s = nouvelle("Un institut qui fonctionne encore sur papier", "1 · Contexte", "Contexte et problématique");
    texte(s, [
      { text: "ISPT-Bukavu", options: { bold: true, color: C.text2, breakLine: true } },
      { text: "Établissement public créé par l’arrêté ministériel n° 219 du 8 novembre 2010, opérationnel depuis 2011.", options: { breakLine: true } },
      { text: "Système LMD : 4 années, 8 semestres, diplôme de Licence.", options: {} },
    ], { x: MX, y: 1.85, w: 5.2, h: 2.4, fontSize: 16, paraSpaceAfter: 8 });
    const constats = [
      ["valve", "Communiqués affichés à la valve, relayés dans des groupes de messagerie"],
      ["papier", "Dossiers de candidature en farde ou par courrier électronique"],
      ["tableur", "Notes et bulletins calculés dans un classeur de tableur"],
      ["sceau", "Documents délivrés sur papier, vérifiables seulement à l’institut"],
    ];
    constats.forEach(([ic, t], i) => {
      const y = 1.8 + i * 0.66;
      pastille(s, 6.35, y, 0.5, I[ic]);
      texte(s, t, { x: 7.05, y: y + 0.02, w: 5.7, h: 0.5, fontSize: 15, valign: "middle" });
    });
    texte(s, "Circuit actuel d’un communiqué officiel", { x: MX, y: 4.6, w: 8, h: 0.3, fontSize: 12, bold: true, color: PIERRE });
    image(s, img("tfc/figures/ch1-circuit-communique.png"), MX, 4.95, LARGEUR, 1.6, "Circuit actuel de diffusion d’un communiqué officiel");
    source(s, "Sources : dépliant de l’institut ; données transmises par l’institut (2026) ; figure 1.3 du mémoire.");
    s.addNotes(
      "≈ 1 min. Présenter brièvement l’institut, puis le constat vécu en tant qu’étudiant : l’information n’atteint que ceux qui sont sur place, " +
        "les démarches imposent des déplacements, et les copies qui circulent ne peuvent pas être authentifiées.",
    );
  }

  /* ================= 4. Contraintes ================= */
  {
    const s = nouvelle("Des contraintes fortes, nationales et locales", "1 · Contexte", "Contexte et problématique");
    const stats = [
      ["30,5 %", "de la population congolaise utilisait internet à la fin de 2025", "Kemp, 2025", BLEU],
      ["10,3 %", "du revenu national brut par habitant pour un panier de données mobiles (2022)", "UIT, 2023", VIOLET],
      ["Art. 201", "Code du numérique : données personnelles hébergées en RDC, sauf autorisation", "Ordonnance-loi n° 23/010", ROUGE],
    ];
    stats.forEach(([n, d, src, coul], i) => {
      const x = MX + i * 4.12;
      carte(s, x, 1.9, 3.85, 2.9, "Chiffre " + (i + 1));
      texte(s, n, { x: x + 0.3, y: 2.1, w: 3.3, h: 1.0, fontFace: "Cambria", fontSize: 48, bold: true, color: coul });
      texte(s, d, { x: x + 0.3, y: 3.15, w: 3.3, h: 1.1, fontSize: 15 });
      texte(s, src, { x: x + 0.3, y: 4.35, w: 3.3, h: 0.3, fontSize: 11, italic: true, color: PIERRE });
    });
    pastille(s, MX, 5.2, 0.55, I.admin);
    texte(s, [
      { text: "Instruction n° 025 du 13 novembre 2023 : ", options: { bold: true, color: C.text2 } },
      { text: "numérisation des dossiers et usage obligatoire d’OptSolution pour les établissements publics. La plateforme doit donc compléter la solution ministérielle, pas la concurrencer." },
    ], { x: MX + 0.8, y: 5.15, w: LARGEUR - 0.8, h: 0.8, fontSize: 15, valign: "middle" });
    source(s, "Sources : Kemp (2025) ; UIT (2023, 2025) ; ordonnance-loi n° 23/010 (2023) ; MINESU (2023).");
    s.addNotes(
      "≈ 45 s. Trois contraintes pèsent sur toute solution : une connectivité faible et chère, d’où la légèreté ; " +
        "la protection des données imposée par le Code du numérique ; et l’obligation ministérielle OptSolution, d’où le positionnement en complément.",
    );
  }

  /* ================= 5. Problématique ================= */
  {
    const s = nouvelle("Problématique", "1 · Problématique", "Contexte et problématique");
    carte(s, MX, 1.85, LARGEUR, 2.15, "Question centrale", ENCRE);
    texte(s, "Comment doter l’ISPT-Bukavu d’un outil numérique unique, fiable et adapté à la faible connectivité, qui diffuse l’information officielle de façon ciblée et vérifiable, dématérialise les principaux processus et reste administrable par le personnel sans compétence technique ?", {
      x: MX + 0.45, y: 2.05, w: LARGEUR - 0.9, h: 1.75, fontFace: "Cambria", italic: true, fontSize: 21, color: "FFFFFF", valign: "middle",
    });
    const q = [
      ["Forme technique", "Quel outil reste utilisable sur un téléphone d’entrée de gamme, avec une connexion lente ou intermittente ?"],
      ["Organisation", "Comment réunir communication et processus académiques, chacun n’accédant qu’à ses propres données ?"],
      ["Cadre réglementaire", "Comment respecter la solution ministérielle et la protection des données personnelles ?"],
    ];
    q.forEach(([t, d], i) => {
      const x = MX + i * 4.12;
      pastille(s, x, 4.35, 0.6, "Q" + (i + 1), JAUNE, ENCRE);
      texte(s, t, { x: x + 0.8, y: 4.4, w: 3.1, h: 0.45, fontSize: 17, bold: true, color: C.text2, valign: "middle" });
      texte(s, d, { x, y: 5.15, w: 3.85, h: 1.3, fontSize: 15 });
    });
    s.addNotes("≈ 45 s. Lire la question centrale lentement, puis citer les trois questions spécifiques.");
  }

  /* ================= 6. Hypothèses ================= */
  {
    const s = nouvelle("Trois hypothèses", "2 · Démarche", "Démarche");
    const h = [
      ["H1", "Une application web progressive", "Légère, rendue côté serveur et consultable hors connexion, elle convient mieux à Bukavu qu’une application mobile native."],
      ["H2", "Une plateforme unique", "Organisée autour d’une valve ciblée et de circuits de validation, avec des droits par rôle vérifiés côté serveur à chaque requête."],
      ["H3", "Une architecture portable", "En complément de la plateforme ministérielle, avec des exports, et capable de rapatrier l’hébergement en RDC."],
    ];
    h.forEach(([n, t, d], i) => {
      const x = MX + i * 4.12;
      carte(s, x, 1.9, 3.85, 4.45, "Hypothèse " + (i + 1));
      pastille(s, x + 0.3, 2.15, 0.85, n);
      texte(s, t, { x: x + 0.3, y: 3.25, w: 3.3, h: 0.85, fontSize: 19, bold: true, color: C.text2 });
      texte(s, d, { x: x + 0.3, y: 4.15, w: 3.3, h: 2.0, fontSize: 15 });
    });
    s.addNotes(
      "≈ 1 min. Insister : chaque hypothèse est vérifiable par une mesure objective au chapitre 4 " +
        "(poids et temps d’affichage, tests d’accès entre rôles, portabilité démontrée par restauration).",
    );
  }

  /* ================= 7. Méthodologie ================= */
  {
    const s = nouvelle("Méthodologie : construire, puis évaluer", "2 · Démarche", "Démarche");
    texte(s, "Recherche par la conception (Hevner et al., 2004 ; Peffers et al., 2007)", {
      x: MX, y: 1.8, w: LARGEUR, h: 0.35, fontSize: 15, bold: true, color: PIERRE,
    });
    const etapes = ["Problème", "Objectifs", "Conception", "Démonstration", "Évaluation", "Communication"];
    const lw = 1.85, pas = (LARGEUR - lw) / 5;
    etapes.forEach((e, i) => {
      const x = MX + i * pas;
      carte(s, x, 2.3, lw, 1.05, "Étape " + (i + 1), i === 2 ? BLEU : C.background2);
      texte(s, String(i + 1), { x: x + 0.15, y: 2.38, w: 0.5, h: 0.35, fontSize: 13, bold: true, color: i === 2 ? JAUNE : BLEU });
      texte(s, e, { x: x + 0.15, y: 2.72, w: lw - 0.3, h: 0.45, fontSize: 15, bold: true, color: i === 2 ? "FFFFFF" : C.text2 });
    });
    const col = [
      ["Méthodes", [
        "Approche systémique : l’institut comme ensemble de services en interaction",
        "Développement itératif et incrémental, modélisé en UML",
      ]],
      ["Techniques", [
        "Analyse documentaire, observation directe, échanges avec la direction",
        "Étude comparative de 9 établissements congolais",
        "Tests automatisés et mesures de performance",
      ]],
    ];
    col.forEach(([t, l], i) => {
      const x = MX + i * 6.2;
      texte(s, t, { x, y: 3.8, w: 5.9, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
      texte(s, l.map((v, k) => ({ text: v, options: { bullet: true, breakLine: k < l.length - 1 } })), {
        x, y: 4.3, w: 5.9, h: 1.7, fontSize: 15, paraSpaceAfter: 6,
      });
    });
    carte(s, MX, 6.0, LARGEUR, 0.5, "Mention sur l’enquête", "FFF6CC");
    texte(s, "Le questionnaire préparé n’a pas été administré : aucune donnée d’enquête n’est présentée.", {
      x: MX + 0.25, y: 6.05, w: LARGEUR - 0.5, h: 0.4, fontSize: 14, color: TEXTE, valign: "middle",
    });
    s.addNotes(
      "≈ 45 s. La recherche par la conception produit une connaissance en construisant un artefact puis en l’évaluant. " +
        "Dire honnêtement que le questionnaire n’a pas été administré : il figure en annexe pour l’évaluation après mise en service.",
    );
  }

  /* ================= 8. Existant -> besoins ================= */
  {
    const s = nouvelle("De l’analyse de l’existant à neuf besoins", "3 · Analyse", "Analyse et état de l’art");
    const lignes = [
      ["Communication", "Information réservée aux présents ; aucune trace de réception"],
      ["Admissions", "Pas de suivi pour le candidat ; vérification manuelle"],
      ["Horaires", "Conflits non détectés ; modifications non signalées"],
      ["Notes", "Plusieurs formules de moyenne ; écarts entre PV et bulletin"],
      ["Frais", "Solde inconnu de l’étudiant sans déplacement"],
      ["Documents", "Authenticité vérifiable seulement à l’institut"],
    ];
    const entete = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: ENCRE } } });
    s.addTable(
      [[entete("Processus"), entete("Limite principale")], ...lignes.map(([a, b]) => [{ text: a, options: { bold: true, color: ENCRE } }, b])],
      {
        x: MX, y: 1.85, w: 6.6, colW: [1.7, 4.9], fontSize: 13, fontFace: "Calibri", color: TEXTE,
        border: { type: "solid", pt: 0.75, color: "DEDBD2" }, rowH: 0.56, valign: "middle", margin: [0.04, 0.1, 0.04, 0.1],
      },
    );
    carte(s, 7.6, 1.85, 5.13, 4.65, "Besoins", ENCRE);
    texte(s, "9", { x: 7.9, y: 1.95, w: 1.2, h: 1.1, fontFace: "Cambria", fontSize: 66, bold: true, color: JAUNE });
    texte(s, "besoins identifiés", { x: 9.0, y: 2.25, w: 3.5, h: 0.5, fontSize: 20, bold: true, color: "FFFFFF" });
    const b = [
      "Valve en ligne ciblée, avec accusé de lecture",
      "Candidature en ligne et suivi du dossier",
      "Horaire personnel et alertes de modification",
      "Moyennes selon une règle unique et testée",
      "Situation financière et reçus consultables",
      "Documents vérifiables par code QR",
      "Site public administré par l’institut",
      "Droits par rôle, journal, sauvegardes",
      "Usage sur téléphone et connexion lente",
    ];
    texte(s, b.map((v, k) => ({ text: `${k + 1}.  ${v}`, options: { breakLine: k < b.length - 1 } })), {
      x: 7.9, y: 3.1, w: 4.6, h: 3.3, fontSize: 14, color: "FFFFFF", paraSpaceAfter: 2,
    });
    source(s, "Source : tableau 1.5 et section 1.3.3 du mémoire.");
    s.addNotes(
      "≈ 1 min. Cinq processus analysés. Exemple marquant : dans le classeur de bulletins reçu, trois calculs de moyenne coexistent, " +
        "si bien que 12 étudiants sur 16 ont une moyenne différente entre le PV et le bulletin. Chaque limite donne un besoin.",
    );
  }

  /* ================= 9. État de l'art ================= */
  {
    const s = nouvelle("Aucune solution existante ne couvre l’ensemble", "3 · État de l’art", "Analyse et état de l’art");
    const famille = [
      ["Plateformes d’apprentissage", "Moodle, Canvas, Open edX", "Cours et supports, mais ni admissions, ni frais, ni délibérations, ni valve ciblée"],
      ["Progiciels éducatifs", "OpenEduCat, Fedena", "Périmètre large, mais adaptation lourde (Odoo) ou projet non maintenu"],
      ["Solutions de grandes universités", "PeopleSoft, ACMIS", "Coût des licences ou système non transférable"],
      ["Solution ministérielle", "OptSolution", "Inscription et contrôle par l’État, sans communication interne ni vie pédagogique"],
    ];
    famille.forEach(([t, ex, lim], i) => {
      const y = 1.85 + i * 1.05;
      carte(s, MX, y, 7.6, 0.9, "Famille " + (i + 1));
      texte(s, t, { x: MX + 0.25, y: y + 0.1, w: 3.0, h: 0.35, fontSize: 15, bold: true, color: C.text2 });
      texte(s, ex, { x: MX + 0.25, y: y + 0.47, w: 3.0, h: 0.3, fontSize: 13, italic: true, color: PIERRE });
      texte(s, lim, { x: MX + 3.3, y: y + 0.08, w: 4.15, h: 0.75, fontSize: 14, valign: "middle" });
    });
    carte(s, 8.55, 1.85, 4.18, 4.05, "Constat RDC", BLEU);
    texte(s, "9", { x: 8.85, y: 1.95, w: 1.2, h: 1.0, fontFace: "Cambria", fontSize: 60, bold: true, color: JAUNE });
    texte(s, "établissements congolais observés le 3 novembre 2026", { x: 9.85, y: 2.15, w: 2.7, h: 0.8, fontSize: 15, bold: true, color: "FFFFFF" });
    const c = ["Inscription encore hybride (banque, guichet)", "Portails inaccessibles ou contradictoires", "Pages vides sans JavaScript"];
    texte(s, c.map((v, k) => ({ text: v, options: { bullet: true, breakLine: k < c.length - 1 } })), {
      x: 8.85, y: 3.2, w: 3.65, h: 2.5, fontSize: 15, color: "FFFFFF", paraSpaceAfter: 8,
    });
    texte(s, "Positionnement : une plateforme propre à l’institut, en complément d’OptSolution.", {
      x: MX, y: 6.15, w: LARGEUR, h: 0.4, fontSize: 16, bold: true, color: C.accent1,
    });
    s.addNotes(
      "≈ 1 min. Les plateformes d’apprentissage ne gèrent pas l’administration ; les progiciels exigent une adaptation lourde ; " +
        "OptSolution répond aux besoins de l’État. D’où le choix d’une application conçue pour l’institut, sur des composants libres.",
    );
  }

  /* ================= 10. Solution ================= */
  {
    const s = nouvelle("La solution : une seule plateforme pour tout l’institut", "4 · Solution", "Conception");
    const m = [
      ["site", "Site institutionnel", "Formations, actualités, agenda, galerie, administrés par l’institut"],
      ["admission", "Admissions en ligne", "Du dépôt du dossier à l’inscription de l’admis"],
      ["valve", "Valve et messagerie", "Communiqués ciblés, messagerie, Campus modéré, alertes sur le téléphone"],
      ["espaces", "Espaces personnels", "Candidat, étudiant, enseignant ; pages déjà vues lisibles hors connexion"],
      ["notes", "Notes et délibérations", "Saisie, validation, publication ; règlement paramétrable"],
      ["frais", "Frais académiques", "Barèmes, paiements, reçus numérotés, exonérations"],
      ["qr", "Documents vérifiables", "Bulletins et attestations à code QR"],
      ["admin", "Administration", "Rôles, journal d’activité, pilotage de la direction"],
    ];
    m.forEach(([ic, t, d], i) => {
      const col = i % 4, lig = Math.floor(i / 4);
      const x = MX + col * 3.07, y = 1.9 + lig * 2.35;
      carte(s, x, y, 2.85, 2.15, "Module " + t);
      pastille(s, x + 0.25, y + 0.25, 0.6, I[ic]);
      texte(s, t, { x: x + 0.25, y: y + 0.95, w: 2.4, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
      texte(s, d, { x: x + 0.25, y: y + 1.35, w: 2.4, h: 0.75, fontSize: 13, color: TEXTE });
    });
    s.addNotes(
      "≈ 45 s. Une seule application, un seul code et une seule base. Souligner que tout est administrable par le personnel.",
    );
  }

  /* ================= 11. Conception UML ================= */
  {
    const s = nouvelle("Une conception modélisée en UML", "4 · Conception", "Conception");
    const chiffres = [["17", "diagrammes UML"], ["75", "tables principales"], ["8", "acteurs"]];
    chiffres.forEach(([n, l], i) => {
      const y = 1.9 + i * 1.15;
      texte(s, n, { x: MX, y, w: 1.4, h: 0.85, fontFace: "Cambria", fontSize: 44, bold: true, color: BLEU });
      texte(s, l, { x: MX + 1.45, y: y + 0.18, w: 2.6, h: 0.5, fontSize: 17, bold: true, color: C.text2 });
    });
    texte(s, "Cas d’utilisation, séquences, activité, états, classes, composants et déploiement. Les transitions d’état sont centralisées dans le code ; celles des candidatures et des évaluations sont testées.", {
      x: MX, y: 5.45, w: 3.9, h: 1.1, fontSize: 14,
    });
    const g = image(s, img("conception/figures/etats-deliberation.png"), 4.85, 1.85, 3.75, 4.3, "Diagramme d’états d’une délibération");
    texte(s, "États d’une délibération (fig. 3.11)", { x: 4.85, y: g.y + g.h + 0.08, w: 3.75, h: 0.3, fontSize: 11, color: PIERRE, align: "center" });
    const d = image(s, img("conception/figures/cas-utilisation-academique.png"), 8.9, 1.85, 3.85, 4.3, "Cas d’utilisation des étudiants et des enseignants");
    texte(s, "Cas d’utilisation : étudiants et enseignants (fig. 3.2)", { x: 8.9, y: d.y + d.h + 0.08, w: 3.85, h: 0.3, fontSize: 11, color: PIERRE, align: "center" });
    s.addNotes(
      "≈ 1 min. Exemple de la délibération : préparation, clôture, proclamation ; le règlement appliqué est figé au moment de la clôture, " +
        "ce qui garantit qu’un bulletin émis ne change plus. Préciser : 75 tables principales plus 2 tables de liaison.",
    );
  }

  /* ================= 12. Architecture ================= */
  {
    const s = nouvelle("Une architecture sobre en trois couches", "4 · Architecture", "Conception");
    const g = image(s, img("conception/figures/composants.png"), MX, 1.85, 8.2, 3.9, "Architecture logique de l’application");
    texte(s, "Architecture logique (fig. 3.16)", { x: MX, y: g.y + g.h + 0.08, w: 8.2, h: 0.3, fontSize: 11, color: PIERRE, align: "center" });
    const pile = [
      ["Interface et serveur", "Next.js 16, React 19, TypeScript"],
      ["Données", "PostgreSQL 17, Prisma 7"],
      ["Sécurité", "Argon2id, sessions révocables"],
      ["Hébergement", "Vercel, Supabase, Resend"],
      ["Tests", "Vitest, Playwright, axe-core"],
    ];
    pile.forEach(([t, d], i) => {
      const y = 1.85 + i * 0.86;
      carte(s, 9.15, y, 3.58, 0.74, "Pile " + t);
      texte(s, t, { x: 9.35, y: y + 0.06, w: 3.2, h: 0.3, fontSize: 12, bold: true, color: BLEU });
      texte(s, d, { x: 9.35, y: y + 0.34, w: 3.2, h: 0.34, fontSize: 14, color: TEXTE });
    });
    texte(s, "Pages rendues côté serveur : un contenu s’affiche toujours, même si les scripts ne se chargent pas.", {
      x: MX, y: 6.15, w: LARGEUR, h: 0.4, fontSize: 15, bold: true, color: C.text2,
    });
    s.addNotes(
      "≈ 45 s. Présentation, application, infrastructure. Chaque module sépare règles pures (testées), actions (droits, validation, écriture) et lectures. " +
        "Une application web progressive plutôt qu’une application native : un seul code, aucune installation par un magasin d’applications.",
    );
  }

  /* ================= 13. Sécurité ================= */
  {
    const s = nouvelle("La sécurité vérifiée côté serveur, à chaque requête", "4 · Sécurité", "Conception");
    const chiffres = [["22", "permissions élémentaires"], ["11", "rôles calqués sur l’organigramme"], ["21", "constats en deux revues : 20 corrigés, 1 vérifié"]];
    chiffres.forEach(([n, l], i) => {
      const x = MX + i * 4.12;
      carte(s, x, 1.85, 3.85, 1.45, "Chiffre sécurité " + (i + 1), ENCRE);
      texte(s, n, { x: x + 0.3, y: 1.95, w: 1.3, h: 1.2, fontFace: "Cambria", fontSize: 46, bold: true, color: JAUNE, valign: "middle" });
      texte(s, l, { x: x + 1.55, y: 2.0, w: 2.15, h: 1.15, fontSize: 15, bold: true, color: "FFFFFF", valign: "middle" });
    });
    const mesures = [
      ["cle", "Droits sur la ressource", "Un enseignant ne note que ses cours ; un étudiant ne voit que ses données."],
      ["serveur", "Sessions en base", "Jeton aléatoire en cookie protégé, révocable ; seule son empreinte est conservée."],
      ["base", "Base fermée", "Sécurité au niveau des lignes sur toutes les tables ; mots de passe en Argon2id."],
      ["journal", "Traçabilité", "Journal des actions sensibles, avec auteur, date, état avant et après."],
    ];
    mesures.forEach(([ic, t, d], i) => {
      const col = i % 2, lig = Math.floor(i / 2);
      const x = MX + col * 6.2, y = 3.65 + lig * 1.35;
      pastille(s, x, y, 0.6, I[ic]);
      texte(s, t, { x: x + 0.8, y: y - 0.02, w: 5.2, h: 0.36, fontSize: 16, bold: true, color: C.text2 });
      texte(s, d, { x: x + 0.8, y: y + 0.36, w: 5.2, h: 0.75, fontSize: 14 });
    });
    source(s, "Mesures fondées sur le Top 10 de l’OWASP (2025) ; tableau 3.8 du mémoire.");
    s.addNotes(
      "≈ 1 min. Point clé : un bouton masqué ne protège rien ; chaque page et chaque action vérifient identité, permission et droit sur la ressource. " +
        "On ne peut attribuer un rôle que si l’on détient déjà toutes ses permissions, et nul ne peut modifier ses propres rôles.",
    );
  }

  /* ================= 14. Réalisation ================= */
  {
    const s = nouvelle("La plateforme réalisée, en ligne", "5 · Réalisation", "Réalisation");
    const a = image(s, img("tfc/figures/ch4-accueil.jpg"), MX, 1.85, 6.3, 4.3, "Page d’accueil du site institutionnel");
    texte(s, "Site institutionnel (fig. 4.1)", { x: a.x, y: a.y + a.h + 0.08, w: a.w, h: 0.3, fontSize: 11, color: PIERRE, align: "center" });
    const b = image(s, img("tfc/figures/ch4-etudiant-mobile.jpg"), 7.15, 1.85, 5.58, 4.3, "Espace étudiant sur téléphone");
    texte(s, "Espace étudiant sur téléphone (fig. 4.4)", { x: b.x, y: b.y + b.h + 0.08, w: b.w, h: 0.3, fontSize: 11, color: PIERRE, align: "center" });
    texte(s, "www.isptbukavu.org", { x: MX, y: 6.3, w: LARGEUR, h: 0.4, fontSize: 18, bold: true, color: BLEU, align: "center" });
    s.addNotes("≈ 30 s. Transition vers la démonstration : « Plutôt que de décrire chaque écran, je vous propose de les voir en fonctionnement. »");
  }

  /* ================= 15. Démonstration ================= */
  {
    const s = sombre("Réalisation");
    s.addImage({ data: await icone("LuMonitorPlay", JAUNE), x: MX, y: 0.75, w: 0.8, h: 0.8 });
    texte(s, "Démonstration", { x: MX + 1.05, y: 0.72, w: 8, h: 0.9, fontFace: "Cambria", fontSize: 40, bold: true, color: "FFFFFF", valign: "middle" });
    texte(s, "5 minutes  ·  instance de démonstration, données fictives", { x: MX + 1.05, y: 1.55, w: 9, h: 0.4, fontSize: 16, color: "C9CCE0" });
    const etapes = [
      ["0:00", "Site public", "Accueil, fiche d’une filière, admissions"],
      ["0:40", "Candidat", "Dossier, pièces, état d’avancement"],
      ["1:20", "Enseignant", "Ses cours et la grille de notes"],
      ["2:00", "Administration", "Validation, publication, pilotage"],
      ["3:00", "Étudiant", "Notes, valve, demande d’attestation"],
      ["4:00", "Vérification", "Émission du document, contrôle par code QR"],
    ];
    etapes.forEach(([t, ti, d], i) => {
      const col = i % 3, lig = Math.floor(i / 3);
      const x = MX + col * 4.12, y = 2.55 + lig * 2.0;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 3.85, h: 1.75, rectRadius: 0.12, fill: { color: "232C66" }, line: { type: "none" }, objectName: "Étape de démonstration " + (i + 1),
      });
      texte(s, t, { x: x + 0.25, y: y + 0.18, w: 1.2, h: 0.35, fontSize: 14, bold: true, color: JAUNE });
      texte(s, ti, { x: x + 0.25, y: y + 0.55, w: 3.4, h: 0.45, fontSize: 20, bold: true, color: "FFFFFF" });
      texte(s, d, { x: x + 0.25, y: y + 1.05, w: 3.4, h: 0.55, fontSize: 15, color: "C9CCE0" });
    });
    texte(s, "En cas de coupure du réseau : vidéo de secours enregistrée sur l’ordinateur.", {
      x: MX, y: 6.7, w: LARGEUR, h: 0.35, fontSize: 13, italic: true, color: "C9CCE0",
    });
    s.addNotes(
      "5 min. Suivre le scénario de démonstration (fichier scenario-demonstration.md). Les onglets sont ouverts et connectés à l’avance. " +
        "Si la connexion tombe ou dépasse 10 s, basculer sur la vidéo de secours sans commentaire d’excuse prolongé.",
    );
  }

  /* ================= 16. Tests ================= */
  {
    const s = nouvelle("Une qualité mesurée, pas déclarée", "6 · Résultats", "Résultats");
    const stats = [
      ["203", "tests unitaires réussis"],
      ["117", "tests de bout en bout, dont des accès interdits"],
      ["0", "violation WCAG 2.2 AA sur 74 pages"],
      ["16/16", "décisions d’un jury réel reproduites"],
    ];
    stats.forEach(([n, l], i) => {
      const y = 1.85 + i * 1.18;
      texte(s, n, { x: MX, y, w: 1.9, h: 0.8, fontFace: "Cambria", fontSize: 40, bold: true, color: BLEU, valign: "middle" });
      texte(s, l, { x: MX + 1.95, y, w: 2.75, h: 0.8, fontSize: 15, bold: true, color: C.text2, valign: "middle" });
    });
    const pages = ["Accueil", "Formations", "Admissions", "Actualités", "Valve", "Contact", "Connexion", "Médiane accueil mobile"];
    const poids = [602, 510, 387, 321, 320, 326, 365, 2559];
    s.addChart(pres.charts.BAR, [{ name: "Poids à la première visite (Ko)", labels: pages, values: poids }], {
      x: 5.3, y: 1.75, w: 7.43, h: 4.6, barDir: "bar", catAxisOrientation: "maxMin",
      showTitle: true, title: "Poids à la première visite (Ko), réseau mobile lent simulé",
      titleFontSize: 13, titleColor: ENCRE, titleFontFace: "+mn-lt",
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0", dataLabelFontSize: 11, dataLabelColor: TEXTE, dataLabelFontFace: "+mn-lt",
      chartColors: [BLEU, BLEU, BLEU, BLEU, BLEU, BLEU, BLEU, "B8B4AA"], invertedColors: [BLEU, BLEU, BLEU, BLEU, BLEU, BLEU, BLEU, "B8B4AA"],
      varyColors: true,
      catAxisLabelColor: TEXTE, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: false, barGapWidthPct: 45,
    });
    source(s, "Mesures du 4 novembre 2026 sur le site en ligne (tableau 4.2) ; médiane : HTTP Archive (2025). Contenu principal affiché en moins de 3 s.");
    s.addNotes(
      "≈ 1 min. Les tests s’exécutent à chaque modification du code. La page la plus lourde pèse environ quatre fois moins que la médiane du web mobile ; " +
        "les visites suivantes ne transfèrent que 7 à 18 Ko. Le moteur de délibération reproduit les 16 décisions du jury sur des notes anonymisées.",
    );
  }

  /* ================= 17. Hypothèses vérifiées ================= */
  {
    const s = nouvelle("Vérification des hypothèses", "6 · Résultats", "Résultats");
    const v = [
      ["H1", "Application web progressive", "Pages de 320 à 602 Ko, contenu affiché en moins de 3 s, lecture hors connexion", "Vérifiée en conditions simulées", SUCCES, "ok"],
      ["H2", "Plateforme unique, droits vérifiés", "Principaux processus réunis ; 320 tests réussis, dont les tentatives d’accès interdites", "Vérifiée sur le plan technique", SUCCES, "ok"],
      ["H3", "Architecture portable", "Restauration complète sans perte ; exports en tableur des inscriptions, notes et résultats", "Partiellement vérifiée", ATTENTION, "partiel"],
    ];
    v.forEach(([n, t, r, c, coul, ic], i) => {
      const y = 1.85 + i * 1.55;
      carte(s, MX, y, LARGEUR, 1.35, "Vérification " + n);
      pastille(s, MX + 0.25, y + 0.3, 0.75, n);
      texte(s, t, { x: MX + 1.25, y: y + 0.15, w: 6.3, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
      texte(s, r, { x: MX + 1.25, y: y + 0.58, w: 6.3, h: 0.65, fontSize: 14 });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 8.35, y: y + 0.32, w: 4.15, h: 0.7, rectRadius: 0.35, fill: { color: coul }, line: { type: "none" }, objectName: "Statut " + n,
      });
      s.addImage({ data: I[ic], x: 8.55, y: y + 0.45, w: 0.44, h: 0.44 });
      texte(s, c, { x: 9.1, y: y + 0.32, w: 3.3, h: 0.7, fontSize: 15, bold: true, color: "FFFFFF", valign: "middle" });
    });
    texte(s, "H3 : les exports au format ministériel et l’hébergement en RDC restent à réaliser.", {
      x: MX, y: 6.5, w: LARGEUR, h: 0.35, fontSize: 14, italic: true, color: PIERRE,
    });
    s.addNotes(
      "≈ 1 min. Être nuancé : H1 vérifiée en simulation, à confirmer sur le réseau d’un opérateur local ; " +
        "H2 vérifiée techniquement, l’adoption par les usagers reste à évaluer ; H3 seulement partielle.",
    );
  }

  /* ================= 18. Limites et perspectives ================= */
  {
    const s = nouvelle("Limites et perspectives", "7 · Conclusion", "Conclusion");
    const lim = [
      "Pas encore d’évaluation par les usagers",
      "Mesures de performance simulées",
      "Données hébergées hors de la RDC",
      "Données officielles attendues de l’institut",
    ];
    const per = [
      "Évaluer auprès des usagers avec le questionnaire préparé",
      "Mesurer sur place, sur les réseaux de Bukavu",
      "Rapatrier l’hébergement en RDC ou obtenir l’autorisation",
      "Exports au format ministériel, puis échange automatique",
      "Paiement par monnaie mobile",
      "Règles du Campus validées, comptes transférés à l’institut",
      "Interface en swahili et en anglais",
    ];
    carte(s, MX, 1.85, 5.6, 4.7, "Limites");
    pastille(s, MX + 0.3, 2.1, 0.6, I.limite, ATTENTION);
    texte(s, "Limites", { x: MX + 1.1, y: 2.15, w: 4, h: 0.5, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
    texte(s, lim.map((v, k) => ({ text: v, options: { bullet: true, breakLine: k < lim.length - 1 } })), {
      x: MX + 0.3, y: 2.95, w: 5.0, h: 3.4, fontSize: 16, paraSpaceAfter: 10,
    });
    carte(s, 6.5, 1.85, 6.23, 4.7, "Perspectives", ENCRE);
    pastille(s, 6.8, 2.1, 0.6, I.fleche, BLEU);
    texte(s, "Perspectives", { x: 7.6, y: 2.15, w: 4, h: 0.5, fontSize: 20, bold: true, color: "FFFFFF", valign: "middle" });
    texte(s, per.map((v, k) => ({ text: `${k + 1}.  ${v}`, options: { breakLine: k < per.length - 1 } })), {
      x: 6.8, y: 2.95, w: 5.7, h: 3.4, fontSize: 16, color: "FFFFFF", paraSpaceAfter: 8,
    });
    s.addNotes("≈ 1 min. Énoncer les limites sans s’excuser : elles tracent directement les perspectives.");
  }

  /* ================= 19. Conclusion ================= */
  {
    const s = sombre("Conclusion");
    texte(s, "CONCLUSION", { x: MX, y: 0.8, w: 8, h: 0.35, fontSize: 13, bold: true, color: JAUNE, charSpacing: 2 });
    texte(s, "Une plateforme opérationnelle, conçue pour l’institut et administrable par son personnel", {
      x: MX, y: 1.25, w: 11.5, h: 1.6, fontFace: "Cambria", fontSize: 32, bold: true, color: "FFFFFF",
    });
    const apports = [
      ["Pour l’institut", "Information accessible à distance, documents vérifiables, démarches dématérialisées"],
      ["Sur le plan méthodologique", "Des contraintes concrètes traduites en exigences vérifiables"],
      ["Sur le plan technique", "Une règle de calcul écrite une fois et testée, au lieu de trois formules"],
    ];
    apports.forEach(([t, d], i) => {
      const x = MX + i * 4.12;
      texte(s, t, { x, y: 3.3, w: 3.85, h: 0.4, fontSize: 17, bold: true, color: JAUNE });
      texte(s, d, { x, y: 3.75, w: 3.85, h: 1.1, fontSize: 15, color: "E4E6F0" });
    });
    texte(s, "www.isptbukavu.org", { x: MX, y: 5.25, w: LARGEUR, h: 0.5, fontSize: 22, bold: true, color: "FFFFFF" });
    texte(s, "Merci pour votre attention", {
      x: MX, y: 5.95, w: LARGEUR, h: 0.7, fontFace: "Cambria", italic: true, fontSize: 28, color: JAUNE,
    });
    s.addNotes(
      "≈ 45 s. Conclure sur l’apport pour l’institut, remercier le directeur et le jury, puis : « Je suis à votre disposition pour vos questions. »",
    );
  }

  fs.mkdirSync(SORTIE, { recursive: true });
  await pres.writeFile({ fileName: FICHIER });
  // Thème PowerPoint (polices et couleurs du document) : appliqué si le module est disponible.
  try {
    const { applyTheme } = require(process.env.PPTX_THEME || path.join(__dirname, "appliquer-theme.cjs"));
    await applyTheme(FICHIER, THEME);
  } catch (e) {
    if (e.code !== "MODULE_NOT_FOUND") throw e;
    console.warn("Thème non appliqué (module de thème introuvable) : polices et couleurs restent celles des diapositives.");
  }
  console.log("Diaporama :", FICHIER);
})();
