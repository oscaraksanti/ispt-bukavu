import type { ReactNode } from "react";
import { formatJour } from "@/features/actualites/dates";
import type { Institut } from "@/features/contenu/lecture";
import type { ReglagesDocuments } from "@/features/contenu/reglages";
import {
  civilite,
  type DonneesDocument,
  LIBELLES_DOCUMENT,
  type TypeDocument,
} from "@/features/documents/regles";
import { cn } from "@/lib/cn";
import {
  EnteteOfficiel,
  Feuille,
  Fiche,
  nombre,
  note,
  PiedFeuille,
  Rubrique,
  Signatures,
  Synthese,
  T,
  TitreDocument,
  Verification,
} from "./papier";

const jour = (iso: string) => formatJour.format(new Date(iso));

/** Mise en page A4 d'un document officiel, avec son QR code de vérification. */
export function DocumentOfficiel({
  type,
  donnees: d,
  code,
  emisLe,
  institut,
  signataire,
  qr,
  urlVerification,
  revoque,
  parametres,
}: {
  type: TypeDocument;
  donnees: DonneesDocument;
  code: string;
  emisLe: Date;
  institut: Institut;
  signataire: { fonction: string; nom: string } | null;
  qr: string;
  urlVerification: string;
  revoque: string | null;
  parametres: ReglagesDocuments;
}) {
  const attestation = type === "ATTESTATION_FREQUENTATION" || type === "ATTESTATION_REUSSITE";
  const securite = `${institut.sigle} ${LIBELLES_DOCUMENT[type]} ${code}`;
  const sousTitre = d.bulletin
    ? `${d.bulletin.periode} · Année académique ${d.annee}`
    : `Année académique ${d.annee}`;
  const fait = { lieu: institut.ville, date: formatJour.format(emisLe) };
  // « isptbukavu.org/verifier » : le code figure juste en dessous, en grand.
  const site = urlVerification.replace(/\/[^/]*$/, "").replace(/^www\./, "");
  const signatures = d.bulletin
    ? [
        { fonction: "Le Secrétaire du jury", nom: d.bulletin.jury.secretaire },
        { fonction: "Le Président du jury", nom: d.bulletin.jury.president },
      ]
    : signataire
      ? [signataire]
      : [{ fonction: "Pour l'institut", nom: null }];

  return (
    <Feuille
      securite={securite}
      cadre={attestation}
      tampon={revoque ? { texte: "Révoqué", ton: "erreur" } : null}
      className={attestation ? "px-[21mm] pt-[17mm] pb-[15mm]" : undefined}
    >
      {revoque && (
        <p className="mb-3 border-[0.8pt] border-erreur bg-erreur-fond px-3 py-1.5 text-center text-[8pt] font-semibold text-erreur">
          Document révoqué : {revoque}
        </p>
      )}
      <EnteteOfficiel institut={institut} tutelle={parametres.entete} />
      <TitreDocument
        titre={LIBELLES_DOCUMENT[type]}
        sousTitre={sousTitre}
        reference={code}
        className={attestation ? "mt-12" : undefined}
      />

      {attestation ? (
        <CorpsAttestation type={type} d={d} formule={parametres.formuleFinale} />
      ) : (
        <div className="mt-6">
          <Fiche
            colonnes={3}
            elements={[
              { libelle: "Nom, post-nom et prénom", valeur: d.nom, large: true },
              { libelle: "Matricule", valeur: d.matricule, mono: true },
              ...(d.dateNaissance
                ? [
                    {
                      libelle: "Naissance",
                      valeur: `${formatJour.format(new Date(`${d.dateNaissance}T12:00:00Z`))}${d.lieuNaissance ? ` à ${d.lieuNaissance}` : ""}`,
                    },
                  ]
                : []),
              { libelle: "Promotion", valeur: d.niveau },
              { libelle: "Filière", valeur: d.filiere },
              ...(d.dateNaissance ? [] : [{ libelle: "Année académique", valeur: d.annee }]),
            ]}
          />
          {type === "BULLETIN" && d.bulletin ? <CorpsBulletin d={d} /> : <CorpsReleve d={d} />}
        </div>
      )}

      {signatures.length > 1 ? (
        <div className="mt-auto pt-8">
          <Signatures lieu={fait.lieu} date={fait.date} signataires={signatures} />
          <Verification className="mt-6" qr={qr} code={code} url={site} />
        </div>
      ) : (
        <div
          className={cn(
            "mt-auto flex items-end justify-between gap-6 pt-8",
            attestation && "pt-10",
          )}
        >
          <Verification qr={qr} code={code} url={site} />
          <Signatures lieu={fait.lieu} date={fait.date} signataires={signatures} />
        </div>
      )}
      <PiedFeuille
        securite={securite}
        gauche={parametres.mentionPied || `${institut.statut} · ${institut.acteCreation}`}
        droite={`${institut.sigle} · ${code}`}
      />
    </Feuille>
  );
}

