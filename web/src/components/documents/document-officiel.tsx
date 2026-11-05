import { Blason } from "@/components/marque/blason";
import { formatJour } from "@/features/actualites/dates";
import {
  civilite,
  type DonneesDocument,
  LIBELLES_DOCUMENT,
  type TypeDocument,
} from "@/features/documents/regles";
import type { Institut } from "@/features/contenu/lecture";
import type { ReglagesDocuments } from "@/features/contenu/reglages";

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

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
  const ne = d.sexe === "F" ? "née" : "né";
  const inscrit = d.sexe === "F" ? "inscrite" : "inscrit";
  const naissance = d.dateNaissance
    ? `, ${ne} le ${formatJour.format(new Date(`${d.dateNaissance}T12:00:00Z`))}${d.lieuNaissance ? ` à ${d.lieuNaissance}` : ""}`
    : "";
  const totalAcquis = d.semestres?.reduce((t, s) => t + s.creditsAcquis, 0) ?? 0;
  const totalCredits = d.semestres?.reduce((t, s) => t + s.creditsTotal, 0) ?? 0;

  return (
    <article className="document-a4 relative mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white px-[18mm] py-[16mm] text-[11pt] leading-relaxed text-black print:shadow-none">
      {revoque && (
        <p className="absolute inset-x-[18mm] top-[8mm] border-2 border-erreur py-1 text-center text-sm font-bold text-erreur uppercase">
          Document révoqué : {revoque}
        </p>
      )}
      <header className="flex items-center gap-5 border-b-2 border-encre pb-4">
        <Blason hauteur={90} decoratif />
        <div className="flex-1 text-center leading-tight">
          <p className="font-sans text-[10pt] font-bold uppercase">{parametres.entete}</p>
          <p className="font-sans text-[12pt] font-bold">{institut.nom}</p>
          <p className="font-sans text-[10pt] font-bold">{institut.sigle.toUpperCase()}</p>
          <p className="font-sans text-[9pt]">
            {institut.rue}, {institut.ville} · {institut.boitePostale} · {institut.email}
          </p>
        </div>
      </header>

      <h1 className="mt-8 text-center font-sans text-[16pt] font-bold tracking-wide uppercase">
        {LIBELLES_DOCUMENT[type]}
      </h1>
      {d.bulletin && (
        <p className="text-center font-sans text-[11pt]">
          {d.bulletin.periode} · Année académique {d.annee}
        </p>
      )}
      <p className="text-center font-mono text-[9pt] text-pierre-700">N° {code}</p>

      <div className="mt-8 flex-1">
        {type === "ATTESTATION_FREQUENTATION" && (
          <p className="text-justify">
            Il est attesté que {civilite(d.sexe)} <strong>{d.nom}</strong>, matricule{" "}
            <strong>{d.matricule}</strong>
            {naissance}, est régulièrement {inscrit} en <strong>{d.niveau}</strong>, filière{" "}
            <strong>{d.filiere}</strong>, pour l&apos;année académique <strong>{d.annee}</strong>.
          </p>
        )}
        {type === "ATTESTATION_REUSSITE" && d.resultat && (
          <p className="text-justify">
            Il est attesté que {civilite(d.sexe)} <strong>{d.nom}</strong>, matricule{" "}
            <strong>{d.matricule}</strong>
            {naissance}, {inscrit} en {d.niveau}, filière {d.filiere}, pour l&apos;année académique{" "}
            {d.annee}, a obtenu une moyenne annuelle de{" "}
            <strong>{d.resultat.moyenne === null ? "—" : `${fmt(d.resultat.moyenne)}/20`}</strong>
            {d.resultat.mention ? `, mention ${d.resultat.mention.libelle}` : ""}, et validé{" "}
            <strong>
              {d.resultat.creditsValides} crédits sur {d.resultat.creditsTotal}
            </strong>
            . Décision du jury, proclamée le {formatJour.format(new Date(d.resultat.proclameLe))} :{" "}
            <strong>{d.resultat.decision?.libelle ?? "—"}</strong>.
          </p>
        )}
        {type === "ATTESTATION_REUSSITE" && !d.resultat && (
          <p className="text-justify">
            Il est attesté que {civilite(d.sexe)} <strong>{d.nom}</strong>, matricule{" "}
            <strong>{d.matricule}</strong>
            {naissance}, {inscrit} en {d.niveau}, filière {d.filiere}, a acquis{" "}
            <strong>
              {totalAcquis} crédits sur {totalCredits}
            </strong>{" "}
            au cours de l&apos;année académique {d.annee}
            {d.semestres?.length
              ? `, avec ${d.semestres
                  .filter((s) => s.moyenne !== null)
                  .map((s) => `une moyenne de ${fmt(s.moyenne!)}/20 au semestre ${s.numero}`)
                  .join(" et ")}`
              : ""}
            .
          </p>
        )}
        {type === "BULLETIN" && d.bulletin && <Bulletin d={d} />}
        {type === "RELEVE_NOTES" && (
          <>
            <dl className="grid grid-cols-[9rem_1fr] gap-y-1 text-[10pt]">
              <dt>Nom</dt>
              <dd className="font-semibold">{d.nom}</dd>
              <dt>Matricule</dt>
              <dd>{d.matricule}</dd>
              <dt>Promotion</dt>
              <dd>
                {d.niveau} · {d.filiere}
              </dd>
              <dt>Année académique</dt>
              <dd>{d.annee}</dd>
            </dl>
            {(d.semestres ?? []).map((s) => (
              <table key={s.numero} className="mt-6 w-full border-collapse text-[10pt]">
                <caption className="pb-1 text-left font-sans font-bold">
                  Semestre {s.numero}
                </caption>
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-1 text-left">Cours</th>
                    <th className="w-20 border border-black px-2 py-1">Crédits</th>
                    <th className="w-24 border border-black px-2 py-1">Note /20</th>
                    <th className="w-24 border border-black px-2 py-1">Décision</th>
                  </tr>
                </thead>
                <tbody>
                  {s.cours.map((c) => (
                    <tr key={c.intitule}>
                      <td className="border border-black px-2 py-1">{c.intitule}</td>
                      <td className="border border-black px-2 py-1 text-center">{c.credits}</td>
                      <td className="border border-black px-2 py-1 text-center">
                        {c.note === null ? "—" : fmt(c.note)}
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        {(c.valide ?? (c.note !== null && c.note >= d.seuil))
                          ? "Validé"
                          : c.note === null
                            ? "—"
                            : "Non validé"}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="border border-black px-2 py-1 text-right">
                      Moyenne et crédits acquis
                    </td>
                    <td className="border border-black px-2 py-1 text-center">
                      {s.creditsAcquis}/{s.creditsTotal}
                    </td>
                    <td className="border border-black px-2 py-1 text-center">
                      {s.moyenne === null ? "—" : fmt(s.moyenne)}
                    </td>
                    <td className="border border-black px-2 py-1" />
                  </tr>
                </tbody>
              </table>
            ))}
            {d.resultat && (
              <p className="mt-5 text-[10pt]">
                {d.resultat.periode} : moyenne{" "}
                <strong>
                  {d.resultat.moyenne === null ? "—" : `${fmt(d.resultat.moyenne)}/20`}
                </strong>
                {d.resultat.mention
                  ? ` (${d.resultat.mention.lettre} · ${d.resultat.mention.libelle})`
                  : ""}
                , {d.resultat.creditsValides} crédits validés sur {d.resultat.creditsTotal}
                {d.resultat.decision ? (
                  <>
                    {" "}
                    · décision du jury : <strong>{d.resultat.decision.libelle}</strong>
                  </>
                ) : null}
                .
              </p>
            )}
            <p className="mt-3 text-[9pt]">
              Seuil de validation d&apos;un cours : {fmt(d.seuil)}/20.
              {d.resultat &&
                ` Résultats proclamés par le jury le ${formatJour.format(new Date(d.resultat.proclameLe))}.`}
            </p>
          </>
        )}
        {type !== "RELEVE_NOTES" && type !== "BULLETIN" && (
          <p className="mt-6">{parametres.formuleFinale}</p>
        )}
      </div>

      <footer className="mt-10 flex items-end justify-between gap-8">
        <div className="flex items-end gap-3">
          <div
            className="size-[28mm] shrink-0 [&_svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="max-w-[60mm] text-[8pt] leading-snug text-pierre-700">
            Vérifiez l&apos;authenticité de ce document en scannant le code ou sur{" "}
            <span className="font-mono">{urlVerification}</span>
          </p>
        </div>
        <div className={`text-center text-[10pt] ${d.bulletin ? "min-w-[100mm]" : ""}`}>
          <p>
            Fait à {institut.ville}, le {formatJour.format(emisLe)}
          </p>
          {d.bulletin ? (
            <div className="mt-2 grid grid-cols-2 gap-6">
              <div>
                <p className="font-semibold">Le Secrétaire du jury</p>
                <div className="h-[16mm]" />
                <p className="font-semibold">{d.bulletin.jury.secretaire}</p>
              </div>
              <div>
                <p className="font-semibold">Le Président du jury</p>
                <div className="h-[16mm]" />
                <p className="font-semibold">{d.bulletin.jury.president}</p>
              </div>
            </div>
          ) : (
            signataire && (
              <>
                <p className="mt-1 font-semibold">{signataire.fonction}</p>
                <div className="h-[22mm]" />
                <p className="font-semibold">{signataire.nom}</p>
              </>
            )
          )}
        </div>
      </footer>
      {parametres.mentionPied && (
        <p className="mt-6 border-t border-pierre-300 pt-2 text-center text-[8pt] text-pierre-700">
          {parametres.mentionPied}
        </p>
      )}
    </article>
  );
}

/** Corps d'un bulletin issu d'une délibération proclamée. */
function Bulletin({ d }: { d: DonneesDocument }) {
  const b = d.bulletin!;
  const cellule = "border border-black px-1.5 py-[3px]";
  return (
    <div className="text-[9pt] leading-snug">
      <dl className="grid grid-cols-[7rem_1fr_7rem_1fr] gap-y-0.5 text-[9.5pt]">
        <dt>Nom</dt>
        <dd className="font-semibold">{d.nom}</dd>
        <dt>Matricule</dt>
        <dd className="font-mono">{d.matricule}</dd>
        <dt>Promotion</dt>
        <dd>{d.niveau}</dd>
        <dt>Option</dt>
        <dd>{d.filiere}</dd>
      </dl>
      {b.semestres.map((s) => (
        <table key={s.numero} className="mt-4 w-full border-collapse">
          <caption className="pb-1 text-left font-sans text-[9.5pt] font-bold">
            Semestre {s.numero}
          </caption>
          <thead>
            <tr className="bg-pierre-100">
              <th className={`${cellule} text-left`}>Cours</th>
              <th className={`${cellule} w-14`}>Crédits</th>
              <th className={`${cellule} w-16`}>Note /20</th>
              <th className={`${cellule} w-20`}>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {s.cours.map((c, i) => (
              <tr key={`${c.intitule}-${i}`}>
                <td className={cellule}>{c.intitule}</td>
                <td className={`${cellule} text-center`}>{c.credits}</td>
                <td className={`${cellule} text-center`}>{c.note === null ? "—" : fmt(c.note)}</td>
                <td className={`${cellule} text-center`}>
                  {c.note === null ? "Non présenté" : c.valide ? "Validé" : "Non validé"}
                </td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className={`${cellule} text-right`}>
                Moyenne{s.mention ? ` (mention ${s.mention})` : ""} et crédits validés
              </td>
              <td className={`${cellule} text-center`}>
                {s.creditsValides}/{s.creditsTotal}
              </td>
              <td className={`${cellule} text-center`}>
                {s.moyenne === null ? "—" : fmt(s.moyenne)}
              </td>
              <td className={cellule} />
            </tr>
          </tbody>
        </table>
      ))}
      <div className="mt-4 grid grid-cols-2 gap-4 border border-black p-3 text-[9.5pt]">
        <p>
          {b.annuel ? "Moyenne annuelle" : "Moyenne du semestre"} :{" "}
          <strong>{b.moyenne === null ? "—" : `${fmt(b.moyenne)}/20`}</strong>
        </p>
        <p>
          Crédits validés :{" "}
          <strong>
            {b.creditsValides} / {b.creditsTotal}
          </strong>
        </p>
        <p>
          Mention :{" "}
          <strong>{b.mention ? `${b.mention.lettre} – ${b.mention.libelle}` : "—"}</strong>
        </p>
        <p>
          Rang : <strong>{b.rang ? `${b.rang} sur ${b.effectif}` : "—"}</strong>
        </p>
        {b.decision && (
          <p className="col-span-2 text-[10.5pt]">
            Décision du jury :{" "}
            <strong>
              {b.decision.code} – {b.decision.libelle}
            </strong>
          </p>
        )}
      </div>
      <p className="mt-2 text-[7.5pt] text-pierre-700">
        Cours validé à partir de {fmt(b.reglement.seuil)}/20 · {b.reglement.calcul} · arrondi :{" "}
        {b.reglement.arrondi.toLowerCase()} · échelle :{" "}
        {b.echelle.map((m) => `${m.lettre} ${m.libelle} (≥ ${fmt(m.seuil)})`).join(", ")}.
      </p>
    </div>
  );
}
