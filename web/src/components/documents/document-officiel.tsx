import { Blason } from "@/components/marque/blason";
import { formatJour } from "@/features/actualites/dates";
import {
  civilite,
  type DonneesDocument,
  LIBELLES_DOCUMENT,
  type TypeDocument,
} from "@/features/documents/regles";
import type { Institut } from "@/features/contenu/lecture";

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
          <p className="font-sans text-[10pt] font-bold uppercase">
            Enseignement supérieur et universitaire
          </p>
          <p className="font-sans text-[12pt] font-bold">{institut.nom}</p>
          <p className="font-sans text-[10pt] font-bold">{institut.sigle.toUpperCase()}</p>
          <p className="font-sans text-[9pt]">
            {institut.rue}, {institut.ville} · {institut.boitePostale} · {institut.email}
          </p>
        </div>
      </header>

      <h1 className="mt-10 text-center font-sans text-[16pt] font-bold tracking-wide uppercase">
        {LIBELLES_DOCUMENT[type]}
      </h1>
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
        {type === "ATTESTATION_REUSSITE" && (
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
                        {c.note === null ? "—" : c.note >= d.seuil ? "Validé" : "Non validé"}
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
            <p className="mt-3 text-[9pt]">
              Seuil de validation d&apos;un cours : {fmt(d.seuil)}/20.
            </p>
          </>
        )}
        {type !== "RELEVE_NOTES" && (
          <p className="mt-6">
            En foi de quoi, le présent document lui est délivré pour servir et valoir ce que de
            droit.
          </p>
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
        <div className="text-center text-[10pt]">
          <p>
            Fait à {institut.ville}, le {formatJour.format(emisLe)}
          </p>
          {signataire && (
            <>
              <p className="mt-1 font-semibold">{signataire.fonction}</p>
              <div className="h-[22mm]" />
              <p className="font-semibold">{signataire.nom}</p>
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
