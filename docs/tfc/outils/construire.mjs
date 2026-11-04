/**
 * Construction du mémoire (TFC) au format Word, à partir des fichiers
 * Markdown de docs/tfc/memoire et des métadonnées de la page de garde.
 *
 *   node docs/tfc/outils/construire.mjs [dossier-de-sortie]
 *
 * Mise en page conforme à docs/tfc/charte-de-redaction.md : A4, marges de
 * 3 cm à gauche et 2,5 cm ailleurs, Times New Roman 12 pt, interligne 1,5,
 * pages liminaires en chiffres romains, corps en chiffres arabes.
 *
 * Syntaxe reconnue dans les fichiers :
 *   # Titre de niveau 1 (chapitre, partie liminaire)  {.liminaire}
 *   ## Niveau 2   ### Niveau 3
 *   paragraphes, **gras**, *italique*, listes « - » et « 1. »
 *   ![Figure 3.1 : légende](chemin/image.png){largeur=12}   figure (largeur en cm, facultative)
 *   ::tableau Tableau 1.1 : légende   suivi d'un tableau Markdown « | a | b | »
 *   ::source texte             source sous une figure ou un tableau
 *   > citation longue
 *   ::a-rediger texte          repère visible d'une section à écrire
 *   ::saut                     saut de page
 *   ::liste-figures  ::liste-tableaux  ::table-des-matieres
 *   [@cle]  [@cle, p. 3]  [@a; @b]  [+@cle]   citations APA (../references.json)
 *   ::bibliographie            références citées, classées par catégorie
 *                              (TFC_BIBLIO=toutes : toute la base, pour relecture)
 */
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  StyleLevel,
  Table,
  TableCell,
  TableRow,
  TableOfContents,
  VerticalAlign,
  WidthType,
  ShadingType,
  TextRun,
  NumberFormat,
} = require("docx");

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(process.env.TFC_RACINE ?? path.join(ICI, ".."));
const SOURCES = path.join(RACINE, "memoire");
const SORTIE = path.resolve(process.argv[2] ?? path.join(RACINE, "sortie"));
const meta = JSON.parse(
  readFileSync(path.join(SOURCES, "metadonnees.json"), "utf8"),
);

/* ---------- Mesures (DXA : 1 cm = 567) ---------- */
const CM = 567;
const POLICE = "Times New Roman";
const PAGE = {
  size: { width: 11906, height: 16838 },
  margin: {
    top: 2.5 * CM,
    bottom: 2.5 * CM,
    left: 3 * CM,
    right: 2.5 * CM,
    footer: 1.2 * CM,
  },
};
const ENCRE = "1B2559";