/* Attestations ---------------------------------------------------------------- */

function CorpsAttestation({
  type,
  d,
  formule,
}: {
  type: TypeDocument;
  d: DonneesDocument;
  formule: string;
}) {
  const ne = d.sexe === "F" ? "née" : "né";
  const inscrit = d.sexe === "F" ? "inscrite" : "inscrit";
  const naissance = d.dateNaissance
    ? `, ${ne} le ${formatJour.format(new Date(`${d.dateNaissance}T12:00:00Z`))}${d.lieuNaissance ? ` à ${d.lieuNaissance}` : ""}`
    : "";
  const totalAcquis = d.semestres?.reduce((t, s) => t + s.creditsAcquis, 0) ?? 0;
  const totalCredits = d.semestres?.reduce((t, s) => t + s.creditsTotal, 0) ?? 0;
  const titulaire = (
    <>
      {civilite(d.sexe)}{" "}
      <strong className="font-semibold tracking-[0.02em] uppercase">{d.nom}</strong>, matricule{" "}
      <span className="font-mono text-[11pt] tracking-[0.04em]">{d.matricule}</span>
      {naissance}
    </>
  );

  let texte: ReactNode;
  if (type === "ATTESTATION_FREQUENTATION")
    texte = (
      <>
        Il est attesté que {titulaire}, est régulièrement {inscrit} en <strong>{d.niveau}</strong>,
        filière <strong>{d.filiere}</strong>, pour l&apos;année académique{" "}
        <strong>{d.annee}</strong>.
      </>
    );
  else if (d.resultat)
    texte = (
      <>
        Il est attesté que {titulaire}, {inscrit} en {d.niveau}, filière {d.filiere}, pour
        l&apos;année académique {d.annee}, a obtenu une moyenne annuelle de{" "}
        <strong>{d.resultat.moyenne === null ? "—" : `${note(d.resultat.moyenne)}/20`}</strong>
        {d.resultat.mention ? `, mention ${d.resultat.mention.libelle}` : ""}, et validé{" "}
        <strong>
          {d.resultat.creditsValides} crédits sur {d.resultat.creditsTotal}
        </strong>
        . Décision du jury, proclamée le {jour(d.resultat.proclameLe)} :{" "}
        <strong>{d.resultat.decision?.libelle ?? "—"}</strong>.
      </>
    );
  else
    texte = (
      <>
        Il est attesté que {titulaire}, {inscrit} en {d.niveau}, filière {d.filiere}, a acquis{" "}
        <strong>
          {totalAcquis} crédits sur {totalCredits}
        </strong>{" "}
        au cours de l&apos;année académique {d.annee}
        {d.semestres?.length
          ? `, avec ${d.semestres
              .filter((s) => s.moyenne !== null)
              .map((s) => `une moyenne de ${note(s.moyenne)}/20 au semestre ${s.numero}`)
              .join(" et ")}`
          : ""}
        .
      </>
    );

  return (
    <div className="mx-auto mt-12 max-w-[150mm] font-serif text-[12.5pt] leading-[1.85] text-pierre-900">
      <p className="text-justify">{texte}</p>
      {type === "ATTESTATION_REUSSITE" && d.resultat && (
        <Synthese
          className="mt-8 font-sans"
          elements={[
            {
              libelle: "Moyenne annuelle",
              valeur: d.resultat.moyenne === null ? "—" : note(d.resultat.moyenne),
              accent: true,
            },
            {
              libelle: "Mention",
              valeur: d.resultat.mention?.lettre ?? "—",
              detail: d.resultat.mention?.libelle,
            },
            {
              libelle: "Crédits validés",
              valeur: `${d.resultat.creditsValides}/${d.resultat.creditsTotal}`,
            },
            {
              libelle: "Décision",
              valeur: d.resultat.decision?.code ?? "—",
              detail: d.resultat.decision?.libelle,
            },
          ]}
        />
      )}
      <p className="mt-8 text-justify">{formule}</p>
    </div>
  );
}

