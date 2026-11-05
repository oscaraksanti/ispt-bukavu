import "server-only";
import { libellePromotion } from "@/features/academique/regles";
import { decisionFinale } from "@/features/deliberations/regles";
import { noteCours } from "@/features/notes/regles";
import type { CodePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import type { Feuille } from "./tableur";

/** Exports normalisés proposés dans /admin/exports. */
export const EXPORTS = {
  inscriptions: {
    titre: "Registre des inscriptions",
    description:
      "Une ligne par étudiant inscrit : identité, promotion, statut d'inscription et contacts.",
    permission: "etudiants.gerer",
  },
  effectifs: {
    titre: "Effectifs par promotion",
    description: "Inscrits par filière et par niveau, répartis par sexe et par statut.",
    permission: "etudiants.gerer",
  },
  notes: {
    titre: "Notes par cours",
    description:
      "Note de chaque étudiant dans chaque cours, calculée sur les évaluations publiées, avec la part déjà publiée.",
    permission: "academique.notes.valider",
  },
  resultats: {
    titre: "Résultats proclamés",
    description:
      "Résultats des délibérations proclamées : moyenne, crédits, mention, rang et décision du jury.",
    permission: "academique.notes.valider",
  },
} as const satisfies Record<
  string,
  { titre: string; description: string; permission: CodePermission }
>;

export type TypeExport = keyof typeof EXPORTS;

export function estTypeExport(t: string): t is TypeExport {
  return t in EXPORTS;
}

const STATUTS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_REGLE: "En règle",
  SUSPENDUE: "Suspendue",
  DIPLOME: "Diplômé",
  ABANDON: "Abandon",
};

const nomComplet = (u: { nom: string; postnom: string | null; prenom: string | null }) =>
  [u.nom, u.postnom, u.prenom].filter(Boolean).join(" ");

const INCLURE_PROMOTION = { filiere: true, niveau: true, annee: true } as const;

/** Tri par niveau puis par filière (un critère par objet, comme l'exige Prisma). */
const ordrePromotion = [
  { promotion: { niveau: { ordre: "asc" } } },
  { promotion: { filiere: { ordre: "asc" } } },
] as const;

/** Construit la feuille d'un export pour une année académique. */
export async function feuilleExport(type: TypeExport, anneeId: string): Promise<Feuille> {
  switch (type) {
    case "inscriptions":
      return inscriptions(anneeId);
    case "effectifs":
      return effectifs(anneeId);
    case "notes":
      return notes(anneeId);
    case "resultats":
      return resultats(anneeId);
  }
}

async function inscriptions(anneeId: string): Promise<Feuille> {
  const lignes = await db.inscription.findMany({
    where: { promotion: { anneeId } },
    include: {
      promotion: { include: INCLURE_PROMOTION },
      etudiant: { include: { utilisateur: true } },
    },
    orderBy: [...ordrePromotion, { etudiant: { utilisateur: { nom: "asc" } } }],
  });
  return {
    nom: "Inscriptions",
    entetes: [
      "Année académique",
      "Matricule",
      "Nom",
      "Post-nom",
      "Prénom",
      "Sexe",
      "Date de naissance",
      "Lieu de naissance",
      "Filière",
      "Niveau",
      "Promotion",
      "Statut d'inscription",
      "Inscrit le",
      "Téléphone",
      "Adresse email",
    ],
    lignes: lignes.map((i) => [
      i.promotion.annee.libelle,
      i.etudiant.matricule,
      i.etudiant.utilisateur.nom,
      i.etudiant.utilisateur.postnom,
      i.etudiant.utilisateur.prenom,
      i.etudiant.sexe,
      i.etudiant.dateNaissance,
      i.etudiant.lieuNaissance,
      i.promotion.filiere.nom,
      i.promotion.niveau.code,
      libellePromotion(i.promotion),
      STATUTS[i.statut] ?? i.statut,
      i.creeLe,
      i.etudiant.utilisateur.telephone,
      i.etudiant.utilisateur.email,
    ]),
  };
}

