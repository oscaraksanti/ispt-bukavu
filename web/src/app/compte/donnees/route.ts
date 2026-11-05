import { utilisateurConnecte } from "@/features/auth/acces";
import { donneesPersonnelles } from "@/features/exports/donnees-personnelles";
import { journaliser } from "@/lib/journal";

/** Droit d'accès : le titulaire télécharge toutes ses données (JSON lisible). */
export async function GET() {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const donnees = await donneesPersonnelles(u.id);
  if (!donnees) return new Response("Compte introuvable", { status: 404 });
  await journaliser({
    auteurId: u.id,
    action: "donnees_personnelles_exportees",
    entite: "Utilisateur",
    entiteId: u.id,
  });
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees-ispt-bukavu-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
