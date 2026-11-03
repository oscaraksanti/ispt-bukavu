import { Check, Eye, FileText } from "lucide-react";
import type { Metadata } from "next";
import { BoutonAction } from "@/components/admin/bouton-action";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { DepotPiece } from "@/components/candidat/depot-piece";
import { Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { Encadre, Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { dossierDuCandidat, exigerCandidat } from "@/features/admissions/acces";
import {
  enregistrerDossier,
  retirerPiece,
  soumettreDossier,
} from "@/features/admissions/actions-candidat";
import {
  dossierModifiable,
  elementsManquants,
  LIBELLES_STATUT,
  type Statut,
  TON_STATUT,
} from "@/features/admissions/regles";
import { cn } from "@/lib/cn";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Mon dossier" };

const LIBELLES_PIECE = {
  DEPOSEE: { texte: "Déposée", ton: "ispt" },
  ACCEPTEE: { texte: "Vérifiée", ton: "succes" },
  REJETEE: { texte: "À remplacer", ton: "erreur" },
} as const;

function Etape({ numero, titre, faite }: { numero: number; titre: string; faite: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
          faite
            ? "border-succes bg-succes text-white"
            : "border-pierre-300 bg-white text-pierre-600",
        )}
      >
        {faite ? <Check aria-hidden className="size-4" /> : numero}
      </span>
      <span className={cn("text-sm", faite ? "text-pierre-900" : "text-pierre-600")}>
        {titre}
        <span className="sr-only">{faite ? " : fait" : " : à faire"}</span>
      </span>
    </li>
  );
}