/* ---------- Typographie française ---------- */
/** Apostrophe courbe, espaces insécables avant « : ; ? ! » et à l'intérieur des guillemets. */
let typoFrancaise = true; // désactivée pour les parties en anglais ({.anglais})
function typographie(texte) {
  if (!typoFrancaise) return texte.replace(/'/g, "\u2019");
  return texte
    .replace(/'/g, "\u2019")
    .replace(/ ([:;?!»])/g, "\u00A0$1")
    .replace(/« /g, "«\u00A0");
}

/* ---------- Références et citations (APA 7) ---------- */
const BASE = JSON.parse(
  readFileSync(path.join(RACINE, "references.json"), "utf8"),
);
const REFERENCES = new Map();
for (const ref of BASE.references) {
  if (REFERENCES.has(ref.cle))
    throw new Error(`Référence en double : ${ref.cle}`);
  if (!BASE.categories.some(([c]) => c === ref.categorie))
    throw new Error(`Catégorie inconnue pour ${ref.cle} : ${ref.categorie}`);
  REFERENCES.set(ref.cle, ref);
}
/** Clés citées, dans l'ordre de première apparition. */
const citees = new Set();

/**
 * Lettres a, b… des références d'un même auteur la même année (APA 7),
 * attribuées par ordre alphabétique des titres et seulement parmi les
 * références réellement citées : les sources sont lues une première fois.
 */
const MOTIF_CITATION = /\[(\+?)(@[^\]]+)\]/g;
const SUFFIXES = new Map();
{
  const prevues = new Set();
  if (process.env.TFC_BIBLIO === "toutes")
    for (const cle of REFERENCES.keys()) prevues.add(cle);
  for (const f of readdirSync(SOURCES).filter((f) => f.endsWith(".md")))
    for (const m of readFileSync(path.join(SOURCES, f), "utf8").matchAll(
      MOTIF_CITATION,
    ))
      for (const c of m[2].matchAll(/@([\w.:-]+)/g)) prevues.add(c[1]);
  const groupes = new Map();
  for (const cle of prevues) {
    const ref = REFERENCES.get(cle);
    if (!ref) continue; // signalé plus loin, à la conversion
    const auteurs = ref.reference.split(" (")[0];
    const groupe = `${auteurs}|${ref.annee}`;
    groupes.set(groupe, [...(groupes.get(groupe) ?? []), ref]);
  }
  for (const refs of groupes.values()) {
    if (refs.length < 2) continue;
    refs
      .sort((a, b) =>
        a.reference
          .split(") ")
          .slice(1)
          .join(") ")
          .localeCompare(b.reference.split(") ").slice(1).join(") "), "fr"),
      )
      .forEach((ref, n) => {
        const lettre = String.fromCharCode(97 + n);
        SUFFIXES.set(ref.cle, ref.annee === "s. d." ? `-${lettre}` : lettre);
      });
  }
}
/** Année affichée, avec sa lettre éventuelle (2023a, s. d.-b). */
const annee = (ref) => `${ref.annee}${SUFFIXES.get(ref.cle) ?? ""}`;

/**
 * Remplace les citations par leur forme auteur-date :
 *   [@cle]             → (Auteur, 2018)
 *   [@cle, p. 14]      → (Auteur, 2018, p. 14)
 *   [@a; @b]           → (A, 2018 ; B, 2020)
 *   [+@cle]            → Auteur (2018)       (forme narrative)
 * Une clé absente de references.json arrête la construction : aucune
 * source non vérifiée ne peut entrer dans le mémoire.
 */
function citations(texte) {
  return texte.replace(MOTIF_CITATION, (_, narratif, contenu) => {
    const parties = contenu.split(";").map((morceau) => {
      const m = /^\s*@([\w.:-]+)\s*(?:,\s*(.+?))?\s*$/.exec(morceau);
      if (!m) throw new Error(`Citation mal formée : [${contenu}]`);
      const ref = REFERENCES.get(m[1]);
      if (!ref) throw new Error(`Référence inconnue : @${m[1]}`);
      citees.add(ref.cle);
      return { ref, precision: m[2] };
    });
    if (narratif)
      return parties
        .map(
          ({ ref, precision }) =>
            `${ref.auteur} (${annee(ref)}${precision ? `, ${precision}` : ""})`,
        )
        .join(", ");
    // Même auteur cité à la suite : (Auteur, 2023, 2025), selon l'APA 7.
    const groupes = [];
    for (const { ref, precision } of parties) {
      const date = `${annee(ref)}${precision ? `, ${precision}` : ""}`;
      const dernier = groupes.at(-1);
      if (dernier && dernier.auteur === ref.auteur) dernier.dates.push(date);
      else groupes.push({ auteur: ref.auteur, dates: [date] });
    }
    return `(${groupes
      .map(({ auteur, dates }) => `${auteur}, ${dates.join(", ")}`)
      .join(" ; ")})`;
  });
}

/** Clé de tri APA : auteur puis année, « s. d. » avant les années. */
const cleDeTri = (ref) =>
  ref.reference
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(s\. d\./, "(0000")
    .replace(/[^a-z0-9 (]/gi, "")
    .toLowerCase();

/** Bibliographie : références citées (ou toutes avec TFC_BIBLIO=toutes). */
function bibliographie() {
  const toutes = process.env.TFC_BIBLIO === "toutes";
  const retenues = [...REFERENCES.values()].filter(
    (r) => toutes || citees.has(r.cle),
  );
  if (retenues.length === 0)
    return [
      new Paragraph({
        style: "Corps",
        children: [
          new TextRun({
            text: "[Aucune référence citée pour l’instant.]",
            italics: true,
            color: "8A8A8A",
          }),
        ],
      }),
    ];
  const sortie = [];
  for (const [categorie, intitule] of BASE.categories) {
    const liste = retenues
      .filter((r) => r.categorie === categorie)
      .sort((a, b) => cleDeTri(a).localeCompare(cleDeTri(b), "fr"));
    if (!liste.length) continue;
    sortie.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: typographie(intitule) })],
      }),
    );
    for (const ref of liste) {
      let texte = ref.reference.replace(
        `(${ref.annee}`,
        `(${annee(ref)}`,
      );
      if (ref.url)
        texte += ref.consulte
          ? ` Consulté le ${ref.consulte}, à l’adresse `
          : " ";
      const enfants = enLigne(texte);
      // Adresse cliquable dans le PDF et dans Word, sans changer son aspect à l’impression.
      if (ref.url)
        enfants.push(
          new ExternalHyperlink({
            link: ref.url,
            children: [new TextRun({ text: ref.url })],
          }),
        );
      sortie.push(new Paragraph({ style: "Reference", children: enfants }));
    }
  }
  return sortie;
}

