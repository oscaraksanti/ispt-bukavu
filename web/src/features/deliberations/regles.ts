/**
 * Délibérations : règlement paramétrable et moteur de calcul (pur, testé).
 *
 * Les valeurs par défaut reprennent la pratique observée dans le fichier de
 * délibération de l'institut (BAC 1 Électromécanique, 2023-2024) ; chaque
 * année académique peut avoir son propre règlement, figé à la clôture du jury.
 */

export type ModeArrondi = "JURY" | "DEMI_POINT" | "AUCUN";
export type NiveauValidation = "COURS" | "UE";
export type CalculMoyenne = "PONDEREE" | "SIMPLE";
export type CoursNonPresente = "ZERO" | "BLOQUANT";
export type CodeDecision = "ADM" | "COMP" | "RATTRAPAGE" | "INCOMPLET";
export type Periode = "SEMESTRE" | "ANNUELLE";

export type Mention = { seuil: number; lettre: string; libelle: string };

export type Reglement = {
  seuilValidation: number;
  niveauValidation: NiveauValidation;
  calculMoyenne: CalculMoyenne;
  arrondi: ModeArrondi;
  coursNonPresente: CoursNonPresente;
  seuilAdmissionDette: number;
  plafondCreditsDette: number | null;
  zoneVigilance: number;
  mentions: Mention[];
  decisions: Record<Exclude<CodeDecision, "INCOMPLET">, string>;
  secretaireJury: string;
  presidentJury: string;
};

export const REGLEMENT_PAR_DEFAUT: Reglement = {
  seuilValidation: 10,
  niveauValidation: "COURS",
  calculMoyenne: "PONDEREE",
  arrondi: "JURY",
  coursNonPresente: "ZERO",
  seuilAdmissionDette: 10,
  plafondCreditsDette: null,
  zoneVigilance: 0.5,
  mentions: [
    { seuil: 18, lettre: "A", libelle: "Excellent" },
    { seuil: 16, lettre: "B", libelle: "Très bien" },
    { seuil: 14, lettre: "C", libelle: "Bien" },
    { seuil: 12, lettre: "D", libelle: "Assez bien" },
    { seuil: 10, lettre: "E", libelle: "Passable" },
    { seuil: 8, lettre: "F", libelle: "Insuffisant" },
    { seuil: 0, lettre: "G", libelle: "Insatisfaisant" },
  ],
  decisions: {
    ADM: "Admis(e) sans dette",
    COMP: "Admis(e) avec dette de crédits",
    RATTRAPAGE: "Session de rattrapage",
  },
  secretaireJury: "",
  presidentJury: "",
};

export const LIBELLES_ARRONDI: Record<ModeArrondi, string> = {
  JURY: "Au demi-point, règle du jury (0,35 / 0,75)",
  DEMI_POINT: "Au demi-point le plus proche",
  AUCUN: "Sans arrondi (deux décimales)",
};

/** Complète un règlement enregistré (éventuellement partiel ou ancien) avec les valeurs par défaut. */
export function reglementComplet(r: Partial<Reglement> | null | undefined): Reglement {
  const base = { ...REGLEMENT_PAR_DEFAUT, ...(r ?? {}) };
  return {
    ...base,
    decisions: { ...REGLEMENT_PAR_DEFAUT.decisions, ...(r?.decisions ?? {}) },
    mentions: (r?.mentions?.length ? r.mentions : REGLEMENT_PAR_DEFAUT.mentions)
      .slice()
      .sort((a, b) => b.seuil - a.seuil),
  };
}

/** Arrondi d'une moyenne selon le mode choisi. */
export function arrondirMoyenne(x: number, mode: ModeArrondi) {
  if (mode === "AUCUN") return Math.round(x * 100) / 100;
  if (mode === "DEMI_POINT") return Math.round(x * 2) / 2;
  const entier = Math.floor(x);
  const fraction = Math.round((x - entier) * 1e6) / 1e6;
  return entier + (fraction < 0.35 ? 0 : fraction < 0.75 ? 0.5 : 1);
}

export function mentionDe(moyenne: number | null, mentions: Mention[]) {
  if (moyenne === null) return null;
  return [...mentions].sort((a, b) => b.seuil - a.seuil).find((m) => moyenne >= m.seuil) ?? null;
}

export type CoursEtudiant = {
  coursId: string;
  intitule: string;
  ue: string;
  semestre: number;
  credits: number;
  note: number | null;
};

export type LigneCours = CoursEtudiant & { valide: boolean; noteUe: number | null };

export type Resultat = {
  etudiantId: string;
  cours: LigneCours[];
  total: number;
  creditsTotal: number;
  creditsValides: number;
  coursNonPresentes: number;
  moyenneBrute: number | null;
  moyenne: number | null;
  mention: Mention | null;
  decision: CodeDecision | null;
  casLimite: string | null;
  rang: number | null;
};

