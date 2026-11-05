import "server-only";
import { libellePromotion, semestresDuNiveau } from "@/features/academique/regles";
import { noteCours } from "@/features/notes/regles";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { type CoursEtudiant, type Periode, type Reglement, reglementComplet } from "./regles";

/** Règlement de l'année (ou celui par défaut s'il n'a pas encore été défini). */
export async function reglementDeLAnnee(anneeId: string) {
  const r = await db.reglementAcademique.findUnique({ where: { anneeId } });
  return { reglement: reglementComplet(r?.regles as Partial<Reglement> | null), defini: !!r };
}

/** Règlement effectivement appliqué par une délibération (figé, ou celui de l'année). */
export async function reglementDe(d: { regles: Prisma.JsonValue; promotion: { anneeId: string } }) {
  if (d.regles) return reglementComplet(d.regles as Partial<Reglement>);
  return (await reglementDeLAnnee(d.promotion.anneeId)).reglement;
}

export const INCLURE_DELIBERATION = {
  promotion: { include: { filiere: true, niveau: true, annee: true } },
} as const;

export function libellePeriode(d: { periode: Periode; semestre: number }) {
  return d.periode === "ANNUELLE" ? "Résultat annuel" : `Semestre ${d.semestre}`;
}

export function titreDeliberation(d: {
  periode: Periode;
  semestre: number;
  promotion: Parameters<typeof libellePromotion>[0] & { annee: { libelle: string } };
}) {
  return `${libellePromotion(d.promotion)} · ${libellePeriode(d)} · ${d.promotion.annee.libelle}`;
}

/** Périodes possibles pour une promotion : ses deux semestres, puis l'année. */
export function periodesDe(niveauOrdre: number) {
  return [
    ...semestresDuNiveau(niveauOrdre).map((s) => ({ periode: "SEMESTRE" as const, semestre: s })),
    { periode: "ANNUELLE" as const, semestre: 0 },
  ];
}

/**
 * Notes de chaque étudiant de la promotion, cours par cours, à partir des
 * évaluations publiées (note du cours = moyenne pondérée des évaluations).
 */
export async function notesDeLaPromotion(promotionId: string, periode: Periode, semestre: number) {
  const promotion = await db.promotion.findUniqueOrThrow({
    where: { id: promotionId },
    include: { niveau: true },
  });
  const semestres = periode === "ANNUELLE" ? semestresDuNiveau(promotion.niveau.ordre) : [semestre];
  const [cours, inscriptions] = await Promise.all([
    db.coursOffert.findMany({
      where: { promotionId, cours: { ue: { semestre: { in: semestres } } } },
      include: {
        cours: { include: { ue: true } },
        evaluations: { where: { statut: "PUBLIEE" }, include: { notes: true } },
      },
      orderBy: [
        { cours: { ue: { semestre: "asc" } } },
        { cours: { ue: { code: "asc" } } },
        { cours: { intitule: "asc" } },
      ],
    }),
    db.inscription.findMany({
      where: { promotionId, statut: { notIn: ["ABANDON"] } },
      select: { etudiantId: true },
    }),
  ]);
  const coursSansNotes = cours
    .filter((c) => c.evaluations.length === 0)
    .map((c) => c.cours.intitule);
  // Une note de cours calculée sur une partie seulement des évaluations n'est pas définitive.
  const ponderationsIncompletes = cours
    .map((c) => ({
      intitule: c.cours.intitule,
      poids: c.evaluations.reduce((t, e) => t + Number(e.ponderation), 0),
    }))
    .filter((c) => c.poids > 0 && c.poids < 100);
  const etudiants = inscriptions.map(({ etudiantId }) => ({
    etudiantId,
    cours: cours.map<CoursEtudiant>((c) => ({
      coursId: c.id,
      intitule: c.cours.intitule,
      ue: `${c.cours.ue.code} — ${c.cours.ue.intitule}`,
      semestre: c.cours.ue.semestre,
      credits: c.cours.credits,
      // Aucune note saisie pour l'étudiant dans ce cours : cours non présenté.
      note: c.evaluations.some((e) => e.notes.some((x) => x.etudiantId === etudiantId))
        ? noteCours(
            c.evaluations.map((e) => {
              const n = e.notes.find((x) => x.etudiantId === etudiantId);
              return {
                ponderation: Number(e.ponderation),
                statut: "PUBLIEE" as const,
                note: n
                  ? { valeur: n.valeur === null ? null : Number(n.valeur), absent: n.absent }
                  : null,
              };
            }),
          )
        : null,
    })),
  }));
  return { etudiants, coursSansNotes, ponderationsIncompletes, nbCours: cours.length };
}

/**
 * Délibération clôturée ou proclamée qui couvre ce cours (son semestre, ou
 * l'année) : tant qu'elle l'est, les notes publiées du cours sont figées.
 */
export async function deliberationFigeant(coursOffertId: string) {
  const co = await db.coursOffert.findUnique({
    where: { id: coursOffertId },
    select: { promotionId: true, cours: { select: { ue: { select: { semestre: true } } } } },
  });
  if (!co) return null;
  return db.deliberation.findFirst({
    where: {
      promotionId: co.promotionId,
      statut: { in: ["CLOTUREE", "PROCLAMEE"] },
      OR: [{ periode: "ANNUELLE" }, { periode: "SEMESTRE", semestre: co.cours.ue.semestre }],
    },
    select: { statut: true, periode: true, semestre: true },
  });
}
