import "server-only";
import QRCode from "qrcode";

/** QR code en SVG (aucune requête externe), pour l'adresse de vérification. */
export async function qrSvg(texte: string) {
  return QRCode.toString(texte, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#141b4a", light: "#ffffff" },
  });
}
