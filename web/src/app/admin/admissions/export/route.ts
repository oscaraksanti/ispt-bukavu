import { LIBELLES_STATUT, type Statut } from "@/features/admissions/regles";
import { utilisateurConnecte } from "@/features/auth/acces";
import { db } from "@/lib/db";

const cellule = (v: unknown) => {
  const t = v === null || v === undefined ? "" : String(v);
  // Neutralise les formules interprétées par les tableurs (=, +, -, @).
  const sur = /^[=+\-@]/.test(t) ? `'${t}` : t;
  return `"${sur.replace(/"/g, '""')}"`;
};

/** Export des dossiers d'une campagne, ouvrable dans un tableur. */
export async function GET(requete: Request) {
  const u = await utilisateurConnecte();
  if (!u?.permissions.has("admissions.consulter"))
    return new Response("Accès refusé", { status: 403 });
  const campagneId = new URL(requete.url).searchParams.get("campagne") ?? "";
  const campagne = await db.campagneAdmission.findUnique({ where: { id: campagneId } });
  if (!campagne) return new Response("Campagne introuvable", { status: 404 });
  const dossiers = await db.candidature.findMany({
    where: { campagneId, statut: { not: "BROUILLON" } },
    orderBy: { numero: "asc" },
    include: { filiere: true, candidat: { select: { email: true } } },
  });
  const entetes = [
    "Numéro",
    "Nom",
    "Postnom",
    "Prénom",
    "Sexe",
    "Date de naissance",
    "Lieu de naissance",
    "Nationalité",
    "Téléphone",
    "Email",
    "Adresse",
    "École d'origine",
    "Section",
    "Année du diplôme",
    "Pourcentage",
    "Filière",
    "Référence de paiement",
    "État",
    "Déposé le",
  ];
  const lignes = dossiers.map((d) =>
    [
      d.numero,
      d.nom,
      d.postnom,
      d.prenom,
      d.sexe,
      d.dateNaissance?.toISOString().slice(0, 10),
      d.lieuNaissance,
      d.nationalite,
      d.telephone,
      d.candidat.email,
      d.adresse,
      d.ecoleOrigine,
      d.sectionHumanites,
      d.anneeDiplome,
      d.pourcentage?.toString(),
      d.filiere?.nom,
      d.referencePaiement,
      LIBELLES_STATUT[d.statut as Statut],
      d.soumiseLe?.toISOString().slice(0, 10),
    ]
      .map(cellule)
      .join(";"),
  );
  const csv = "﻿" + [entetes.map(cellule).join(";"), ...lignes].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidatures-${campagne.libelle.replace(/[^\w-]+/g, "-")}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
