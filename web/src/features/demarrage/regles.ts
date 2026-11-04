/**
 * Liste de mise en service de la plateforme : calculée à partir de l'état
 * réel de la base (fonctions pures, testées). Chaque étape indique ce qui
 * reste à saisir, qui doit le fournir et où le saisir.
 */
import type { CodePermission } from "@/lib/permissions";

export type StatutEtape = "fait" | "partiel" | "a_faire";

export type Etape = {
  cle: string;
  titre: string;
  statut: StatutEtape;
  detail: string;
  lien: string;
  permission?: CodePermission;
  /** Donnée qui ne peut venir que de l'institut (jamais inventée). */
  institut?: boolean;
};

export type GroupeEtapes = { titre: string; etapes: Etape[] };

export type EtatPlateforme = {
  identiteVerifiee: boolean;
  autorites: number;
  textesJuridiques: { mentions: boolean; confidentialite: boolean };
  signataireDocuments: boolean;
  /** Nombre de comptes (actifs ou invités) par rôle du personnel. */
  personnelParRole: Record<string, number>;
  invitationsEnAttente: number;
  anneeCourante: string | null;
  promotions: number;
  promotionsSansCours: number;
  coursOfferts: number;
  coursSansEnseignant: number;
  enseignants: number;
  promotionsSansEtudiants: number;
  etudiants: number;
  etudiantsActives: number;
  seances: number;
  reglementEnregistre: boolean;
  baremes: number;
  campagneOuverte: boolean;
  evenementsAVenir: number;
  actualitesPubliees: number;
};

/** Rôles du personnel dont la présence est attendue pour que l'institut fonctionne. */
export const ROLES_ATTENDUS: { code: string; libelle: string }[] = [
  { code: "direction", libelle: "Direction générale" },
  { code: "secretariat_academique", libelle: "Secrétariat général académique" },
  { code: "section", libelle: "Appariteur / secrétariat de section" },
  { code: "caisse", libelle: "Caisse" },
  { code: "communication", libelle: "Communication" },
];

const pluriel = (n: number, mot: string, motPluriel = `${mot}s`) =>
  `${n} ${n > 1 ? motPluriel : mot}`;

function statutSelon(total: number, manquants: number): StatutEtape {
  if (total === 0) return "a_faire";
  return manquants === 0 ? "fait" : "partiel";
}