/* Relevé de notes ---------------------------------------------------------------- */

function CorpsReleve({ d }: { d: DonneesDocument }) {
  const r = d.resultat;
  return (
    <>
      {(d.semestres ?? []).map((s) => (
        <section key={s.numero} className="mt-6 break-inside-avoid">
          <Rubrique titre={`Semestre ${s.numero}`} complement={`${s.creditsTotal} crédits`} />
          <table className={cn(T.tableau, "mt-2")}>
            <thead>
              <tr>
                <th className={cn(T.th, "w-8")}>N°</th>
                <th className={T.th}>Cours</th>
                <th className={cn(T.th, T.centre, "w-16")}>Crédits</th>
                <th className={cn(T.th, T.droite, "w-20")}>Note /20</th>
                <th className={cn(T.th, T.centre, "w-24")}>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {s.cours.map((c, i) => {
                const valide = c.valide ?? (c.note !== null && c.note >= d.seuil);
                return (
                  <tr key={`${c.intitule}-${i}`}>
                    <td className={cn(T.td, "text-pierre-500")}>{i + 1}</td>
                    <td className={T.td}>{c.intitule}</td>
                    <td className={cn(T.td, T.centre)}>{c.credits}</td>
                    <td className={cn(T.td, T.droite, "font-medium")}>{note(c.note)}</td>
                    <td className={cn(T.td, T.centre)}>
                      <Resultat valide={valide} present={c.note !== null} />
                    </td>
                  </tr>
                );
              })}
              <tr className={T.total}>
                <td className={T.td} />
                <td className={cn(T.td, "text-[7pt] tracking-[0.1em] uppercase")}>
                  Moyenne du semestre{s.mention ? ` · mention ${s.mention}` : ""}
                </td>
                <td className={cn(T.td, T.centre)}>
                  {s.creditsAcquis}/{s.creditsTotal}
                </td>
                <td className={cn(T.td, T.droite)}>{note(s.moyenne)}</td>
                <td className={T.td} />
              </tr>
            </tbody>
          </table>
        </section>
      ))}
      {r && (
        <Synthese
          className="mt-6 break-inside-avoid"
          elements={[
            {
              libelle: r.periode,
              valeur: r.moyenne === null ? "—" : note(r.moyenne),
              detail: "Moyenne sur 20",
              accent: true,
            },
            { libelle: "Mention", valeur: r.mention?.lettre ?? "—", detail: r.mention?.libelle },
            { libelle: "Crédits validés", valeur: `${r.creditsValides}/${r.creditsTotal}` },
            ...(r.decision
              ? [
                  {
                    libelle: "Décision du jury",
                    valeur: r.decision.code,
                    detail: r.decision.libelle,
                  },
                ]
              : []),
          ]}
        />
      )}
      <p className="mt-2.5 text-[7pt] text-pierre-600">
        Cours validé à partir de {nombre(d.seuil)}/20.
        {r && ` Résultats proclamés par le jury le ${jour(r.proclameLe)}.`}
      </p>
    </>
  );
}

