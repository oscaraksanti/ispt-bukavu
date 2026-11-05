import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { nettoyer } from "@/features/exports/nettoyer";
import {
  celluleCsv,
  colonne,
  crc32,
  nomOnglet,
  versCsv,
  versXlsx,
} from "@/features/exports/tableur";

/** Lit les fichiers d'une archive ZIP via son répertoire central. */
function lireZip(z: Buffer) {
  const fin = z.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const nombre = z.readUInt16LE(fin + 10);
  let p = z.readUInt32LE(fin + 16);
  const fichiers = new Map<string, string>();
  for (let i = 0; i < nombre; i++) {
    const taille = z.readUInt32LE(p + 20);
    const nomLong = z.readUInt16LE(p + 28);
    const debut = z.readUInt32LE(p + 42);
    const nom = z.subarray(p + 46, p + 46 + nomLong).toString("utf8");
    const donnees = z.subarray(debut + 30 + nomLong, debut + 30 + nomLong + taille);
    const contenu = inflateRawSync(donnees);
    expect(crc32(contenu)).toBe(z.readUInt32LE(p + 16));
    fichiers.set(nom, contenu.toString("utf8"));
    p += 46 + nomLong;
  }
  return fichiers;
}

const feuille = {
  nom: "Inscriptions",
  entetes: ["Matricule", "Nom", "Moyenne", "Inscrit le"],
  lignes: [
    ["GI26001", "BAHATI <Grâce> & co", 13.5, new Date("2026-10-05T08:00:00Z")],
    ['=HYPERLINK("x")', null, null, undefined],
  ],
};

describe("CSV", () => {
  it("prépare un fichier lisible par Excel en français", () => {
    const csv = versCsv(feuille);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"GI26001";"BAHATI <Grâce> & co";13,5;"2026-10-05"');
  });

  it("neutralise les formules et échappe les guillemets", () => {
    expect(celluleCsv('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(celluleCsv("-12")).toBe('"\'-12"');
    expect(celluleCsv(-12)).toBe("-12");
  });
});

describe("Excel (.xlsx)", () => {
  it("produit une archive valide avec en-tête figé et filtres", () => {
    const f = lireZip(versXlsx([feuille]));
    expect([...f.keys()]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    const feuilleXml = f.get("xl/worksheets/sheet1.xml")!;
    expect(feuilleXml).toContain('state="frozen"');
    expect(feuilleXml).toContain('<autoFilter ref="A1:D3"/>');
    expect(feuilleXml).toContain("BAHATI &lt;Grâce&gt; &amp; co");
    expect(feuilleXml).toContain('<c r="C2"><v>13.5</v></c>');
    // Une formule reste un simple texte dans un classeur : jamais évaluée.
    expect(feuilleXml).toContain("=HYPERLINK(&quot;x&quot;)");
    expect(feuilleXml).not.toContain("<f>");
    expect(f.get("xl/workbook.xml")).toContain('name="Inscriptions"');
  });

  it("nomme colonnes et onglets selon les règles d'Excel", () => {
    expect([colonne(0), colonne(25), colonne(26), colonne(701)]).toEqual(["A", "Z", "AA", "ZZ"]);
    expect(nomOnglet("Notes : 2026/2027 [BAC1] trop long pour un onglet")).toHaveLength(31);
    expect(nomOnglet("a/b")).toBe("a-b");
  });
});

describe("données personnelles", () => {
  it("retire les secrets et rend les dates lisibles", () => {
    const r = nettoyer({
      email: "a@b.cd",
      motDePasseHash: "$argon2id$…",
      sessions: [{ jetonHash: "x", creeLe: new Date("2026-11-05T10:00:00Z") }],
      media: { cle: "prive/valve/x.pdf", nomFichier: "x.pdf" },
    });
    expect(r).toEqual({
      email: "a@b.cd",
      sessions: [{ creeLe: "2026-11-05T10:00:00.000Z" }],
      media: { nomFichier: "x.pdf" },
    });
  });
});
