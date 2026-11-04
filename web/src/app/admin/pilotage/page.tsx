import type { Metadata } from "next";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { Barres } from "@/components/pilotage/barres";
import { EtatVide } from "@/components/ui/elements";
import { LIBELLES_STATUT, type Statut } from "@/features/admissions/regles";
import { exigerPermission } from "@/features/auth/acces";
import { formatMontant } from "@/features/finances/regles";
import { STATUTS_STAGE } from "@/features/stages/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Pilotage" };

export default async function Pilotage() {
  await exigerPermission("pilotage.consulter");
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  if (!annee) return <EtatVide titre="Aucune année académique courante" />;
  const seuil = Number(annee.seuilReussite);
  const dansAnnee = { promotion: { anneeId: annee.id } };

  const [
    inscriptions,
    filieres,
    niveaux,
    campagne,
    encaisse,
    enRegle,
    notes,
    communiques,
    lectures,
    stages,
    documents,
  ] = await Promise.all([
    db.inscription.findMany({
      where: { ...dansAnnee, statut: { notIn: ["ABANDON"] } },
      select: {
        statut: true,
        promotion: { select: { filiereId: true, niveauId: true } },
        etudiant: { select: { sexe: true } },
      },
    }),
    db.filiere.findMany({ orderBy: { ordre: "asc" } }),
    db.niveau.findMany({ orderBy: { ordre: "asc" } }),
    db.campagneAdmission.findFirst({
      where: { anneeId: annee.id },
      orderBy: { ouverture: "desc" },
      include: { candidatures: { select: { statut: true, filiereId: true } } },
    }),
    db.paiement.groupBy({
      by: ["devise"],
      where: { anneeId: annee.id, annuleLe: null },
      _sum: { montant: true },
    }),
    db.inscription.count({ where: { ...dansAnnee, statut: "EN_REGLE" } }),
    db.note.findMany({
      where: {
        absent: false,
        valeur: { not: null },
        evaluation: { statut: "PUBLIEE", coursOffert: dansAnnee },
      },
      select: { valeur: true },
    }),
    db.communique.count({ where: { statut: "PUBLIE", publieLe: { gte: annee.debut } } }),
    db.lecture.count({ where: { luLe: { gte: annee.debut } } }),
    db.stage.groupBy({ by: ["statut"], where: { anneeId: annee.id }, _count: true }),
    db.documentOfficiel.count({ where: { emisLe: { gte: annee.debut } } }),
  ]);

  const effectif = inscriptions.length;
  const filles = inscriptions.filter((i) => i.etudiant.sexe === "F").length;
  const reussite = notes.length
    ? Math.round((notes.filter((n) => Number(n.valeur) >= seuil).length / notes.length) * 100)
    : null;
  const candidatures = campagne?.candidatures.filter((c) => c.statut !== "BROUILLON") ?? [];

  const indicateurs = [
    {
      valeur: effectif.toLocaleString("fr-FR"),
      libelle: "étudiants inscrits",
      detail: effectif ? `${Math.round((filles / effectif) * 100)} % de femmes` : "",
    },
    {
      valeur: effectif ? `${Math.round((enRegle / effectif) * 100)} %` : "—",
      libelle: "en règle financièrement",
      detail: `${enRegle} sur ${effectif}`,
    },
    {
      valeur: reussite === null ? "—" : `${reussite} %`,
      libelle: "des notes publiées au-dessus du seuil",
      detail: `${notes.length} note(s) publiée(s)`,
    },
    {
      valeur: candidatures.length.toLocaleString("fr-FR"),
      libelle: "candidatures déposées",
      detail: campagne?.libelle ?? "Aucune campagne",
    },
  ];

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Pilotage" }]}
        titre="Pilotage"
        description={`Indicateurs de l'année ${annee.libelle}, calculés en temps réel à partir des données de la plateforme.`}
      />
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {indicateurs.map((i) => (
          <div key={i.libelle} className="rounded-md border border-pierre-200 bg-white p-5">
            <dd className="font-serif text-4xl text-encre">{i.valeur}</dd>
            <dt className="mt-1 text-sm text-pierre-700">{i.libelle}</dt>
            {i.detail && <dd className="mt-1 text-xs text-pierre-500">{i.detail}</dd>}
          </div>
        ))}
      </dl>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panneau titre="Effectifs">
          <div className="space-y-8">
            <Barres
              titre="Par filière"
              donnees={filieres
                .map((f) => ({
                  libelle: f.nomCourt,
                  valeur: inscriptions.filter((i) => i.promotion.filiereId === f.id).length,
                }))
                .filter((d) => d.valeur > 0)}
            />
            <Barres
              titre="Par niveau"
              donnees={niveaux.map((n) => ({
                libelle: n.libelle,
                valeur: inscriptions.filter((i) => i.promotion.niveauId === n.id).length,
              }))}
            />
          </div>
        </Panneau>
        <Panneau titre="Admissions" description={campagne?.libelle}>
          <div className="space-y-8">
            <Barres
              titre="Dossiers par état"
              donnees={(
                ["SOUMISE", "EN_EXAMEN", "COMPLEMENT", "ADMISE", "REFUSEE", "INSCRITE"] as Statut[]
              )
                .map((s) => ({
                  libelle: LIBELLES_STATUT[s],
                  valeur: candidatures.filter((c) => c.statut === s).length,
                }))
                .filter((d) => d.valeur > 0)}
            />
            <Barres
              titre="Dossiers par filière demandée"
              donnees={filieres
                .map((f) => ({
                  libelle: f.nomCourt,
                  valeur: candidatures.filter((c) => c.filiereId === f.id).length,
                }))
                .filter((d) => d.valeur > 0)}
            />
          </div>
        </Panneau>
        <Panneau titre="Finances">
          {encaisse.length === 0 ? (
            <p className="text-sm text-pierre-600">Aucun paiement enregistré cette année.</p>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              {encaisse.map((e) => (
                <div key={e.devise}>
                  <dt className="text-sm text-pierre-600">Encaissé ({e.devise})</dt>
                  <dd className="font-serif text-3xl text-encre">
                    {formatMontant(Number(e._sum.montant ?? 0), e.devise)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Panneau>
        <Panneau titre="Vie académique">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-pierre-600">Communiqués publiés</dt>
              <dd className="font-serif text-3xl text-encre">{communiques}</dd>
            </div>
            <div>
              <dt className="text-pierre-600">Lectures enregistrées</dt>
              <dd className="font-serif text-3xl text-encre">{lectures}</dd>
            </div>
            <div>
              <dt className="text-pierre-600">Documents délivrés</dt>
              <dd className="font-serif text-3xl text-encre">{documents}</dd>
            </div>
            <div>
              <dt className="text-pierre-600">Stages</dt>
              <dd className="mt-1 space-y-0.5">
                {stages.length === 0
                  ? "—"
                  : stages.map((s) => (
                      <span key={s.statut} className="block">
                        {STATUTS_STAGE[s.statut]} : {s._count}
                      </span>
                    ))}
              </dd>
            </div>
          </dl>
        </Panneau>
      </div>
    </>
  );
}