/* ---------- Texte en ligne : **gras**, *italique* ---------- */
function enLigne(brut, base = {}) {
  const texte = typographie(citations(brut));
  const runs = [];
  const motif = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let dernier = 0;
  for (const m of texte.matchAll(motif)) {
    if (m.index > dernier)
      runs.push(new TextRun({ ...base, text: texte.slice(dernier, m.index) }));
    const brut = m[0];
    if (brut.startsWith("**"))
      runs.push(new TextRun({ ...base, text: brut.slice(2, -2), bold: true }));
    else
      runs.push(
        new TextRun({ ...base, text: brut.slice(1, -1), italics: true }),
      );
    dernier = m.index + brut.length;
  }
  if (dernier < texte.length)
    runs.push(new TextRun({ ...base, text: texte.slice(dernier) }));
  return runs;
}

/* ---------- Page de garde ---------- */
function pageDeGarde() {
  const centre = (texte, opts = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: opts.after ?? 0, line: 276 },
      children: [
        new TextRun({
          text: typographie(texte),
          font: POLICE,
          size: opts.size ?? 24,
          bold: opts.bold ?? false,
          italics: opts.italics ?? false,
          color: opts.color,
          allCaps: opts.caps ?? false,
        }),
      ],
    });
  const blason = readFileSync(path.join(RACINE, "ressources", "blason.png"));
  const hauteur = 4.2 * 37.8; // 4,2 cm en pixels à 96 ppp
  return [
    centre(meta.pays, { size: 24, bold: true, caps: true }),
    centre(meta.ministere, { size: 22, bold: true, caps: true, after: 120 }),
    centre(meta.institut, { size: 24, bold: true, caps: true, color: ENCRE }),
    centre(meta.sigle.toUpperCase(), { size: 24, bold: true, color: ENCRE }),
    centre(`${meta.boitePostale} · ${meta.email}`, { size: 20, after: 360 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new ImageRun({
          type: "png",
          data: blason,
          transformation: {
            width: Math.round((hauteur * 768) / 900),
            height: Math.round(hauteur),
          },
          altText: {
            title: "Blason",
            description: `Blason de l'${meta.sigle}`,
            name: "blason",
          },
        }),
      ],
    }),
    centre(`Section\u00A0: ${meta.section}`, { size: 22 }),
    centre(`Option\u00A0: ${meta.option}`, { size: 22, after: 480 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 300 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 12, color: ENCRE, space: 10 },
      },
      children: [
        new TextRun({
          text: typographie(meta.titre),
          font: POLICE,
          size: 30,
          bold: true,
          allCaps: true,
          color: ENCRE,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 600 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 12,
          color: ENCRE,
          space: 10,
        },
      },
      children: [
        new TextRun({
          text: typographie(meta.sousTitre),
          font: POLICE,
          size: 26,
          italics: true,
          color: ENCRE,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 6.2 * CM },
      spacing: { after: 480, line: 300 },
      children: [
        new TextRun({
          text: typographie(meta.nature),
          font: POLICE,
          size: 22,
          italics: true,
        }),
      ],
    }),
    ...[
      ["Présenté par\u00A0:", meta.auteur],
      ["Directeur\u00A0:", meta.directeur],
    ].flatMap(([libelle, nom], n) => [
      new Paragraph({
        indent: { left: 6.2 * CM },
        spacing: { before: n ? 240 : 0, after: 0, line: 300 },
        children: [new TextRun({ text: libelle, font: POLICE, size: 22 })],
      }),
      new Paragraph({
        indent: { left: 6.2 * CM },
        spacing: { after: 0, line: 300 },
        children: [
          new TextRun({ text: nom, font: POLICE, size: 24, bold: true }),
        ],
      }),
    ]),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1100 },
      children: [
        new TextRun({
          text: `Année académique ${meta.anneeAcademique}`,
          font: POLICE,
          size: 24,
          bold: true,
        }),
      ],
    }),
  ];
}