/* Bulletin ------------------------------------------------------------------------ */

function CorpsBulletin({ d }: { d: DonneesDocument }) {
  const b = d.bulletin!;
  return (
    <>
      {b.semestres.map((s) => (
        <section key={s.numero} className="mt-5 break-inside-avoid">
          <Rubrique titre={`Semestre ${s.numero}`} complement={`${s.creditsTotal} crédits`} />
          <table className={cn(T.tableau, "mt-2")}>
            <thead>
              <tr>
                <th className={cn(T.th, "w-[20mm]")}>UE</th>
                <th className={T.th}>Cours</th>
                <th className={cn(T.th, T.centre, "w-14")}>Crédits</th>
                <th className={cn(T.th, T.droite, "w-18")}>Note /20</th>
                <th className={cn(T.th, T.centre, "w-24")}>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {s.cours.map((c, i) => (
                <tr key={`${c.intitule}-${i}`}>
                  <td className={cn(T.td, "font-mono text-[7.5pt] text-pierre-600")}>
                    {c.ue.split(" — ")[0]}
                  </td>
                  <td className={T.td}>{c.intitule}</td>
                  <td className={cn(T.td, T.centre)}>{c.credits}</td>
                  <td className={cn(T.td, T.droite, "font-medium")}>{note(c.note)}</td>
                  <td className={cn(T.td, T.centre)}>
                    <Resultat valide={c.valide} present={c.note !== null} />
                  </td>
                </tr>
              ))}
              <tr className={T.total}>
                <td className={T.td} />
                <td className={cn(T.td, "text-[7pt] tracking-[0.1em] uppercase")}>
                  Moyenne du semestre{s.mention ? ` · mention ${s.mention}` : ""}
                </td>
                <td className={cn(T.td, T.centre)}>
                  {s.creditsValides}/{s.creditsTotal}
                </td>
                <td className={cn(T.td, T.droite)}>{note(s.moyenne)}</td>
                <td className={T.td} />
              </tr>
            </tbody>
          </table>
        </section>
      ))}
      <Synthese
        className="mt-6 break-inside-avoid"
        elements={[
          {
            libelle: b.annuel ? "Moyenne annuelle" : "Moyenne du semestre",
            valeur: b.moyenne === null ? "—" : note(b.moyenne),
            detail: "sur 20",
            accent: true,
          },
          { libelle: "Mention", valeur: b.mention?.lettre ?? "—", detail: b.mention?.libelle },
          { libelle: "Crédits validés", valeur: `${b.creditsValides}/${b.creditsTotal}` },
          {
            libelle: "Rang",
            valeur: b.rang ?? "—",
            detail: b.rang ? `sur ${b.effectif}` : undefined,
          },
          ...(b.decision
            ? [{ libelle: "Décision du jury", valeur: b.decision.code, detail: b.decision.libelle }]
            : []),
        ]}
      />
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[6.5pt] text-pierre-600">
        <span>
          Validation à {nombre(b.reglement.seuil)}/20 · {b.reglement.calcul} · arrondi :{" "}
          {b.reglement.arrondi.toLowerCase()}.
        </span>
        <span className="flex flex-wrap gap-x-2.5">
          {b.echelle.map((m) => (
            <span key={m.lettre}>
              <strong className="font-semibold text-encre">{m.lettre}</strong> {m.libelle} ≥{" "}
              {nombre(m.seuil)}
            </span>
          ))}
        </span>
      </div>
    </>
  );
}

function Resultat({ valide, present }: { valide: boolean; present: boolean }) {
  if (!present) return <span className="text-[7.5pt] text-pierre-500 italic">Non présenté</span>;
  return valide ? (
    <span className="text-[7.5pt] font-semibold tracking-[0.06em] text-encre uppercase">
      Validé
    </span>
  ) : (
    <span className="text-[7.5pt] tracking-[0.06em] text-pierre-600 uppercase">Non validé</span>
  );
}
