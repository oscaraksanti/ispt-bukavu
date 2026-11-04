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
 *   ![Figure 3.1 : légende](chemin/image.png)   figure numérotée et listée
 *   > citation longue
 *   ::a-rediger texte          repère visible d'une section à écrire
 *   ::saut                     saut de page
 *   ::liste-figures  ::liste-tableaux  ::table-des-matieres
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
  Footer,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  SimpleField,
  TableOfContents,
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
function typographie(texte) {
  return texte
    .replace(/'/g, "\u2019")
    .replace(/ ([:;?!»])/g, "\u00A0$1")
    .replace(/« /g, "«\u00A0");
}

/* ---------- Texte en ligne : **gras**, *italique* ---------- */
function enLigne(brut, base = {}) {
  const texte = typographie(brut);
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
const compteurs = { figure: 0 };

function convertir(source, { premierePage }) {
  const sortie = [];
  const lignes = source.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  let premierTitre = true;
  const paragraphe = (texte) =>
    sortie.push(new Paragraph({ style: "Corps", children: enLigne(texte) }));

  while (i < lignes.length) {
    const ligne = lignes[i];
    const brut = ligne.trim();
    if (!brut) {
      i++;
      continue;
    }
    const titre = /^(#{1,3})\s+(.*?)\s*(\{([^}]*)\})?$/.exec(brut);
    if (titre) {
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
      else if (directive === "liste-figures")
        sortie.push(
          new TableOfContents("Liste des figures", {
            captionLabelIncludingNumbers: "Figure",
            hyperlink: true,
          }),
        );
      else if (directive === "liste-tableaux")
        sortie.push(
          new TableOfContents("Liste des tableaux", {
            captionLabelIncludingNumbers: "Tableau",
            hyperlink: true,
          }),
        );
      i++;
      continue;
    }
    const figure = /^!\[(Figure\s+[\d.]+)\s*:\s*(.*)\]\((.+)\)$/.exec(brut);
    if (figure) {
      const fichier = path.resolve(RACINE, figure[3]);
      if (existsSync(fichier)) {
        const donnees = readFileSync(fichier);
        const largeur = 15 * 37.8;
        sortie.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            keepNext: true,
            spacing: { before: 120, after: 60 },
            children: [
              new ImageRun({
                type: fichier.endsWith(".jpg") ? "jpg" : "png",
                data: donnees,
                transformation: { width: largeur, height: largeur * 0.6 },
                altText: {
                  title: figure[1],
                  description: figure[2],
                  name: figure[1],
                },
              }),
            ],
          }),
        );
      }
      compteurs.figure++;
      sortie.push(
        new Paragraph({
          style: "Legende",
          children: [
            new TextRun({ text: "Figure " }),
            new SimpleField("SEQ Figure \\* ARABIC", String(compteurs.figure)),
            new TextRun({ text: typographie(` : ${figure[2]}`) }),
          ],
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
      while (i < lignes.length && /^\d+\.\s+/.test(lignes[i].trim())) {
        sortie.push(
          new Paragraph({
            style: "Corps",
            numbering: { reference: "numeros", level: 0 },
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
        new Paragraph({ style: "Citation", children: enLigne(bloc.join(" ")) }),
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
        id: "Legende",
        name: "Caption",
        basedOn: "Normal",
        run: { font: POLICE, size: 20, italics: true },
        paragraph: {
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, before: 60, after: 240 },
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