function Section({
  numero,
  titre,
  description,
  children,
}: {
  numero: string;
  titre: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-pierre-200 bg-white">
      <div className="border-b border-pierre-200 px-5 py-4 sm:px-7">
        <p className="font-mono text-xs text-ispt-600">{numero}</p>
        <h2 className="mt-1 text-2xl">{titre}</h2>
        {description && <p className="mt-1 text-sm text-pierre-600">{description}</p>}
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

export default async function MonDossier() {
  const u = await exigerCandidat();
  const d = await dossierDuCandidat(u.id);
  if (!d)
    return (
      <EtatVide
        titre="Aucun dossier"
        description="Votre compte n'est rattaché à aucune candidature. Contactez le secrétariat."
      />
    );

  const statut = d.statut as Statut;
  const modifiable = dossierModifiable(statut);
  const manquants = elementsManquants(d, d.campagne.pieces, d.pieces);
  const piecesManquantes = d.campagne.pieces.filter(
    (p) =>
      p.obligatoire && !d.pieces.some((x) => x.pieceExigeeId === p.id && x.statut !== "REJETEE"),
  );
  const infosCompletes = manquants.length === piecesManquantes.length;
  const dernierMessage = [...d.historique].reverse().find((h) => h.commentaire)?.commentaire;
  const valeurDate = d.dateNaissance?.toISOString().slice(0, 10) ?? "";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="surtitre">{d.campagne.libelle}</p>
          <h1 className="mt-3 text-[2.25rem] leading-tight sm:text-5xl">Dossier n° {d.numero}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-pierre-700">
            <Etiquette ton={TON_STATUT[statut]}>{LIBELLES_STATUT[statut]}</Etiquette>
            {statut === "BROUILLON" && (
              <span className="text-sm">
                À déposer avant le {formatJour.format(d.campagne.cloture)}
              </span>
            )}
          </p>
        </div>
        {modifiable && (
          <ol className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Avancement du dossier">
            <Etape numero={1} titre="Informations" faite={infosCompletes} />
            <Etape numero={2} titre="Pièces" faite={piecesManquantes.length === 0} />
            <Etape numero={3} titre="Dépôt" faite={false} />
          </ol>
        )}
      </header>

      {statut === "COMPLEMENT" && dernierMessage && (
        <Encadre ton="attention" titre="Le secrétariat demande un complément">
          <span className="whitespace-pre-line">{dernierMessage}</span>
        </Encadre>
      )}
      {statut === "ADMISE" && (
        <Encadre ton="succes" titre="Votre candidature est retenue">
          Le secrétariat vous indiquera par email les modalités d&apos;inscription.
          {d.motifDecision && <span className="mt-2 block">{d.motifDecision}</span>}
        </Encadre>
      )}
      {statut === "REFUSEE" && (
        <Encadre ton="erreur" titre="Votre candidature n'a pas été retenue">
          {d.motifDecision}
        </Encadre>
      )}

      {modifiable ? (
        <>
          <Section
            numero="Étape 1"
            titre="Vos informations"
            description="Enregistrez à tout moment ; vous pourrez compléter plus tard."
          >
            <FormulaireAction action={enregistrerDossier} libelleEnvoi="Enregistrer">
              <fieldset className="space-y-5">
                <legend className="font-sans text-sm font-semibold text-encre">Identité</legend>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Champ id="nom" libelle="Nom">
                    <Saisie id="nom" name="nom" defaultValue={d.nom ?? ""} maxLength={80} />
                  </Champ>
                  <Champ id="postnom" libelle="Postnom">
                    <Saisie
                      id="postnom"
                      name="postnom"
                      defaultValue={d.postnom ?? ""}
                      maxLength={80}
                    />
                  </Champ>
                  <Champ id="prenom" libelle="Prénom">
                    <Saisie
                      id="prenom"
                      name="prenom"
                      defaultValue={d.prenom ?? ""}
                      maxLength={80}
                    />
                  </Champ>
                  <Champ id="sexe" libelle="Sexe">
                    <Liste id="sexe" name="sexe" defaultValue={d.sexe ?? ""}>
                      <option value="">—</option>
                      <option value="F">Féminin</option>
                      <option value="M">Masculin</option>
                    </Liste>
                  </Champ>
                  <Champ id="dateNaissance" libelle="Date de naissance">
                    <Saisie
                      id="dateNaissance"
                      name="dateNaissance"
                      type="date"
                      defaultValue={valeurDate}
                    />
                  </Champ>
                  <Champ id="lieuNaissance" libelle="Lieu de naissance">
                    <Saisie
                      id="lieuNaissance"
                      name="lieuNaissance"
                      defaultValue={d.lieuNaissance ?? ""}
                      maxLength={120}
                    />
                  </Champ>
                  <Champ id="nationalite" libelle="Nationalité">
                    <Saisie
                      id="nationalite"
                      name="nationalite"
                      defaultValue={d.nationalite ?? "Congolaise"}
                      maxLength={80}
                    />
                  </Champ>
                  <Champ id="telephone" libelle="Téléphone">
                    <Saisie
                      id="telephone"
                      name="telephone"
                      type="tel"
                      defaultValue={d.telephone ?? ""}
                      maxLength={30}
                    />
                  </Champ>
                </div>
                <Champ id="adresse" libelle="Adresse (avenue, quartier, commune, ville)">
                  <ZoneTexte
                    id="adresse"
                    name="adresse"
                    rows={2}
                    defaultValue={d.adresse ?? ""}
                    maxLength={240}
                  />
                </Champ>
              </fieldset>
              <fieldset className="space-y-5 border-t border-pierre-200 pt-6">
                <legend className="font-sans text-sm font-semibold text-encre">
                  Études secondaires
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Champ id="ecoleOrigine" libelle="École d'origine">
                    <Saisie
                      id="ecoleOrigine"
                      name="ecoleOrigine"
                      defaultValue={d.ecoleOrigine ?? ""}
                      maxLength={160}
                    />
                  </Champ>
                  <Champ id="sectionHumanites" libelle="Section (option) des humanités">
                    <Saisie
                      id="sectionHumanites"
                      name="sectionHumanites"
                      defaultValue={d.sectionHumanites ?? ""}
                      maxLength={120}
                    />
                  </Champ>
                  <Champ id="anneeDiplome" libelle="Année du diplôme d'État">
                    <Saisie
                      id="anneeDiplome"
                      name="anneeDiplome"
                      inputMode="numeric"
                      placeholder="2025"
                      defaultValue={d.anneeDiplome ?? ""}
                      maxLength={4}
                    />
                  </Champ>
                  <Champ id="pourcentage" libelle="Pourcentage obtenu (facultatif)">
                    <Saisie
                      id="pourcentage"
                      name="pourcentage"
                      inputMode="decimal"
                      placeholder="62"
                      defaultValue={d.pourcentage?.toString() ?? ""}
                      maxLength={6}
                    />
                  </Champ>
                </div>
              </fieldset>
              <fieldset className="space-y-5 border-t border-pierre-200 pt-6">
                <legend className="font-sans text-sm font-semibold text-encre">
                  Filière et frais
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Champ id="filiereId" libelle="Filière choisie">
                    <Liste id="filiereId" name="filiereId" defaultValue={d.filiereId ?? ""}>
                      <option value="">Choisir…</option>
                      {d.campagne.filieres.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom}
                        </option>
                      ))}
                    </Liste>
                  </Champ>
                  <Champ
                    id="referencePaiement"
                    libelle="Référence du paiement des frais"
                    aide={`Frais d'inscription : ${Number(d.campagne.fraisInscription).toLocaleString("fr-FR")} ${d.campagne.devise === "USD" ? "$" : "FC"}. Numéro du bordereau ou du reçu.`}
                  >
                    <Saisie
                      id="referencePaiement"
                      name="referencePaiement"
                      defaultValue={d.referencePaiement ?? ""}
                      maxLength={80}
                      aria-describedby="referencePaiement-aide"
                    />
                  </Champ>
                </div>
              </fieldset>
            </FormulaireAction>
          </Section>

          <Section
            numero="Étape 2"
            titre="Vos pièces"
            description="Une photo nette prise au téléphone suffit. Formats acceptés : photo ou PDF, 4 Mo au plus."
          >
            <ul className="divide-y divide-pierre-200">
              {d.campagne.pieces.map((p) => {
                const depot = d.pieces.find((x) => x.pieceExigeeId === p.id);
                const etat = depot ? LIBELLES_PIECE[depot.statut] : null;
                return (
                  <li key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                    <FileText
                      aria-hidden
                      className="hidden size-5 shrink-0 text-pierre-400 sm:block"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-pierre-900">
                        {p.libelle}
                        {!p.obligatoire && <span className="text-pierre-500"> (facultatif)</span>}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        {etat ? (
                          <Etiquette ton={etat.ton}>{etat.texte}</Etiquette>
                        ) : (
                          <span className="text-pierre-500">Pas encore déposée</span>
                        )}
                        {depot && (
                          <a
                            href={`/pieces/${depot.id}`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 text-ispt-600 underline hover:no-underline"
                          >
                            <Eye aria-hidden className="size-3.5" /> Voir
                          </a>
                        )}
                      </p>
                      {depot?.statut === "REJETEE" && depot.commentaire && (
                        <p className="mt-1 text-sm text-erreur">{depot.commentaire}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {depot && depot.statut !== "ACCEPTEE" && (
                        <BoutonAction
                          action={retirerPiece.bind(null, p.id)}
                          variante="fantome"
                          confirmation="Retirer ?"
                        >
                          Retirer
                        </BoutonAction>
                      )}
                      {depot?.statut !== "ACCEPTEE" && (
                        <DepotPiece pieceExigeeId={p.id} libelle={p.libelle} remplacer={!!depot} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section numero="Étape 3" titre="Déposer le dossier">
            {manquants.length > 0 ? (
              <div>
                <p className="text-pierre-700">Il reste à compléter :</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {manquants.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-sm text-pierre-800">
                      <span aria-hidden className="size-1.5 rounded-full bg-attention" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-pierre-700">
                  Votre dossier est complet. Une fois déposé, il ne pourra plus être modifié sauf
                  demande du secrétariat.
                </p>
                <BoutonAction
                  action={soumettreDossier}
                  variante="institutionnel"
                  taille="md"
                  confirmation="Déposer définitivement ?"
                >
                  Déposer mon dossier
                </BoutonAction>
              </div>
            )}
          </Section>
        </>
      ) : (
        <div className="grid gap-8 lg:grid-cols-5">
          <section className="rounded-md border border-pierre-200 bg-white p-6 lg:col-span-3">
            <h2 className="text-2xl">Votre dossier</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {[
                ["Nom complet", [d.prenom, d.nom, d.postnom].filter(Boolean).join(" ")],
                ["Filière", d.filiere?.nom ?? "—"],
                ["École d'origine", d.ecoleOrigine],
                ["Section", d.sectionHumanites],
                ["Diplôme d'État", d.anneeDiplome?.toString()],
                ["Paiement", d.referencePaiement],
              ].map(([cle, valeur]) => (
                <div key={cle}>
                  <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">
                    {cle}
                  </dt>
                  <dd className="mt-1 text-pierre-900">{valeur || "—"}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-8 font-sans text-sm font-semibold text-encre">Pièces déposées</h3>
            <ul className="mt-3 divide-y divide-pierre-200 border-y border-pierre-200">
              {d.pieces.map((p) => {
                const exigee = d.campagne.pieces.find((x) => x.id === p.pieceExigeeId);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <a
                      href={`/pieces/${p.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-ispt-600 underline hover:no-underline"
                    >
                      {exigee?.libelle}
                    </a>
                    <Etiquette ton={LIBELLES_PIECE[p.statut].ton}>
                      {LIBELLES_PIECE[p.statut].texte}
                    </Etiquette>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="lg:col-span-2">
            <h2 className="text-2xl">Suivi</h2>
            <ol className="relative mt-5 border-l border-pierre-300">
              {d.historique.map((h) => (
                <li key={h.id} className="relative pb-6 pl-6 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[5px] size-[9px] rounded-full bg-ispt-600 ring-4 ring-papier"
                  />
                  <p className="text-pierre-900">{LIBELLES_STATUT[h.statut as Statut]}</p>
                  <p className="font-mono text-xs text-pierre-500">{formatJour.format(h.creeLe)}</p>
                  {h.commentaire && <p className="mt-1 text-sm text-pierre-700">{h.commentaire}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
