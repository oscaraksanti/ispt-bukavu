/** Préparation des données personnelles à l'export (fonction pure, testée). */

/** Champs jamais exportés : secrets d'authentification et chemins internes de stockage. */
const SECRETS = new Set(["motDePasseHash", "jetonHash", "cle"]);

/** Copie sérialisable : dates ISO, décimaux en nombres, secrets retirés. */
export function nettoyer(valeur: unknown): unknown {
  if (valeur === null || valeur === undefined) return null;
  if (valeur instanceof Date) return valeur.toISOString();
  if (Array.isArray(valeur)) return valeur.map(nettoyer);
  if (typeof valeur === "object") {
    // Décimaux Prisma (Decimal.js) : convertis en nombres.
    if ("toNumber" in valeur && typeof (valeur as { toNumber: unknown }).toNumber === "function")
      return (valeur as { toNumber: () => number }).toNumber();
    return Object.fromEntries(
      Object.entries(valeur)
        .filter(([k]) => !SECRETS.has(k))
        .map(([k, v]) => [k, nettoyer(v)]),
    );
  }
  return valeur;
}
