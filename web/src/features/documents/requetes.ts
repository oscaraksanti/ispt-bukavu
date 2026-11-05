import "server-only";
import { donneesBulletin } from "@/features/deliberations/bulletin";
import { INCLURE_DELIBERATION, reglementDe } from "@/features/deliberations/donnees";
import { decisionFinale } from "@/features/deliberations/regles";
import { db } from "@/lib/db";
import type { DonneesDocument, TypeDocument } from "./regles";

type Figees = { donnees: DonneesDocument } | { erreur: string };

/** Décisions qui permettent la délivrance d'une attestation de réussite. */
const ADMIS = ["ADM", "COMP"];

/**
 * Rassemble et fige les informations imprimées sur un document.
 *
 * Le relevé de notes et l'attestation de réussite reprennent les résultats
 * proclamés par le jury (notes arrondies, crédits validés, décision), jamais un
 * calcul provisoire : un document officiel ne peut pas contredire le
 * procès-verbal de délibération.
 */
export async function figerDonnees(etudiantId: string, type: TypeDocument): Promise<Figees> {
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
  if (!profil || !inscription)
    return { erreur: "L'étudiant n'est inscrit dans aucune promotion de l'année courante." };
  const p = inscription.promotion;
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
    seuil: Number(p.annee.seuilReussite),
  };
  if (type === "ATTESTATION_FREQUENTATION") return { donnees };

  const resultats = await db.resultatDeliberation.findMany({
    where: { etudiantId, deliberation: { promotionId: p.id, statut: "PROCLAMEE" } },
    include: {
      deliberation: { include: INCLURE_DELIBERATION },
      etudiant: { include: { utilisateur: true } },
    },
    orderBy: { deliberation: { semestre: "asc" } },
  });
  const annuel = resultats.find((r) => r.deliberation.periode === "ANNUELLE");

  if (type === "ATTESTATION_REUSSITE") {
    if (!annuel)
      return {
        erreur: `Aucun résultat annuel proclamé pour ${p.annee.libelle} : l'attestation de réussite se délivre après la proclamation par le jury.`,
      };
    const decision = decisionFinale(annuel.decisionProposee, annuel.decisionJury);
    if (!decision || !ADMIS.includes(decision))
      return {
        erreur:
          "Le jury n'a pas déclaré cet étudiant admis : une attestation de réussite ne peut pas être délivrée.",
      };
  }

  // Relevé : le résultat annuel s'il est proclamé, sinon les semestres déjà proclamés.
  const sources = annuel ? [annuel] : resultats;
  if (sources.length === 0)
    return {
      erreur: `Aucun résultat proclamé pour ${p.annee.libelle} : le relevé de notes s'établit après la proclamation par le jury.`,
    };
  const bulletins = await Promise.all(
    sources.map(async (r) => {
      const reglement = await reglementDe(r.deliberation);
      const proclameLe = r.deliberation.proclameLe ?? new Date();
      return { reglement, b: donneesBulletin(r.deliberation, r, reglement, [], proclameLe) };
    }),
  );
  donnees.seuil = bulletins[0].reglement.seuilValidation;
  donnees.semestres = bulletins.flatMap(({ b }) =>
    (b.bulletin?.semestres ?? []).map((s) => ({
      numero: s.numero,
      moyenne: s.moyenne,
      mention: s.mention,
      creditsAcquis: s.creditsValides,
      creditsTotal: s.creditsTotal,
      cours: s.cours.map(({ intitule, credits, note, valide }) => ({
        intitule,
        credits,
        note,
        valide,
      })),
    })),
  );
  const dernier = bulletins.at(-1)!.b.bulletin!;
  donnees.resultat = {
    periode: dernier.periode,
    moyenne: dernier.moyenne,
    mention: dernier.mention,
    decision: dernier.decision,
    creditsValides: dernier.creditsValides,
    creditsTotal: dernier.creditsTotal,
    proclameLe: dernier.proclameLe,
  };
  return { donnees };
}
