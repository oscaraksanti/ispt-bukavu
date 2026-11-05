import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  Apercu,
  EnteteOfficiel,
  Feuille,
  Fiche,
  nombre,
  note,
  PiedFeuille,
  Signatures,
  Synthese,
  T,
  TitreDocument,
} from "@/components/documents/papier";
import { formatJour } from "@/features/actualites/dates";
import { utilisateurConnecte } from "@/features/auth/acces";
import { lireInstitut } from "@/features/contenu/lecture";
import { lireParametresDocuments } from "@/features/documents/parametres";
import {
  INCLURE_DELIBERATION,
  reglementDe,
  titreDeliberation,
} from "@/features/deliberations/donnees";
import { decisionFinale, LIBELLES_ARRONDI, LIBELLES_STATUT } from "@/features/deliberations/regles";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = {
  title: "Procès-verbal de délibération",
  robots: { index: false },
};

async function Contenu({ params }: { params: PageProps<"/deliberations/[id]/pv">["params"] }) {
  const u = await utilisateurConnecte();
  const { id } = await params;
  if (!u) redirect(`/connexion?suite=/deliberations/${id}/pv`);
  if (!u.permissions.has("academique.notes.valider")) notFound();
  const d = await db.deliberation.findUnique({
    where: { id },
    include: {
      ...INCLURE_DELIBERATION,
      resultats: { include: { etudiant: { include: { utilisateur: true } } } },
    },
  });
  if (!d) notFound();
  const [institut, reglement, parametres] = await Promise.all([
    lireInstitut(),
    reglementDe(d),
    lireParametresDocuments(),
  ]);
  const annuelle = d.periode === "ANNUELLE";
  const nom = (r: (typeof d.resultats)[number]) =>
    [r.etudiant.utilisateur.nom, r.etudiant.utilisateur.postnom, r.etudiant.utilisateur.prenom]
      .filter(Boolean)
      .join(" ");
  const lignes = [...d.resultats].sort((a, b) => nom(a).localeCompare(nom(b), "fr"));
  const finales = lignes.map((r) => decisionFinale(r.decisionProposee, r.decisionJury));
  const compte = (c: string) => finales.filter((x) => x === c).length;
  const brouillon = d.statut === "PREPARATION";

  const effectif = lignes.length;
  const admis = compte("ADM") + compte("COMP");
  const moyennes = lignes.map((r) => (r.moyenne === null ? null : Number(r.moyenne)));
  const notees = moyennes.filter((m): m is number => m !== null);
  const moyennePromo = notees.length ? notees.reduce((t, m) => t + m, 0) / notees.length : null;
  const securite = `${institut.sigle} PV ${titreDeliberation(d)}`;

  return (
    <Apercu
      informations={
        <>
          Statut : <strong className="text-encre">{LIBELLES_STATUT[d.statut]}</strong>
        </>
      }
    >
      <Feuille
        orientation="paysage"
        securite={securite}
        tampon={brouillon ? { texte: "Document de travail", ton: "attention" } : null}
      >
        <EnteteOfficiel institut={institut} tutelle={parametres.entete} compact />
        <TitreDocument
          titre="Procès-verbal de délibération"
          sousTitre={titreDeliberation(d)}
          className="mt-4"
        />
        <Fiche
          className="mt-4"
          colonnes={4}
          elements={[
            {
              libelle: "Promotion",
              valeur: `${d.promotion.niveau.libelle} · ${d.promotion.filiere.nom}`,
            },
            { libelle: "Période", valeur: annuelle ? "Résultat annuel" : `Semestre ${d.semestre}` },
            { libelle: "Année académique", valeur: d.promotion.annee.libelle },
            {
              libelle: "Date du jury",
              valeur: d.dateJury ? formatJour.format(d.dateJury) : "—",
            },
          ]}
        />
        <table className={cn(T.tableau, "mt-4 text-[8pt]")}>
          <thead>
            <tr>
              <th className={cn(T.th, "w-8")}>N°</th>
              <th className={cn(T.th, "w-[24mm]")}>Matricule</th>
              <th className={T.th}>Nom, post-nom et prénom</th>
              <th className={cn(T.th, T.droite, "w-[19mm]")}>Moyenne /20</th>
              <th className={cn(T.th, T.droite, "w-[19mm]")}>Total</th>
              <th className={cn(T.th, T.centre, "w-[19mm]")}>Crédits</th>
              <th className={cn(T.th, T.centre, "w-[15mm]")}>Mention</th>
              <th className={cn(T.th, T.centre, "w-[12mm]")}>Rang</th>
              {annuelle && <th className={cn(T.th, T.centre, "w-[24mm]")}>Décision</th>}
              <th className={cn(T.th, "w-[62mm]")}>Observations</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((r, i) => (
              <tr key={r.id} className={i % 2 ? "bg-pierre-50/70" : undefined}>
                <td className={cn(T.td, "text-pierre-500")}>{i + 1}</td>
                <td className={cn(T.td, "font-mono text-[7.5pt]")}>{r.etudiant.matricule}</td>
                <td className={cn(T.td, "font-medium text-encre")}>{nom(r)}</td>
                <td className={cn(T.td, T.droite, "font-semibold text-encre")}>
                  {note(r.moyenne === null ? null : Number(r.moyenne))}
                </td>
                <td className={cn(T.td, T.droite)}>{note(Number(r.total))}</td>
                <td className={cn(T.td, T.centre)}>
                  {r.creditsValides}/{r.creditsTotal}
                </td>
                <td className={cn(T.td, T.centre, "font-semibold")}>{r.mention ?? "—"}</td>
                <td className={cn(T.td, T.centre)}>{r.rang ?? "—"}</td>
                {annuelle && (
                  <td className={cn(T.td, T.centre)}>
                    <span
                      className={cn(
                        "inline-block min-w-[16mm] border-[0.5pt] px-1 py-px text-[7pt] font-semibold tracking-[0.06em]",
                        finales[i] === "ADM"
                          ? "border-encre bg-encre text-white"
                          : finales[i] === "COMP"
                            ? "border-encre text-encre"
                            : "border-pierre-400 text-pierre-700",
                      )}
                    >
                      {finales[i] ?? "—"}
                    </span>
                  </td>
                )}
                <td className={cn(T.td, "text-[7pt] leading-snug text-pierre-700")}>
                  {r.decisionJury && (
                    <>
                      <strong className="font-semibold text-encre">
                        Décision du jury (proposée : {r.decisionProposee})
                      </strong>{" "}
                      : {r.motifJury}
                    </>
                  )}
                  {r.coursNonPresentes
                    ? `${r.decisionJury ? " · " : ""}${r.coursNonPresentes} cours non présenté(s)`
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 grid break-inside-avoid grid-cols-[1fr_1.25fr] items-start gap-8">
          <div>
            <Synthese
              elements={[
                { libelle: "Effectif", valeur: effectif },
                ...(annuelle
                  ? [
                      { libelle: "ADM", valeur: compte("ADM"), detail: reglement.decisions.ADM },
                      { libelle: "COMP", valeur: compte("COMP"), detail: reglement.decisions.COMP },
                      {
                        libelle: "Rattrapage",
                        valeur: compte("RATTRAPAGE"),
                        detail: reglement.decisions.RATTRAPAGE,
                      },
                      {
                        libelle: "Admis",
                        valeur: effectif ? `${Math.round((admis / effectif) * 100)} %` : "—",
                        accent: true,
                      },
                    ]
                  : [
                      {
                        libelle: "Moyenne de la promotion",
                        valeur: note(moyennePromo),
                        accent: true,
                      },
                    ]),
              ]}
            />
            <p className="mt-2.5 text-[7pt] leading-snug text-pierre-600">
              Règles appliquées : validation à {nombre(reglement.seuilValidation)}/20 (
              {reglement.niveauValidation === "UE" ? "par UE" : "par cours"}) ;{" "}
              {reglement.calculMoyenne === "PONDEREE"
                ? "moyennes pondérées par les crédits"
                : "moyennes simples"}{" "}
              ; arrondi : {LIBELLES_ARRONDI[reglement.arrondi].toLowerCase()}.
            </p>
          </div>
          <Signatures
            lieu={institut.ville}
            date={formatJour.format(d.dateJury ?? d.clotureLe ?? new Date())}
            signataires={[
              { fonction: "Le Secrétaire du jury", nom: d.secretaireJury },
              { fonction: "Le Président du jury", nom: d.presidentJury },
            ]}
          />
        </div>
        <PiedFeuille
          securite={securite}
          gauche={`Procès-verbal établi par la plateforme de l'${institut.sigle} à partir des notes publiées et des décisions du jury.`}
          droite={LIBELLES_STATUT[d.statut]}
        />
      </Feuille>
    </Apercu>
  );
}

export default function ProcesVerbal({ params }: PageProps<"/deliberations/[id]/pv">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-pierre-100" />}>
      <Contenu params={params} />
    </Suspense>
  );
}