async function effectifs(anneeId: string): Promise<Feuille> {
  const promotions = await db.promotion.findMany({
    where: { anneeId },
    include: {
      ...INCLURE_PROMOTION,
      inscriptions: { select: { statut: true, etudiant: { select: { sexe: true } } } },
    },
    orderBy: [{ niveau: { ordre: "asc" } }, { filiere: { ordre: "asc" } }],
  });
  const statuts = Object.keys(STATUTS);
  return {
    nom: "Effectifs",
    entetes: [
      "Année académique",
      "Filière",
      "Niveau",
      "Promotion",
      "Inscrits",
      "Femmes",
      "Hommes",
      "Sexe non renseigné",
      ...statuts.map((s) => STATUTS[s]),
    ],
    lignes: promotions.map((p) => {
      const i = p.inscriptions;
      return [
        p.annee.libelle,
        p.filiere.nom,
        p.niveau.code,
        libellePromotion(p),
        i.length,
        i.filter((x) => x.etudiant.sexe === "F").length,
        i.filter((x) => x.etudiant.sexe === "M").length,
        i.filter((x) => !x.etudiant.sexe).length,
        ...statuts.map((s) => i.filter((x) => x.statut === s).length),
      ];
    }),
  };
}

async function notes(anneeId: string): Promise<Feuille> {
  const cours = await db.coursOffert.findMany({
    where: { promotion: { anneeId } },
    include: {
      promotion: {
        include: {
          ...INCLURE_PROMOTION,
          inscriptions: {
            where: { statut: { not: "ABANDON" } },
            include: { etudiant: { include: { utilisateur: true } } },
          },
        },
      },
      cours: { include: { ue: true } },
      evaluations: { where: { statut: "PUBLIEE" }, include: { notes: true } },
    },
    orderBy: [
      ...ordrePromotion,
      { cours: { ue: { semestre: "asc" } } },
      { cours: { intitule: "asc" } },
    ],
  });
  const lignes = cours.flatMap((c) => {
    const publie = c.evaluations.reduce((t, e) => t + Number(e.ponderation), 0);
    return c.promotion.inscriptions
      .map((i) => {
        const note = noteCours(
          c.evaluations.map((e) => {
            const n = e.notes.find((x) => x.etudiantId === i.etudiantId);
            return {
              ponderation: Number(e.ponderation),
              statut: "PUBLIEE" as const,
              note: n
                ? { valeur: n.valeur === null ? null : Number(n.valeur), absent: n.absent }
                : null,
            };
          }),
        );
        return [
          c.promotion.annee.libelle,
          libellePromotion(c.promotion),
          c.cours.ue.semestre,
          c.cours.ue.code,
          c.cours.intitule,
          c.cours.credits,
          i.etudiant.matricule,
          nomComplet(i.etudiant.utilisateur),
          note,
          publie,
          publie >= 100 ? "Complète" : publie > 0 ? "Provisoire" : "Aucune note publiée",
        ];
      })
      .sort((a, b) => String(a[7]).localeCompare(String(b[7]), "fr"));
  });
  return {
    nom: "Notes",
    entetes: [
      "Année académique",
      "Promotion",
      "Semestre",
      "Code UE",
      "Cours",
      "Crédits",
      "Matricule",
      "Nom complet",
      "Note /20",
      "Évaluations publiées (%)",
      "État",
    ],
    lignes,
  };
}

async function resultats(anneeId: string): Promise<Feuille> {
  const lignes = await db.resultatDeliberation.findMany({
    where: { deliberation: { statut: "PROCLAMEE", promotion: { anneeId } } },
    include: {
      deliberation: { include: { promotion: { include: INCLURE_PROMOTION } } },
      etudiant: { include: { utilisateur: true } },
    },
    orderBy: [
      { deliberation: { promotion: { niveau: { ordre: "asc" } } } },
      { deliberation: { periode: "asc" } },
      { deliberation: { semestre: "asc" } },
      { rang: "asc" },
    ],
  });
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    nom: "Résultats",
    entetes: [
      "Année académique",
      "Promotion",
      "Période",
      "Matricule",
      "Nom complet",
      "Moyenne /20",
      "Total des points",
      "Crédits validés",
      "Crédits du programme",
      "Mention",
      "Rang",
      "Décision proposée",
      "Décision du jury",
      "Décision finale",
      "Motif du jury",
      "Proclamé le",
    ],
    lignes: lignes.map((r) => {
      const d = r.deliberation;
      return [
        d.promotion.annee.libelle,
        libellePromotion(d.promotion),
        d.periode === "ANNUELLE" ? "Résultat annuel" : `Semestre ${d.semestre}`,
        r.etudiant.matricule,
        nomComplet(r.etudiant.utilisateur),
        n(r.moyenne),
        n(r.total),
        r.creditsValides,
        r.creditsTotal,
        r.mention,
        r.rang,
        r.decisionProposee,
        r.decisionJury,
        decisionFinale(r.decisionProposee, r.decisionJury),
        r.motifJury,
        d.proclameLe,
      ];
    }),
  };
}
