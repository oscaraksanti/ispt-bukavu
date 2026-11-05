import { utilisateurConnecte } from "@/features/auth/acces";
import { estTypeExport, EXPORTS, feuilleExport } from "@/features/exports/requetes";
import { versCsv, versXlsx } from "@/features/exports/tableur";
import { db } from "@/lib/db";
import { journaliser } from "@/lib/journal";

/**
 * Téléchargement d'un export normalisé (CSV ou Excel), pour une année
 * académique. Chaque extraction est tracée dans le journal d'activité.
 */
export async function GET(requete: Request, { params }: RouteContext<"/admin/exports/[type]">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  const { type } = await params;
  if (!estTypeExport(type)) return new Response("Export inconnu", { status: 404 });
  if (!u.permissions.has(EXPORTS[type].permission))
    return new Response("Accès refusé", { status: 403 });

  const recherche = new URL(requete.url).searchParams;
  const format = recherche.get("format") === "csv" ? "csv" : "xlsx";
  const anneeId = recherche.get("annee");
  const annee = anneeId
    ? await db.anneeAcademique.findUnique({ where: { id: anneeId } })
    : await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) return new Response("Année académique introuvable", { status: 404 });

  const feuille = await feuilleExport(type, annee.id);
  await journaliser({
    auteurId: u.id,
    action: "export_donnees",
    entite: "AnneeAcademique",
    entiteId: annee.id,
    apres: { export: EXPORTS[type].titre, format, lignes: feuille.lignes.length },
  });
  const nom = `${type}-${annee.libelle}`.replace(/[^\w-]+/g, "-");
  const entetes = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (format === "csv")
    return new Response(versCsv(feuille), {
      headers: {
        ...entetes,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nom}.csv"`,
      },
    });
  return new Response(new Uint8Array(versXlsx([feuille])), {
    headers: {
      ...entetes,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nom}.xlsx"`,
    },
  });
}
