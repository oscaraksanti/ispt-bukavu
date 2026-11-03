/**
 * Chaîne de connexion PostgreSQL utilisée par le pilote `pg`.
 *
 * - Supabase fournit `sslmode=require` : avec `pg`, ce mode exige désormais la
 *   vérification complète du certificat, que la chaîne de Supabase ne permet
 *   pas sans fournir son autorité. On adopte la sémantique de libpq
 *   (chiffrement obligatoire, comme dans les outils PostgreSQL usuels).
 * - Sans base configurée (aperçus, build sans base), une adresse injoignable
 *   est utilisée : les requêtes échouent proprement et le site affiche ses
 *   contenus de référence au lieu de planter au démarrage.
 */
export const BASE_ABSENTE = "postgresql://aucune-base@127.0.0.1:1/aucune";

export function adapterChaine(url: string | undefined) {
  if (!url) return BASE_ABSENTE;
  if (/[?&]sslmode=require\b/.test(url) && !/[?&]uselibpqcompat=/.test(url))
    return `${url}&uselibpqcompat=true`;
  return url;
}