/* ---------- Conversion d'un fichier Markdown ---------- */
const compteurs = { figure: 0, listes: 0 };

function convertir(source, { premierePage }) {
  const sortie = [];
  const lignes = source.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  let premierTitre = true;
  // Classe {.decale} (épigraphe, dédicace) : texte reporté dans le bas de la
  // page et décalé vers la droite, sans justification.
  let decale = false;
  let premierBloc = true;
  const miseEnPageDecalee = () => {
    if (!decale) return {};
    const avant = premierBloc ? 5200 : 0;
    premierBloc = false;
    return {
      indent: { left: 6 * CM },
      alignment: AlignmentType.LEFT,
      spacing: { before: avant, after: 160 },
    };
  };
  const paragraphe = (texte) =>
    sortie.push(
      new Paragraph({ style: "Corps", ...miseEnPageDecalee(), children: enLigne(texte) }),
    );

  while (i < lignes.length) {
    const ligne = lignes[i];
    const brut = ligne.trim();
    if (!brut) {
      i++;
      continue;
    }
    const titre = /^(#{1,3})\s+(.*?)\s*(\{([^}]*)\})?$/.exec(brut);
    if (titre) {
      if (titre[1].length === 1) {
        typoFrancaise = !(titre[4] ?? "").includes(".anglais");
        decale = (titre[4] ?? "").includes(".decale");
        premierBloc = true;
      }
      const niveau = titre[1].length;
      const texte = titre[2];
      sortie.push(
        new Paragraph({
          heading: [
            HeadingLevel.HEADING_1,
            HeadingLevel.HEADING_2,
            HeadingLevel.HEADING_3,
          ][niveau - 1],
          pageBreakBefore: niveau === 1 && premierTitre && !premierePage,
          children: [new TextRun({ text: typographie(texte) })],
        }),
      );
      if (niveau === 1) premierTitre = false;
      i++;
      continue;
    }
    if (brut.startsWith("::")) {
      const [directive, ...reste] = brut.slice(2).split(" ");
      const texte = reste.join(" ");
      if (directive === "a-rediger")
        sortie.push(
          new Paragraph({
            style: "Corps",
            children: [
              new TextRun({
                text: `[À rédiger. ${texte}]`,
                italics: true,
                color: "8A8A8A",
              }),
            ],
          }),
        );
      else if (directive === "saut")
        sortie.push(new Paragraph({ children: [new PageBreak()] }));
      else if (directive === "table-des-matieres")
        sortie.push(
          new TableOfContents("Table des matières", {
            hyperlink: true,
            headingStyleRange: "1-3",
          }),
        );
      else if (directive === "bibliographie") sortie.push(...bibliographie());
      else if (directive === "liste-figures")
        sortie.push(
          new TableOfContents("Liste des figures", {
            stylesWithLevels: [new StyleLevel("Légende de figure", 1)],
            hyperlink: true,
          }),
        );
      else if (directive === "liste-tableaux")
        sortie.push(
          new TableOfContents("Liste des tableaux", {
            stylesWithLevels: [new StyleLevel("Légende de tableau", 1)],
            hyperlink: true,
          }),
        );
      else if (directive === "source")
        sortie.push(
          new Paragraph({ style: "Source", children: enLigne(`Source : ${texte}`) }),
        );
      else if (directive === "tableau") {
        i++;
        const lignesTableau = [];
        while (i < lignes.length && lignes[i].trim().startsWith("|"))
          lignesTableau.push(lignes[i++].trim());
        sortie.push(...tableau(texte, lignesTableau));
        continue;
      }
      i++;
      continue;
    }
    const figure =
      /^!\[(Figure\s+[\d.]+)\s*:\s*(.*)\]\((.+?)\)(?:\{largeur=([\d.]+)\})?$/.exec(
        brut,
      );
    if (figure) {
      const fichier = path.resolve(RACINE, figure[3]);
      if (!existsSync(fichier)) throw new Error(`Image introuvable : ${figure[3]}`);
      const donnees = readFileSync(fichier);
      const { largeur: lpx, hauteur: hpx } = dimensions(donnees);
      // Largeur demandée (cm), bornée à la zone de texte et à 19 cm de haut.
      let largeur = (Number(figure[4] ?? 15) * 37.8);
      let hauteur = (largeur * hpx) / lpx;
      if (hauteur > 19 * 37.8) {
        hauteur = 19 * 37.8;
        largeur = (hauteur * lpx) / hpx;
      }
      sortie.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 120, after: 60, line: 240 },
          children: [
            new ImageRun({
              type: /\.jpe?g$/i.test(fichier) ? "jpg" : "png",
              data: donnees,
              transformation: {
                width: Math.round(largeur),
                height: Math.round(hauteur),
              },
              altText: {
                title: figure[1],
                description: figure[2],
                name: figure[1],
              },
            }),
          ],
        }),
      );
      compteurs.figure++;
      sortie.push(
        new Paragraph({
          style: "LegendeFigure",
          keepNext: /^::source/.test(lignes[i + 1]?.trim() ?? "")
            || /^::source/.test(lignes[i + 2]?.trim() ?? ""),
          children: enLigne(`${figure[1]} : ${figure[2]}`),
        }),
      );
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(brut)) {
      while (i < lignes.length && /^[-*]\s+/.test(lignes[i].trim())) {
        sortie.push(
          new Paragraph({
            style: "Corps",
            numbering: { reference: "puces", level: 0 },
            children: enLigne(lignes[i].trim().replace(/^[-*]\s+/, "")),
          }),
        );
        i++;
      }
      continue;
    }
    if (/^\d+\.\s+/.test(brut)) {
      const instance = ++compteurs.listes; // chaque liste repart à 1
      while (i < lignes.length && /^\d+\.\s+/.test(lignes[i].trim())) {
        sortie.push(
          new Paragraph({
            style: "Corps",
            numbering: { reference: "numeros", level: 0, instance },
            children: enLigne(lignes[i].trim().replace(/^\d+\.\s+/, "")),
          }),
        );
        i++;
      }
      continue;
    }
    if (brut.startsWith(">")) {
      const bloc = [];
      while (i < lignes.length && lignes[i].trim().startsWith(">"))
        bloc.push(lignes[i++].trim().replace(/^>\s?/, ""));
      sortie.push(
        new Paragraph({
          style: "Citation",
          ...miseEnPageDecalee(),
          children: enLigne(bloc.join(" ")),
        }),
      );
      continue;
    }
    // Paragraphe : lignes consécutives réunies.
    const bloc = [];
    while (
      i < lignes.length &&
      lignes[i].trim() &&
      !/^(#|::|!\[|[-*]\s|\d+\.\s|>)/.test(lignes[i].trim())
    )
      bloc.push(lignes[i++].trim());
    paragraphe(bloc.join(" "));
  }
  return sortie;
}

