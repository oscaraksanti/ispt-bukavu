import { utilisateurConnecte } from "@/features/auth/acces";
import { INCLURE_DELIBERATION, titreDeliberation } from "@/features/deliberations/donnees";
import { decisionFinale, type LigneCours } from "@/features/deliberations/regles";
import { db } from "@/lib/db";

/** Neutralise les formules dans un tableur (=, +, -, @) et échappe les guillemets. */
const cellule = (v: unknown) => {
  const t = v === null || v === undefined ? "" : String(v);
  const sur = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
  return `"${sur.replace(/"/g, '""')}"`;
};
const nombre = (v: unknown) =>
  v === null || v === undefined ? "" : String(Number(v)).replace(".", ",");

/** Export des résultats (séparateur « ; », virgule décimale) : ouvre directement dans Excel en français. */
export async function GET(_r: Request, { params }: RouteContext<"/deliberations/[id]/export">) {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });
  if (!u.permissions.has("academique.notes.valider"))
    return new Response("Accès refusé", { status: 403 });
  const { id } = await params;
  const d = await db.deliberation.findUnique({
    where: { id },
    include: {
      ...INCLURE_DELIBERATION,
      resultats: { include: { etudiant: { include: { utilisateur: true } } } },
    },
  });
  if (!d) return new Response("Introuvable", { status: 404 });
  const cours = ((d.resultats[0]?.details as LigneCours[]) ?? []).map((c) => c.intitule);
  const entete = [
    "Matricule",
    "Nom",
    ...cours,
    "Moyenne",
    "Total",
    "Crédits validés",
    "Crédits total",
    "Mention",
    "Rang",
    "Décision proposée",
    "Décision du jury",
    "Motif",
    "Décision finale",
  ];
  const lignes = d.resultats
    .map((r) => {
      const nom = [
        r.etudiant.utilisateur.nom,
        r.etudiant.utilisateur.postnom,
        r.etudiant.utilisateur.prenom,
      ]
        .filter(Boolean)
        .join(" ");
      const notes = (r.details as LigneCours[]).map((c) => nombre(c.note));
      return {
        nom,
        l: [
          cellule(r.etudiant.matricule),
          cellule(nom),
          ...notes,
          nombre(r.moyenne),
          nombre(r.total),
          r.creditsValides,
          r.creditsTotal,
          cellule(r.mention),
          r.rang ?? "",
          cellule(r.decisionProposee),
          cellule(r.decisionJury),
          cellule(r.motifJury),
          cellule(decisionFinale(r.decisionProposee, r.decisionJury)),
        ],
      };
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
    .map((x) => x.l.join(";"));
  const contenu = "﻿" + [entete.map(cellule).join(";"), ...lignes].join("\r\n");
  const fichier = titreDeliberation(d)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .toLowerCase();
  return new Response(contenu, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deliberation-${fichier}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
