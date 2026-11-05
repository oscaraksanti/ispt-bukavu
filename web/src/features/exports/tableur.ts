import { deflateRawSync } from "node:zlib";

/**
 * Tableaux exportables (fonctions pures, testées) : CSV prêt pour Excel en
 * français, et classeur Excel (.xlsx) écrit sans dépendance (OOXML minimal :
 * en-tête en gras figé, filtres, largeurs de colonnes ajustées).
 */

export type Valeur = string | number | boolean | Date | null | undefined;

export type Feuille = {
  nom: string;
  entetes: string[];
  lignes: Valeur[][];
};

const date = (d: Date) => d.toISOString().slice(0, 10);

/* CSV ------------------------------------------------------------------------ */

/** Cellule CSV : guillemets échappés, formules neutralisées (=, +, -, @). */
export function celluleCsv(v: Valeur) {
  if (typeof v === "number") return Number.isFinite(v) ? String(v).replace(".", ",") : "";
  if (typeof v === "boolean") return v ? "oui" : "non";
  const t = v instanceof Date ? date(v) : v === null || v === undefined ? "" : String(v);
  const sur = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
  return `"${sur.replace(/"/g, '""')}"`;
}

/** CSV séparé par « ; », avec BOM UTF-8 : s'ouvre directement dans Excel en français. */
export function versCsv(f: Feuille) {
  const lignes = [f.entetes, ...f.lignes].map((l) => l.map(celluleCsv).join(";"));
  return `﻿${lignes.join("\r\n")}\r\n`;
}

/* XLSX ----------------------------------------------------------------------- */

/** Caractères interdits en XML retirés, puis échappement. */
function xml(t: string) {
  return t
    .replace(/[^\t\n\r -퟿-�]/gu, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Lettre de colonne Excel : 0 → A, 25 → Z, 26 → AA. */
export function colonne(i: number) {
  let n = i + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Nom d'onglet valide : 31 caractères au plus, sans : \ / ? * [ ]. */
export function nomOnglet(nom: string) {
  return nom.replace(/[:\\/?*[\]]/g, "-").slice(0, 31) || "Feuille";
}

function texteCellule(v: Valeur) {
  if (v instanceof Date) return date(v);
  if (typeof v === "boolean") return v ? "oui" : "non";
  return v === null || v === undefined ? "" : String(v);
}

function feuilleXml(f: Feuille) {
  const largeurs = f.entetes.map((e, i) =>
    Math.min(60, Math.max(8, e.length + 2, ...f.lignes.map((l) => texteCellule(l[i]).length + 2))),
  );
  const rangee = (valeurs: Valeur[], r: number, entete: boolean) =>
    `<row r="${r}">${valeurs
      .map((v, i) => {
        const ref = `${colonne(i)}${r}`;
        const style = entete ? ' s="1"' : "";
        if (typeof v === "number" && Number.isFinite(v))
          return `<c r="${ref}"${style}><v>${v}</v></c>`;
        const t = texteCellule(v);
        if (!t) return `<c r="${ref}"${style}/>`;
        return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xml(t)}</t></is></c>`;
      })
      .join("")}</row>`;
  const derniere = `${colonne(Math.max(0, f.entetes.length - 1))}${f.lignes.length + 1}`;
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    `<cols>${largeurs.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` +
    `<sheetData>${[rangee(f.entetes, 1, true), ...f.lignes.map((l, i) => rangee(l, i + 2, false))].join("")}</sheetData>` +
    (f.entetes.length ? `<autoFilter ref="A1:${derniere}"/>` : "") +
    "</worksheet>"
  );
}

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF141B4A"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  "</styleSheet>";

/** Classeur Excel (.xlsx) : un onglet par feuille. */
export function versXlsx(feuilles: Feuille[]): Buffer {
  const noms = feuilles.map((f, i) => {
    const base = nomOnglet(f.nom);
    return feuilles.slice(0, i).some((g) => nomOnglet(g.nom) === base)
      ? `${base.slice(0, 28)} ${i + 1}`
      : base;
  });
  const fichiers: [string, string][] = [
    [
      "[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        feuilles
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join("") +
        "</Types>",
    ],
    [
      "_rels/.rels",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        "</Relationships>",
    ],
    [
      "xl/workbook.xml",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets>${noms.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
        `<definedNames>${feuilles
          .map((f, i) =>
            f.entetes.length
              ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xml(noms[i].replace(/'/g, "''"))}'!$A$1:$${colonne(f.entetes.length - 1)}$${f.lignes.length + 1}</definedName>`
              : "",
          )
          .join("")}</definedNames>` +
        "</workbook>",
    ],
    [
      "xl/_rels/workbook.xml.rels",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        feuilles
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join("") +
        `<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        "</Relationships>",
    ],
    ["xl/styles.xml", STYLES],
    ...feuilles.map((f, i): [string, string] => [`xl/worksheets/sheet${i + 1}.xml`, feuilleXml(f)]),
  ];
  return zip(fichiers.map(([nom, contenu]) => [nom, Buffer.from(contenu, "utf8")]));
}

/* ZIP (méthode « deflate », sans dépendance) ----------------------------------- */

const TABLE_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(donnees: Buffer) {
  let c = 0xffffffff;
  for (const octet of donnees) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Archive ZIP minimale (noms en UTF-8, date fixe : le fichier est reproductible). */
export function zip(fichiers: [string, Buffer][]) {
  const locaux: Buffer[] = [];
  const centraux: Buffer[] = [];
  let position = 0;
  const heure = 0; // 00:00:00
  const jour = ((2026 - 1980) << 9) | (1 << 5) | 1; // 1er janvier 2026
  for (const [nom, donnees] of fichiers) {
    const n = Buffer.from(nom, "utf8");
    const compresse = deflateRawSync(donnees);
    const crc = crc32(donnees);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(heure, 10);
    local.writeUInt16LE(jour, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compresse.length, 18);
    local.writeUInt32LE(donnees.length, 22);
    local.writeUInt16LE(n.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(heure, 12);
    central.writeUInt16LE(jour, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compresse.length, 20);
    central.writeUInt32LE(donnees.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(position, 42);
    locaux.push(local, n, compresse);
    centraux.push(central, n);
    position += local.length + n.length + compresse.length;
  }
  const repertoire = Buffer.concat(centraux);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(fichiers.length, 8);
  fin.writeUInt16LE(fichiers.length, 10);
  fin.writeUInt32LE(repertoire.length, 12);
  fin.writeUInt32LE(position, 16);
  return Buffer.concat([...locaux, repertoire, fin]);
}
