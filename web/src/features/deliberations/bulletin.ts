import type { DonneesBulletin, DonneesDocument } from "@/features/documents/regles";
import {
  arrondirMoyenne,
  type CodeDecision,
  decisionFinale,
  LIBELLES_ARRONDI,
  type LigneCours,
  mentionDe,
  type Periode,
  type Reglement,
} from "./regles";

type Etudiant = {
  matricule: string;
  sexe: "F" | "M" | null;
  dateNaissance: Date | null;
  lieuNaissance: string | null;
  utilisateur: { nom: string; postnom: string | null; prenom: string | null };
};

type Resultat = {
  moyenne: unknown;
  moyenneBrute: unknown;
  total: unknown;
  creditsValides: number;
  creditsTotal: number;
  mention: string | null;
  mentionLibelle: string | null;
  rang: number | null;
  decisionProposee: string | null;
  decisionJury: string | null;
  details: unknown;
  etudiant: Etudiant;
};

type Deliberation = {
  periode: string;
  semestre: number;
  dateJury: Date | null;
  secretaireJury: string | null;
  presidentJury: string | null;
  promotion: {
    niveau: { libelle: string; code: string };
    filiere: { nom: string; nomCourt: string };
    annee: { libelle: string };
  };
};

const nombre = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Contenu figé d'un bulletin, au moment de la proclamation. */
export function donneesBulletin(
  d: Deliberation,
  r: Resultat,
  reglement: Reglement,
  tous: { moyenneBrute: unknown }[],
  proclameLe: Date,
): DonneesDocument {
  const lignes = (r.details as LigneCours[]) ?? [];
  const semestres = [...Map.groupBy(lignes, (l) => l.semestre).entries()]
    .sort(([a], [b]) => a - b)
    .map(([numero, cours]) => {
      const notees = cours.map((c) => ({
        ...c,
        n: c.note ?? (reglement.coursNonPresente === "ZERO" ? 0 : null),
      }));
      const comptes = notees.filter((c) => c.n !== null);
      const credits = comptes.reduce((t, c) => t + c.credits, 0);
      const brute =
        comptes.length && notees.every((c) => c.n !== null)
          ? reglement.calculMoyenne === "PONDEREE"
            ? credits
              ? comptes.reduce((t, c) => t + c.n! * c.credits, 0) / credits
              : null
            : comptes.reduce((t, c) => t + c.n!, 0) / comptes.length
          : null;
      const moyenne = brute === null ? null : arrondirMoyenne(brute, reglement.arrondi);
      return {
        numero,
        moyenne,
        creditsValides: cours.filter((c) => c.valide).reduce((t, c) => t + c.credits, 0),
        creditsTotal: cours.reduce((t, c) => t + c.credits, 0),
        mention: mentionDe(moyenne, reglement.mentions)?.lettre ?? null,
        cours: cours.map((c) => ({
          intitule: c.intitule,
          ue: c.ue,
          credits: c.credits,
          note: c.note,
          valide: c.valide,
        })),
      };
    });
  const code = decisionFinale(r.decisionProposee, r.decisionJury) as CodeDecision | null;
  const decision =
    d.periode === "ANNUELLE" && code && code !== "INCOMPLET"
      ? { code, libelle: reglement.decisions[code] }
      : null;
  const bulletin: DonneesBulletin = {
    periode: d.periode === "ANNUELLE" ? "Résultat annuel" : `Semestre ${d.semestre}`,
    annuel: (d.periode as Periode) === "ANNUELLE",
    semestres,
    moyenne: nombre(r.moyenne),
    total: nombre(r.total) ?? 0,
    creditsValides: r.creditsValides,
    creditsTotal: r.creditsTotal,
    mention: r.mention ? { lettre: r.mention, libelle: r.mentionLibelle ?? "" } : null,
    decision,
    rang: r.rang,
    effectif: tous.filter((x) => x.moyenneBrute !== null).length,
    jury: { secretaire: d.secretaireJury ?? "", president: d.presidentJury ?? "" },
    dateJury: d.dateJury?.toISOString() ?? null,
    proclameLe: proclameLe.toISOString(),
    reglement: {
      seuil: reglement.seuilValidation,
      arrondi: LIBELLES_ARRONDI[reglement.arrondi],
      calcul:
        reglement.calculMoyenne === "PONDEREE"
          ? "Moyennes pondérées par les crédits"
          : "Moyennes arithmétiques simples",
    },
    echelle: reglement.mentions,
  };
  const e = r.etudiant;
  return {
    nom: [e.utilisateur.nom, e.utilisateur.postnom, e.utilisateur.prenom].filter(Boolean).join(" "),
    matricule: e.matricule,
    sexe: e.sexe,
    dateNaissance: e.dateNaissance?.toISOString().slice(0, 10) ?? null,
    lieuNaissance: e.lieuNaissance,
    promotion: `${d.promotion.niveau.code} ${d.promotion.filiere.nomCourt}`,
    filiere: d.promotion.filiere.nom,
    niveau: d.promotion.niveau.libelle,
    annee: d.promotion.annee.libelle,
    seuil: reglement.seuilValidation,
    bulletin,
  };
}
