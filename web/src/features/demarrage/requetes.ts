import "server-only";
import { db } from "@/lib/db";
import { lireParametresDocuments, signataireDocuments } from "@/features/documents/parametres";
import { ROLES_ATTENDUS, type EtatPlateforme } from "./regles";

async function texteJuridiquePublie(slug: string) {
  const bloc = await db.blocPage.findFirst({ where: { cle: "texte", page: { slug } } });
  const d = bloc?.donnees as { texte?: unknown } | undefined;
  return !!bloc?.visible && typeof d?.texte === "string" && d.texte.trim().length > 0;
}

/** Relevé de l'état réel de la plateforme pour la liste de mise en service. */
export async function lireEtatPlateforme(): Promise<EtatPlateforme> {
  const annee = await db.anneeAcademique.findFirst({ where: { courante: true } });
  const anneeId = annee?.id ?? "__aucune__";
  const maintenant = new Date();

  const [
    identite,
    autorites,
    mentions,
    confidentialite,
    signataire,
    roles,
    invitations,
    promotions,
    coursOfferts,
    coursSansEnseignant,
    enseignants,
    etudiants,
    etudiantsActives,
    seances,
    reglement,
    baremes,
    campagne,
    evenements,
    actualites,
  ] = await Promise.all([
    db.journalActivite.count({ where: { action: "reglages_modifies", entiteId: "institut" } }),
    db.autorite.count({ where: { visible: true } }),
    texteJuridiquePublie("mentions-legales"),
    texteJuridiquePublie("confidentialite"),
    lireParametresDocuments().then(signataireDocuments),
    db.utilisateurRole.groupBy({
      by: ["roleId"],
      where: {
        role: { code: { in: ROLES_ATTENDUS.map((r) => r.code) } },
        utilisateur: { statut: { not: "SUSPENDU" } },
      },
      _count: true,
    }),
    db.utilisateur.count({
      where: {
        statut: "INVITE",
        profilEtudiant: null,
        roles: { some: { role: { code: { notIn: ["etudiant", "candidat"] } } } },
      },
    }),
    db.promotion.findMany({
      where: { anneeId },
      select: { _count: { select: { cours: true, inscriptions: true } } },
    }),
    db.coursOffert.count({ where: { promotion: { anneeId } } }),
    db.coursOffert.count({ where: { promotion: { anneeId }, enseignants: { none: {} } } }),
    db.profilEnseignant.count({ where: { utilisateur: { statut: { not: "SUSPENDU" } } } }),
    db.inscription.count({ where: { promotion: { anneeId } } }),
    db.inscription.count({
      where: { promotion: { anneeId }, etudiant: { utilisateur: { statut: "ACTIF" } } },
    }),
    db.seance.count({ where: { coursOffert: { promotion: { anneeId } } } }),
    db.reglementAcademique.count({ where: { anneeId } }),
    db.baremeFrais.count({ where: { anneeId } }),
    db.campagneAdmission.count({ where: { statut: "OUVERTE", cloture: { gte: maintenant } } }),
    db.evenement.count({ where: { statut: "PUBLIE", debut: { gte: maintenant } } }),
    db.actualite.count({ where: { statut: "PUBLIE" } }),
  ]);

  const codesRoles = await db.role.findMany({
    where: { id: { in: roles.map((r) => r.roleId) } },
    select: { id: true, code: true },
  });
  const personnelParRole = Object.fromEntries(
    roles.map((r) => [codesRoles.find((c) => c.id === r.roleId)?.code ?? r.roleId, r._count]),
  );

  return {
    identiteVerifiee: identite > 0,
    autorites,
    textesJuridiques: { mentions, confidentialite },
    signataireDocuments: !!signataire,
    personnelParRole,
    invitationsEnAttente: invitations,
    anneeCourante: annee?.libelle ?? null,
    promotions: promotions.length,
    promotionsSansCours: promotions.filter((p) => p._count.cours === 0).length,
    coursOfferts,
    coursSansEnseignant,
    enseignants,
    promotionsSansEtudiants: promotions.filter((p) => p._count.inscriptions === 0).length,
    etudiants,
    etudiantsActives,
    seances,
    reglementEnregistre: reglement > 0,
    baremes,
    campagneOuverte: campagne > 0,
    evenementsAVenir: evenements,
    actualitesPubliees: actualites,
  };
}
