import { createHash, randomBytes } from "node:crypto";

/** Jeton aléatoire non devinable, encodé pour une URL (256 bits par défaut). */
export function jetonAleatoire(octets = 32) {
  return randomBytes(octets).toString("base64url");
}

/** Empreinte SHA-256 : seule l'empreinte d'un jeton est conservée en base. */
export function empreinte(valeur: string) {
  return createHash("sha256").update(valeur).digest("hex");
}

const ALPHABET_LISIBLE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Code aléatoire lisible, sans caractères ambigus (0/O, 1/I/L). */
export function codeLisible(longueur = 12) {
  // Tirage par rejet : chaque caractère est équiprobable.
  const limite = 256 - (256 % ALPHABET_LISIBLE.length);
  let code = "";
  while (code.length < longueur) {
    for (const octet of randomBytes(longueur * 2)) {
      if (octet < limite && code.length < longueur)
        code += ALPHABET_LISIBLE[octet % ALPHABET_LISIBLE.length];
    }
  }
  return code;
}

/** Code lisible pour les documents, groupé par quatre caractères. */
export function codeVerification(longueur = 12) {
  return codeLisible(longueur).replace(/(.{4})(?=.)/g, "$1-");
}