const moyennePonderee = (lignes: { note: number; credits: number }[]) => {
  const credits = lignes.reduce((t, l) => t + l.credits, 0);
  return credits ? lignes.reduce((t, l) => t + l.note * l.credits, 0) / credits : null;
};

/** Résultat d'un étudiant pour une période (semestre ou année). */
export function calculerEtudiant(
  etudiantId: string,
  cours: CoursEtudiant[],
  r: Reglement,
  periode: Periode,
): Omit<Resultat, "rang"> {
  const zero = r.coursNonPresente === "ZERO";
  const notes = cours.map((c) => ({ ...c, n: c.note ?? (zero ? 0 : null) }));
  // Note de chaque UE (pondérée par les crédits de ses cours), pour la validation par UE.
  const parUe = new Map<string, number | null>();
  for (const [ue, liste] of Map.groupBy(notes, (c) => `${c.semestre}|${c.ue}`)) {
    parUe.set(
      ue,
      liste.some((c) => c.n === null)
        ? null
        : moyennePonderee(liste.map((c) => ({ note: c.n!, credits: c.credits }))),
    );
  }
  const lignes: LigneCours[] = notes.map((c) => {
    const noteUe = parUe.get(`${c.semestre}|${c.ue}`) ?? null;
    const valide =
      r.niveauValidation === "UE"
        ? noteUe !== null && noteUe >= r.seuilValidation
        : c.n !== null && c.n >= r.seuilValidation;
    return {
      coursId: c.coursId,
      intitule: c.intitule,
      ue: c.ue,
      semestre: c.semestre,
      credits: c.credits,
      note: c.note,
      valide,
      noteUe,
    };
  });
  const creditsTotal = cours.reduce((t, c) => t + c.credits, 0);
  const creditsValides = lignes.filter((l) => l.valide).reduce((t, l) => t + l.credits, 0);
  const coursNonPresentes = cours.filter((c) => c.note === null).length;
  const comptees = notes.filter((c) => c.n !== null) as (CoursEtudiant & { n: number })[];
  const total = comptees.reduce((t, c) => t + c.n * c.credits, 0);
  const bloque = !zero && coursNonPresentes > 0;
  const moyenneBrute =
    bloque || comptees.length === 0
      ? null
      : r.calculMoyenne === "PONDEREE"
        ? moyennePonderee(comptees.map((c) => ({ note: c.n, credits: c.credits })))
        : comptees.reduce((t, c) => t + c.n, 0) / comptees.length;
  const moyenne = moyenneBrute === null ? null : arrondirMoyenne(moyenneBrute, r.arrondi);
  const mention = mentionDe(moyenne, r.mentions);

  let decision: CodeDecision | null = null;
  if (periode === "ANNUELLE") {
    if (moyenne === null) decision = "INCOMPLET";
    else if (creditsValides === creditsTotal) decision = "ADM";
    else if (
      moyenne >= r.seuilAdmissionDette &&
      (r.plafondCreditsDette === null || creditsTotal - creditsValides <= r.plafondCreditsDette)
    )
      decision = "COMP";
    else decision = "RATTRAPAGE";
  }

  // Cas limites : à signaler au jury avant qu'il ne statue.
  const z = r.zoneVigilance;
  let casLimite: string | null = null;
  if (moyenneBrute !== null && z > 0) {
    const seuil = r.seuilAdmissionDette;
    const proche = moyenneBrute < seuil && seuil - moyenneBrute <= z ? seuil : undefined;
    if (proche !== undefined)
      casLimite = `Moyenne à ${(Math.round((proche - moyenneBrute) * 100) / 100).toLocaleString("fr-FR")} point(s) de ${proche}`;
    const echecsProches = lignes.filter(
      (l) => !l.valide && l.note !== null && r.seuilValidation - l.note <= z,
    );
    if (!casLimite && echecsProches.length)
      casLimite = `${echecsProches.length} cours non validé(s) à moins de ${z} point(s) du seuil`;
  }

  return {
    etudiantId,
    cours: lignes,
    total: Math.round(total * 100) / 100,
    creditsTotal,
    creditsValides,
    coursNonPresentes,
    moyenneBrute: moyenneBrute === null ? null : Math.round(moyenneBrute * 1000) / 1000,
    moyenne,
    mention,
    decision,
    casLimite,
  };
}

/** Résultats d'une promotion, avec le rang (ex æquo partagés) sur la moyenne non arrondie. */
export function calculerPromotion(
  etudiants: { etudiantId: string; cours: CoursEtudiant[] }[],
  r: Reglement,
  periode: Periode,
): Resultat[] {
  const res = etudiants.map((e) => calculerEtudiant(e.etudiantId, e.cours, r, periode));
  const classees = res
    .map((x) => x.moyenneBrute)
    .filter((m): m is number => m !== null)
    .sort((a, b) => b - a);
  return res.map((x) => ({
    ...x,
    rang: x.moyenneBrute === null ? null : classees.indexOf(x.moyenneBrute) + 1,
  }));
}

