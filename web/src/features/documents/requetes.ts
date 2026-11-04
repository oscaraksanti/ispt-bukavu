import "server-only";
import { db } from "@/lib/db";
import { bilanSemestre, noteCours } from "@/features/notes/regles";
import type { DonneesDocument, TypeDocument } from "./regles";

/** Rassemble et fige les informations imprimées sur un document. */
export async function figerDonnees(
  etudiantId: string,
  type: TypeDocument,
): Promise<DonneesDocument | null> {
  const profil = await db.profilEtudiant.findUnique({
    where: { id: etudiantId },
    include: {
      utilisateur: true,
      inscriptions: {
        where: { promotion: { annee: { courante: true } } },
        include: { promotion: { include: { filiere: true, niveau: true, annee: true } } },
      },
    },
  });
  const inscription = profil?.inscriptions[0];
  if (!profil || !inscription) return null;
  const p = inscription.promotion;
  const seuil = Number(p.annee.seuilReussite);
  const donnees: DonneesDocument = {
    nom: [profil.utilisateur.nom, profil.utilisateur.postnom, profil.utilisateur.prenom]
      .filter(Boolean)
      .join(" "),
    matricule: profil.matricule,
    sexe: profil.sexe,
    dateNaissance: profil.dateNaissance?.toISOString().slice(0, 10) ?? null,
    lieuNaissance: profil.lieuNaissance,
    promotion: `${p.niveau.code} ${p.filiere.nomCourt}`,
    filiere: p.filiere.nom,
    niveau: p.niveau.libelle,
    annee: p.annee.libelle,
    seuil,
  };
  if (type === "ATTESTATION_FREQUENTATION") return donnees;

  const cours = await db.coursOffert.findMany({
    where: { promotionId: p.id },
    include: {
      cours: { include: { ue: true } },
      evaluations: { where: { statut: "PUBLIEE" }, include: { notes: { where: { etudiantId } } } },
    },
    orderBy: [{ cours: { ue: { semestre: "asc" } } }, { cours: { intitule: "asc" } }],
  });
  const lignes = cours.map((c) => ({
    semestre: c.cours.ue.semestre,
    intitule: c.cours.intitule,
    credits: c.cours.credits,
    note: noteCours(
      c.evaluations.map((e) => ({
        ponderation: Number(e.ponderation),
        statut: "PUBLIEE" as const,
        note: e.notes[0]
          ? {
              valeur: e.notes[0].valeur === null ? null : Number(e.notes[0].valeur),
              absent: e.notes[0].absent,
            }
          : null,
      })),
    ),
  }));
  donnees.semestres = [...Map.groupBy(lignes, (l) => l.semestre).entries()].map(
    ([numero, liste]) => {
      const b = bilanSemestre(liste, seuil);
      return {
        numero,
        moyenne: b.moyenne,
        creditsAcquis: b.creditsAcquis,
        creditsTotal: b.creditsTotal,
        cours: liste.map(({ intitule, credits, note }) => ({ intitule, credits, note })),
      };
    },
  );
  return donnees;
}