/* ---------- Images et tableaux ---------- */
/** Dimensions en pixels d'une image PNG ou JPEG. */
function dimensions(donnees) {
  if (donnees.readUInt32BE(0) === 0x89504e47)
    return { largeur: donnees.readUInt32BE(16), hauteur: donnees.readUInt32BE(20) };
  let p = 2;
  while (p < donnees.length) {
    const marqueur = donnees.readUInt16BE(p);
    const taille = donnees.readUInt16BE(p + 2);
    if (marqueur >= 0xffc0 && marqueur <= 0xffc3)
      return {
        hauteur: donnees.readUInt16BE(p + 5),
        largeur: donnees.readUInt16BE(p + 7),
      };
    p += 2 + taille;
  }
  throw new Error("Format d'image non reconnu");
}

const LARGEUR_TEXTE = 11906 - 3 * CM - 2.5 * CM; // en DXA
const filet = { style: BorderStyle.SINGLE, size: 4, color: "7F7F7F" };

/**
 * Tableau Markdown (« | a | b | », ligne « |---| » après l'en-tête),
 * précédé de sa légende « Tableau 1.1 : … », reprise dans la liste des tableaux.
 */
function tableau(legende, lignesTableau) {
  const cellules = (l) =>
    l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const [entete, , ...corps] = lignesTableau.map(cellules);
  if (!entete || !lignesTableau[1]?.includes("-"))
    throw new Error(`Tableau mal formé : ${legende}`);
  const n = entete.length;
  // Largeurs proportionnelles au contenu, avec un minimum par colonne.
  // Largeur minimale : le plus long mot tient sur une ligne (≈ 105 DXA par
  // caractère en 10 pt, plus les marges) ; le reste de la largeur est réparti
  // selon la longueur des textes.
  const textes = (k) => [entete, ...corps].map((r) => r[k] ?? "");
  const minimum = entete.map((_, k) =>
    Math.max(...textes(k).flatMap((t) => t.split(/\s+/).map((m) => m.length))) * 105 + 220,
  );
  const poids = entete.map((_, k) =>
    Math.max(...textes(k).map((t) => Math.min(60, t.length))),
  );
  const reste = Math.max(0, LARGEUR_TEXTE - minimum.reduce((a, b) => a + b, 0));
  const total = poids.reduce((a, b) => a + b, 0);
  const largeurs = minimum.map((m, k) => Math.floor(m + (reste * poids[k]) / total));
  const cellule = (texte, k, enTete) =>
    new TableCell({
      width: { size: largeurs[k], type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 35, bottom: 35, left: 90, right: 90 },
      shading: enTete
        ? { type: ShadingType.CLEAR, color: "auto", fill: "E8EAF2" }
        : undefined,
      children: [
        new Paragraph({
          style: "Cellule",
          children: enLigne(texte ?? "", enTete ? { bold: true } : {}),
        }),
      ],
    });
  return [
    // Tableau sans légende (liste des sigles, par exemple) : rien dans la liste des tableaux.
    ...(legende.trim()
      ? [new Paragraph({ style: "LegendeTableau", children: enLigne(legende) })]
      : []),
    new Table({
      width: { size: LARGEUR_TEXTE, type: WidthType.DXA },
      columnWidths: largeurs,
      borders: {
        top: filet,
        bottom: filet,
        left: filet,
        right: filet,
        insideHorizontal: filet,
        insideVertical: filet,
      },
      rows: [
        new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: entete.map((t, k) => cellule(t, k, true)),
        }),
        ...corps.map(
          (r) =>
            new TableRow({
              cantSplit: true,
              children: Array.from({ length: n }, (_, k) => cellule(r[k], k, false)),
            }),
        ),
      ],
    }),
    new Paragraph({ spacing: { before: 0, after: 120, line: 240 }, children: [] }),
  ];
}

