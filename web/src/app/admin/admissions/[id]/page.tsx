import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { formatHeure, formatJour } from "@/features/actualites/dates";
import { inscrireAdmis } from "@/features/academique/actions-etudiants";
import { deciderCandidature, statuerPiece } from "@/features/admissions/actions-admin";
import {
  DECISIONS,
  elementsManquants,
  etatPaiement,
  fraisExiges,
  LIBELLES_STATUT,
  type Statut,
  TON_STATUT,
} from "@/features/admissions/regles";
import { formatMontant } from "@/features/finances/regles";
import { PaiementDossier } from "@/components/admin/paiement-dossier";
import { aPermission, exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Dossier de candidature" };

const ETAT_PIECE = {
  DEPOSEE: { texte: "À vérifier", ton: "attention" },
  ACCEPTEE: { texte: "Vérifiée", ton: "succes" },
  REJETEE: { texte: "Refusée", ton: "erreur" },
} as const;

const LIBELLES_DECISION: Partial<Record<Statut, string>> = {
  EN_EXAMEN: "Mettre en examen",
  COMPLEMENT: "Demander un complément",
  ADMISE: "Admettre",
  REFUSEE: "Ne pas retenir",
  INSCRITE: "Confirmer l'inscription",
};

export default async function Dossier({ params }: PageProps<"/admin/admissions/[id]">) {
  const u = await exigerPermission("admissions.consulter");
  const { id } = await params;
  const d = await db.candidature.findUnique({
    where: { id },
    include: {
      campagne: { include: { pieces: { orderBy: { ordre: "asc" } } } },
      filiere: true,
      candidat: { select: { email: true, emailVerifieLe: true } },
      pieces: { include: { media: true } },
      historique: { orderBy: { creeLe: "asc" } },
      decidePar: { select: { prenom: true, nom: true } },
    },
  });
  if (!d) notFound();
  const statut = d.statut as Statut;
  const peutDecider = aPermission(u, "admissions.decider");
  const decisions = DECISIONS[statut];
  const avecFrais = fraisExiges(d.campagne);
  const paiement = etatPaiement(d, avecFrais);
  const manquants = elementsManquants(d, d.campagne.pieces, d.pieces, { fraisExiges: avecFrais });
  const peutEncaisser = aPermission(u, "finances.encaisser");
  const auteurs = await db.utilisateur.findMany({
    where: { id: { in: d.historique.map((h) => h.auteurId).filter((x): x is string => !!x) } },
    select: { id: true, prenom: true, nom: true },
  });
  const nomAuteur = (aid: string | null) => {
    if (aid === d.candidatId) return "Candidat";
    const a = auteurs.find((x) => x.id === aid);
    return a ? [a.prenom, a.nom].filter(Boolean).join(" ") : "Système";
  };

  const identite: [string, string | null | undefined][] = [
    ["Nom complet", [d.prenom, d.nom, d.postnom].filter(Boolean).join(" ")],
    ["Sexe", d.sexe === "F" ? "Féminin" : d.sexe === "M" ? "Masculin" : null],
    [
      "Naissance",
      d.dateNaissance
        ? `${formatJour.format(d.dateNaissance)}${d.lieuNaissance ? `, ${d.lieuNaissance}` : ""}`
        : null,
    ],
    ["Nationalité", d.nationalite],
    ["Téléphone", d.telephone],
    [
      "Email",
      d.candidat.email
        ? `${d.candidat.email}${d.candidat.emailVerifieLe ? " (confirmée)" : " (non confirmée)"}`
        : null,
    ],
    ["Adresse", d.adresse],
  ];
  const etudes: [string, string | null | undefined][] = [
    ["École d'origine", d.ecoleOrigine],
    ["Section", d.sectionHumanites],
    ["Diplôme d'État", d.anneeDiplome?.toString()],
    ["Pourcentage", d.pourcentage ? `${d.pourcentage} %` : null],
    ["Filière choisie", d.filiere?.nom],
  ];

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Candidatures", href: `/admin/admissions?campagne=${d.campagneId}` },
          { libelle: d.numero },
        ]}
        titre={`Dossier n° ${d.numero}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Etiquette ton={TON_STATUT[statut]}>{LIBELLES_STATUT[statut]}</Etiquette>
            {d.soumiseLe && <span>déposé le {formatJour.format(d.soumiseLe)}</span>}
          </span>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panneau titre="Candidat">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {[...identite, ...etudes].map(([cle, valeur]) => (
                <div key={cle}>
                  <dt className="font-mono text-xs tracking-wide text-pierre-500 uppercase">
                    {cle}
                  </dt>
                  <dd className="mt-1 [overflow-wrap:anywhere] text-pierre-900">{valeur || "—"}</dd>
                </div>
              ))}
            </dl>
          </Panneau>

          <Panneau
            titre="Pièces justificatives"
            description="Ouvrez chaque pièce, puis marquez-la vérifiée ou refusée en expliquant pourquoi."
          >
            <ul className="-my-3 divide-y divide-pierre-200">
              {d.campagne.pieces.map((p) => {
                const depot = d.pieces.find((x) => x.pieceExigeeId === p.id);
                return (
                  <li key={p.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-pierre-900">
                          {p.libelle}
                          {!p.obligatoire && <span className="text-pierre-500"> (facultatif)</span>}
                        </p>
                        {depot?.commentaire && (
                          <p className="mt-1 text-sm text-erreur">{depot.commentaire}</p>
                        )}
                      </div>
                      {depot ? (
                        <div className="flex items-center gap-3">
                          <Etiquette ton={ETAT_PIECE[depot.statut].ton}>
                            {ETAT_PIECE[depot.statut].texte}
                          </Etiquette>
                          <a
                            href={`/pieces/${depot.id}`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-ispt-600 underline hover:no-underline"
                          >
                            <ExternalLink aria-hidden className="size-3.5" /> Ouvrir
                          </a>
                        </div>
                      ) : (
                        <Etiquette ton="neutre">Non déposée</Etiquette>
                      )}
                    </div>
                    {depot && peutDecider && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-ispt-600">
                          Statuer sur la pièce
                        </summary>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          <FormulaireAction
                            action={statuerPiece.bind(null, depot.id, "ACCEPTEE")}
                            libelleEnvoi="Marquer vérifiée"
                          >
                            <p className="text-sm text-pierre-600">
                              La pièce est lisible et conforme.
                            </p>
                          </FormulaireAction>
                          <FormulaireAction
                            action={statuerPiece.bind(null, depot.id, "REJETEE")}
                            libelleEnvoi="Refuser la pièce"
                          >
                            <Champ id={`motif-${depot.id}`} libelle="Motif communiqué au candidat">
                              <Saisie
                                id={`motif-${depot.id}`}
                                name="commentaire"
                                maxLength={500}
                                placeholder="Photo illisible, document incomplet…"
                              />
                            </Champ>
                          </FormulaireAction>
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panneau>
        </div>

        <div className="space-y-6">
          {avecFrais && (
            <Panneau
              titre="Frais de dossier"
              description={formatMontant(Number(d.campagne.fraisInscription), d.campagne.devise)}
            >
              <PaiementDossier dossier={d} etat={paiement} peutEncaisser={peutEncaisser} />
            </Panneau>
          )}
          {statut === "ADMISE" && aPermission(u, "etudiants.gerer") && (
            <Panneau
              titre="Inscrire l'étudiant"
              description="Attribuez le matricule : l'admis devient étudiant de première année dans sa filière, avec le même compte."
            >
              <FormulaireAction action={inscrireAdmis.bind(null, d.id)} libelleEnvoi="Inscrire">
                <Champ id="matricule" libelle="Matricule attribué">
                  <Saisie id="matricule" name="matricule" autoCapitalize="characters" required />
                </Champ>
              </FormulaireAction>
            </Panneau>
          )}
          {peutDecider && decisions.length === 0 && statut !== "ADMISE" && (
            <Panneau titre="Décision">
              <p className="text-sm text-pierre-700">
                {statut === "COMPLEMENT"
                  ? "En attente du complément demandé au candidat. Le dossier reviendra ici dès qu'il sera redéposé."
                  : statut === "BROUILLON"
                    ? "Le candidat n'a pas encore déposé son dossier."
                    : "Aucune décision n'est attendue à ce stade."}
              </p>
            </Panneau>
          )}
          {peutDecider && decisions.length > 0 && (
            <Panneau titre="Décision">
              {manquants.length > 0 && statut !== "ADMISE" && (
                <p className="mb-4 text-sm text-attention">
                  Éléments manquants ou refusés : {manquants.join(", ")}.
                </p>
              )}
              <FormulaireAction
                action={deciderCandidature.bind(null, d.id)}
                libelleEnvoi="Enregistrer"
              >
                <Champ id="decision" libelle="Décision">
                  <Liste id="decision" name="decision" defaultValue={decisions[0]}>
                    {decisions.map((s) => (
                      <option key={s} value={s}>
                        {LIBELLES_DECISION[s] ?? LIBELLES_STATUT[s]}
                      </option>
                    ))}
                  </Liste>
                </Champ>
                <Champ
                  id="motif"
                  libelle="Message au candidat"
                  aide="Obligatoire pour un refus ou une demande de complément. Il est envoyé par email."
                >
                  <ZoneTexte
                    id="motif"
                    name="motif"
                    rows={4}
                    maxLength={1000}
                    aria-describedby="motif-aide"
                  />
                </Champ>
              </FormulaireAction>
            </Panneau>
          )}
          <Panneau titre="Historique">
            <ol className="relative border-l border-pierre-300">
              {d.historique.map((h) => (
                <li key={h.id} className="relative pb-5 pl-5 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[5px] size-[9px] rounded-full bg-ispt-600 ring-4 ring-white"
                  />
                  <p className="text-sm text-pierre-900">{LIBELLES_STATUT[h.statut as Statut]}</p>
                  <p className="font-mono text-xs text-pierre-500">
                    {formatJour.format(h.creeLe)}, {formatHeure.format(h.creeLe)} ·{" "}
                    {nomAuteur(h.auteurId)}
                  </p>
                  {h.commentaire && (
                    <p className="mt-1 text-sm whitespace-pre-line text-pierre-700">
                      {h.commentaire}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Panneau>
        </div>
      </div>
    </>
  );
}
