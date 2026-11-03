import { createHash, randomBytes } from "node:crypto";

/** Jeton aléatoire non devinable, encodé pour une URL (256 bits par défaut). */
export function jetonAleatoire(octets = 32) {
  return randomBytes(octets).toString("base64url");
}

/** Empreinte SHA-256 : seule l'empreinte d'un jeton est conservée en base. */
export function empreinte(valeur: string) {
  return createHash("sha256").update(valeur).digest("hex");
}

/** Code lisible pour les documents (sans caractères ambigus : 0/O, 1/I/L). */
export function codeVerification(longueur = 12) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const octets = randomBytes(longueur);
  let code = "";
  for (let i = 0; i < longueur; i++) code += alphabet[octets[i] % alphabet.length];
  return code.replace(/(.{4})(?=.)/g, "$1-");
}
