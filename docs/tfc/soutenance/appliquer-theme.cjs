/**
 * Applique la palette et les polices de la charte au thème d'un fichier
 * PowerPoint produit par pptxgenjs (ppt/theme/theme1.xml). Les couleurs de
 * schéma (tx2, accent1…) utilisées par les diapositives prennent ainsi les
 * couleurs de l'institut.
 *
 * Dépendance : jszip (installée avec pptxgenjs).
 */
const fs = require("node:fs");
const JSZip = require("jszip");

const ROLES = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];

async function applyTheme(fichier, theme) {
  const zip = await JSZip.loadAsync(fs.readFileSync(fichier));
  const chemins = Object.keys(zip.files).filter((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  for (const chemin of chemins) {
    let xml = await zip.file(chemin).async("string");
    for (const role of ROLES) {
      const couleur = theme.colors[role];
      if (!couleur) continue;
      const re = new RegExp(`<a:${role}>[\\s\\S]*?</a:${role}>`);
      xml = xml.replace(re, `<a:${role}><a:srgbClr val="${couleur}"/></a:${role}>`);
    }
    if (theme.name) xml = xml.replace(/(<a:clrScheme name=")[^"]*(")/, `$1${theme.name}$2`);
    const police = (bloc, nom) =>
      (xml = xml.replace(new RegExp(`(<a:${bloc}>\\s*<a:latin typeface=")[^"]*(")`), `$1${nom}$2`));
    if (theme.headFontFace) police("majorFont", theme.headFontFace);
    if (theme.bodyFontFace) police("minorFont", theme.bodyFontFace);
    zip.file(chemin, xml);
  }
  fs.writeFileSync(fichier, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = { applyTheme };