/* ---------- Assemblage ---------- */
const fichiers = readdirSync(SOURCES)
  .filter((f) => f.endsWith(".md"))
  .sort();
const liminaires = fichiers.filter((f) => f.startsWith("0"));
const corps = fichiers.filter((f) => !f.startsWith("0"));
const lire = (f) => readFileSync(path.join(SOURCES, f), "utf8");

const piedDePage = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ children: [PageNumber.CURRENT], font: POLICE, size: 20 }),
      ],
    }),
  ],
});

const titre = (taille, extra = {}) => ({
  run: {
    font: POLICE,
    size: taille,
    bold: true,
    color: "000000",
    ...extra.run,
  },
  paragraph: { keepNext: true, keepLines: true, ...extra.paragraph },
});

const doc = new Document({
  creator: meta.auteur,
  lastModifiedBy: meta.auteur,
  title: `${meta.titre} : ${meta.sousTitre}`,
  description: meta.nature,
  features: { updateFields: true },
  styles: {
    default: {
      document: {
        run: { font: POLICE, size: 24 },
        paragraph: { spacing: { line: 360 } },
      },
      heading1: titre(28, {
        run: { allCaps: true },
        paragraph: {
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
          outlineLevel: 0,
        },
      }),
      heading2: titre(26, {
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 },
      }),
      heading3: titre(24, {
        run: { italics: true },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      }),
    },
    paragraphStyles: [
      {
        id: "Corps",
        name: "Corps de texte",
        basedOn: "Normal",
        quickFormat: true,
        run: { font: POLICE, size: 24 },
        paragraph: {
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, before: 0, after: 120 },
        },
      },
      {
        id: "LegendeFigure",
        name: "Légende de figure",
        basedOn: "Normal",
        run: { font: POLICE, size: 20, italics: true },
        paragraph: {
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, before: 60, after: 240 },
        },
      },
      {
        id: "LegendeTableau",
        name: "Légende de tableau",
        basedOn: "Normal",
        run: { font: POLICE, size: 20, italics: true },
        paragraph: {
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { line: 240, before: 200, after: 80 },
        },
      },
      {
        id: "Cellule",
        name: "Texte de tableau",
        basedOn: "Normal",
        run: { font: POLICE, size: 20 },
        paragraph: { spacing: { line: 240, before: 0, after: 0 } },
      },
      {
        id: "Source",
        name: "Source",
        basedOn: "Normal",
        run: { font: POLICE, size: 18, italics: true },
        paragraph: {
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, before: 0, after: 240 },
        },
      },
      {
        id: "Reference",
        name: "Référence bibliographique",
        basedOn: "Normal",
        run: { font: POLICE, size: 24 },
        paragraph: {
          alignment: AlignmentType.LEFT,
          indent: { left: 1.27 * CM, hanging: 1.27 * CM },
          spacing: { line: 240, before: 0, after: 160 },
        },
      },
      {
        id: "Citation",
        name: "Citation longue",
        basedOn: "Normal",
        run: { font: POLICE, size: 22, italics: true },
        paragraph: {
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 1.5 * CM, right: 1 * CM },
          spacing: { line: 240, before: 120, after: 240 },
        },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "puces",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "–",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numeros",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          ...PAGE,
          borders: {
            pageBorderTop: {
              style: BorderStyle.DOUBLE,
              size: 6,
              color: ENCRE,
              space: 24,
            },
            pageBorderBottom: {
              style: BorderStyle.DOUBLE,
              size: 6,
              color: ENCRE,
              space: 24,
            },
            pageBorderLeft: {
              style: BorderStyle.DOUBLE,
              size: 6,
              color: ENCRE,
              space: 24,
            },
            pageBorderRight: {
              style: BorderStyle.DOUBLE,
              size: 6,
              color: ENCRE,
              space: 24,
            },
          },
        },
      },
      children: pageDeGarde(),
    },
    {
      properties: {
        page: {
          ...PAGE,
          pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
        },
      },
      footers: { default: piedDePage },
      children: liminaires.flatMap((f, n) =>
        convertir(lire(f), { premierePage: n === 0 }),
      ),
    },
    {
      properties: {
        page: {
          ...PAGE,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      footers: { default: piedDePage },
      children: corps.flatMap((f, n) =>
        convertir(lire(f), { premierePage: n === 0 }),
      ),
    },
  ],
});

mkdirSync(SORTIE, { recursive: true });
const nom = path.join(SORTIE, "TFC-Aksanti-Cirhuza-Oscar.docx");
writeFileSync(nom, await Packer.toBuffer(doc));
console.log(`Mémoire construit : ${nom}`);