export function construireEtapes(e: EtatPlateforme): GroupeEtapes[] {
  const rolesManquants = ROLES_ATTENDUS.filter((r) => !e.personnelParRole[r.code]);
  const rolesPourvus = ROLES_ATTENDUS.length - rolesManquants.length;
  const juridiques =
    Number(e.textesJuridiques.mentions) + Number(e.textesJuridiques.confidentialite);
  const annee = e.anneeCourante ? ` (${e.anneeCourante})` : "";

  return [
    {
      titre: "Institut",
      etapes: [
        {
          cle: "identite",
          titre: "Identité et coordonnées vérifiées",
          statut: e.identiteVerifiee ? "fait" : "a_faire",
          detail: e.identiteVerifiee
            ? "Les informations ont été relues et enregistrées depuis l'administration."
            : "Nom officiel, adresse, téléphones et email proviennent du dépliant : à relire et enregistrer une fois.",
          lien: "/admin/site/reglages",
          permission: "contenu.modifier",
          institut: true,
        },
        {
          cle: "autorites",
          titre: "Autorités de l'institut",
          statut: e.autorites > 0 ? "fait" : "a_faire",
          detail:
            e.autorites > 0
              ? `${pluriel(e.autorites, "autorité publiée", "autorités publiées")}.`
              : "Aucune autorité publiée.",
          lien: "/admin/site/autorites",
          permission: "contenu.modifier",
          institut: true,
        },
        {
          cle: "juridique",
          titre: "Mentions légales et confidentialité",
          statut: juridiques === 2 ? "fait" : juridiques === 1 ? "partiel" : "a_faire",
          detail:
            juridiques === 2
              ? "Les deux textes sont publiés."
              : "Textes juridiques à fournir par l'institut ; en attendant, les pages indiquent qu'ils sont en cours de validation.",
          lien: e.textesJuridiques.mentions
            ? "/admin/site/pages/confidentialite"
            : "/admin/site/pages/mentions-legales",
          permission: "contenu.modifier",
          institut: true,
        },
        {
          cle: "documents",
          titre: "Signataire des documents officiels",
          statut: e.signataireDocuments ? "fait" : "a_faire",
          detail: e.signataireDocuments
            ? "Les attestations et relevés portent un signataire."
            : "Aucun signataire : saisissez-le dans les paramètres des documents, ou publiez le Secrétaire général académique parmi les autorités.",
          lien: "/admin/documents#parametres",
          permission: "documents.emettre",
          institut: true,
        },
      ],
    },
    {
      titre: "Personnel",
      etapes: [
        {
          cle: "personnel",
          titre: "Comptes du personnel",
          statut: statutSelon(rolesPourvus, rolesManquants.length),
          detail:
            rolesManquants.length === 0
              ? "Chaque fonction clé dispose d'au moins un compte."
              : `Sans titulaire : ${rolesManquants.map((r) => r.libelle).join(", ")}.`,
          lien: "/admin/utilisateurs",
          permission: "utilisateurs.gerer",
        },
        {
          cle: "invitations",
          titre: "Invitations acceptées",
          statut: e.invitationsEnAttente === 0 ? "fait" : "partiel",
          detail:
            e.invitationsEnAttente === 0
              ? "Aucune invitation en attente."
              : `${pluriel(e.invitationsEnAttente, "personne n'a", "personnes n'ont")} pas encore choisi de mot de passe.`,
          lien: "/admin/utilisateurs?statut=INVITE",
          permission: "utilisateurs.gerer",
        },
      ],
    },
    {
      titre: `Année académique${annee}`,
      etapes: [
        {
          cle: "annee",
          titre: "Année courante et promotions",
          statut: !e.anneeCourante ? "a_faire" : e.promotions > 0 ? "fait" : "partiel",
          detail: !e.anneeCourante
            ? "Aucune année académique n'est marquée comme courante."
            : e.promotions > 0
              ? `${pluriel(e.promotions, "promotion ouverte", "promotions ouvertes")}.`
              : "Aucune promotion créée pour l'année courante.",
          lien: "/admin/academique",
          permission: "academique.structure",
        },
        {
          cle: "programme",
          titre: "Programme des cours",
          statut: statutSelon(e.promotions, e.promotionsSansCours),
          detail:
            e.promotions === 0
              ? "Créez d'abord les promotions."
              : e.promotionsSansCours === 0
                ? `${pluriel(e.coursOfferts, "cours programmé", "cours programmés")}.`
                : `${pluriel(e.promotionsSansCours, "promotion")} sans aucun cours.`,
          lien: "/admin/academique/programme",
          permission: "academique.structure",
          institut: true,
        },
        {
          cle: "enseignants",
          titre: "Enseignants affectés aux cours",
          statut:
            e.coursOfferts === 0 ? "a_faire" : statutSelon(e.coursOfferts, e.coursSansEnseignant),
          detail:
            e.coursOfferts === 0
              ? `${pluriel(e.enseignants, "enseignant enregistré", "enseignants enregistrés")} ; aucun cours à affecter.`
              : e.coursSansEnseignant === 0
                ? "Chaque cours a au moins un enseignant."
                : `${pluriel(e.coursSansEnseignant, "cours")} sans enseignant.`,
          lien: "/admin/enseignants",
          permission: "academique.structure",
        },
        {
          cle: "etudiants",
          titre: "Étudiants inscrits",
          statut: statutSelon(e.promotions, e.promotionsSansEtudiants),
          detail:
            e.promotions === 0
              ? "Créez d'abord les promotions."
              : e.promotionsSansEtudiants === 0
                ? `${pluriel(e.etudiants, "étudiant inscrit", "étudiants inscrits")}.`
                : `${pluriel(e.promotionsSansEtudiants, "promotion")} sans étudiant : importez le registre.`,
          lien: "/admin/etudiants",
          permission: "etudiants.gerer",
          institut: true,
        },
        {
          cle: "activation",
          titre: "Comptes étudiants activés",
          statut:
            e.etudiants === 0
              ? "a_faire"
              : statutSelon(e.etudiants, e.etudiants - e.etudiantsActives),
          detail:
            e.etudiants === 0
              ? "Aucun étudiant inscrit."
              : `${e.etudiantsActives} sur ${e.etudiants} (${Math.round((100 * e.etudiantsActives) / e.etudiants)} %). Distribuez les codes d'activation.`,
          lien: "/admin/etudiants",
          permission: "etudiants.gerer",
        },
        {
          cle: "horaires",
          titre: "Horaires des cours",
          statut: e.seances > 0 ? "fait" : "a_faire",
          detail:
            e.seances > 0
              ? `${pluriel(e.seances, "séance planifiée", "séances planifiées")}.`
              : "Aucune séance planifiée.",
          lien: "/admin/horaires",
          permission: "academique.horaires",
        },
        {
          cle: "reglement",
          titre: "Règlement des délibérations",
          statut: e.reglementEnregistre ? "fait" : "partiel",
          detail: e.reglementEnregistre
            ? "Règlement de l'année enregistré."
            : "Valeurs par défaut issues de la pratique observée (bulletins 2023-2024) : à faire valider par l'institut.",
          lien: "/admin/deliberations/reglement",
          permission: "academique.notes.valider",
          institut: true,
        },
        {
          cle: "frais",
          titre: "Barèmes des frais",
          statut: e.baremes > 0 ? "fait" : "a_faire",
          detail:
            e.baremes > 0
              ? `${pluriel(e.baremes, "barème enregistré", "barèmes enregistrés")}.`
              : "Montants officiels à fournir par l'institut.",
          lien: "/admin/finances",
          permission: "finances.encaisser",
          institut: true,
        },
      ],
    },
    {
      titre: "Admissions et communication",
      etapes: [
        {
          cle: "campagne",
          titre: "Campagne d'admission ouverte",
          statut: e.campagneOuverte ? "fait" : "a_faire",
          detail: e.campagneOuverte
            ? "Les candidats peuvent déposer leur dossier en ligne."
            : "Aucune campagne ouverte : les candidatures en ligne sont fermées.",
          lien: "/admin/admissions/campagnes",
          permission: "admissions.campagnes",
        },
        {
          cle: "agenda",
          titre: "Calendrier académique",
          statut: e.evenementsAVenir > 0 ? "fait" : "a_faire",
          detail:
            e.evenementsAVenir > 0
              ? `${pluriel(e.evenementsAVenir, "événement à venir", "événements à venir")}.`
              : "Aucun événement à venir : rentrée, sessions, congés à saisir.",
          lien: "/admin/agenda",
          permission: "actualites.gerer",
          institut: true,
        },
        {
          cle: "actualites",
          titre: "Première actualité publiée",
          statut: e.actualitesPubliees > 0 ? "fait" : "a_faire",
          detail:
            e.actualitesPubliees > 0
              ? `${pluriel(e.actualitesPubliees, "actualité publiée", "actualités publiées")}.`
              : "Annoncez l'ouverture de la plateforme.",
          lien: "/admin/actualites/nouvelle",
          permission: "actualites.gerer",
        },
      ],
    },
  ];
}

/** Avancement global : une étape partielle compte pour moitié. */
export function avancement(groupes: GroupeEtapes[]) {
  const etapes = groupes.flatMap((g) => g.etapes);
  const points = etapes.reduce(
    (t, e) => t + (e.statut === "fait" ? 1 : e.statut === "partiel" ? 0.5 : 0),
    0,
  );
  return {
    faites: etapes.filter((e) => e.statut === "fait").length,
    total: etapes.length,
    pourcentage: etapes.length ? Math.round((100 * points) / etapes.length) : 0,
  };
}