/** Décision retenue : celle du jury si elle existe, sinon la décision proposée. */
export function decisionFinale(proposee: string | null, jury: string | null) {
  return jury || proposee;
}

export type StatutDeliberation = "PREPARATION" | "CLOTUREE" | "PROCLAMEE";

export const LIBELLES_STATUT: Record<StatutDeliberation, string> = {
  PREPARATION: "En préparation",
  CLOTUREE: "Jury clôturé",
  PROCLAMEE: "Proclamée",
};

/** Contrôles avant la clôture du jury. Les « bloquants » empêchent de clôturer. */
export function controles(
  resultats: {
    coursNonPresentes: number;
    casLimite: string | null;
    decisionJury: string | null;
    motifJury: string | null;
    decision: string | null;
  }[],
  coursSansNotes: string[],
  contexte: {
    nbCours?: number;
    secretaire?: string | null;
    president?: string | null;
    /** Cours notés dont les évaluations publiées ne totalisent pas 100 %. */
    ponderationsIncompletes?: { intitule: string; poids: number }[];
  } = {},
) {
  const bloquants: string[] = [];
  const avertissements: string[] = [];
  if (resultats.length === 0) bloquants.push("Aucun étudiant inscrit dans cette promotion.");
  if (contexte.nbCours === 0) bloquants.push("Aucun cours ouvert pour cette période.");
  if ("secretaire" in contexte && (!contexte.secretaire?.trim() || !contexte.president?.trim()))
    bloquants.push(
      "Indiquez le secrétaire et le président du jury (ils signent le procès-verbal et les bulletins).",
    );
  if (coursSansNotes.length)
    bloquants.push(
      `${coursSansNotes.length} cours sans aucune note publiée : ${coursSansNotes.slice(0, 4).join(", ")}${coursSansNotes.length > 4 ? "…" : ""}`,
    );
  const incompletes = contexte.ponderationsIncompletes ?? [];
  if (incompletes.length)
    bloquants.push(
      `${incompletes.length} cours dont les évaluations publiées ne totalisent pas 100 % : ${incompletes
        .slice(0, 4)
        .map((c) => `${c.intitule} (${c.poids} %)`)
        .join(
          ", ",
        )}${incompletes.length > 4 ? "…" : ""}. Publiez les évaluations manquantes avant de clôturer.`,
    );
  const sansMotif = resultats.filter((x) => x.decisionJury && !x.motifJury?.trim()).length;
  if (sansMotif) bloquants.push(`${sansMotif} décision(s) du jury sans motif.`);
  const incomplets = resultats.filter((x) => x.decision === "INCOMPLET").length;
  if (incomplets)
    bloquants.push(`${incomplets} étudiant(s) sans décision possible (cours non présentés).`);
  const manquants = resultats.filter((x) => x.coursNonPresentes > 0).length;
  if (manquants)
    avertissements.push(`${manquants} étudiant(s) avec au moins un cours non présenté.`);
  const limites = resultats.filter((x) => x.casLimite).length;
  if (limites) avertissements.push(`${limites} cas limite(s) à examiner par le jury.`);
  return { bloquants, avertissements };
}

/** Statistiques d'une session : mentions, décisions, réussite par cours. */
export function statistiquesSession(resultats: Resultat[], seuilValidation: number) {
  const avecMoyenne = resultats.filter((r) => r.moyenne !== null);
  const parMention = new Map<string, number>();
  for (const r of avecMoyenne)
    if (r.mention) parMention.set(r.mention.lettre, (parMention.get(r.mention.lettre) ?? 0) + 1);
  const parCours = new Map<
    string,
    { intitule: string; notes: number[]; valides: number; credits: number }
  >();
  for (const r of resultats)
    for (const c of r.cours) {
      const s = parCours.get(c.coursId) ?? {
        intitule: c.intitule,
        notes: [],
        valides: 0,
        credits: c.credits,
      };
      if (c.note !== null) s.notes.push(c.note);
      if (c.valide) s.valides++;
      parCours.set(c.coursId, s);
    }
  const n = resultats.length;
  return {
    effectif: n,
    moyennePromotion: avecMoyenne.length
      ? Math.round(
          (avecMoyenne.reduce((t, r) => t + r.moyenneBrute!, 0) / avecMoyenne.length) * 100,
        ) / 100
      : null,
    parMention: Object.fromEntries(parMention),
    cours: [...parCours.entries()]
      .map(([coursId, s]) => ({
        coursId,
        intitule: s.intitule,
        credits: s.credits,
        moyenne: s.notes.length
          ? Math.round((s.notes.reduce((t, v) => t + v, 0) / s.notes.length) * 100) / 100
          : null,
        tauxValidation: n ? Math.round((s.valides / n) * 100) : 0,
        sousSeuil: s.notes.filter((v) => v < seuilValidation).length,
      }))
      .sort((a, b) => a.tauxValidation - b.tauxValidation),
  };
}
