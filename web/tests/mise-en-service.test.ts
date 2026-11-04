import { describe, expect, it } from "vitest";
import { lireListePersonnel, trouverRole } from "@/features/comptes/import";
import { avancement, construireEtapes, type EtatPlateforme } from "@/features/demarrage/regles";

const ROLES = [
  { code: "section", libelle: "Appariteur / secrétariat de section" },
  { code: "caisse", libelle: "Caisse" },
  { code: "enseignant", libelle: "Enseignant" },
  { code: "communication", libelle: "Communication" },
];

describe("invitation en masse : lecture du fichier", () => {
  it("reconnaît les rôles par code, libellé ou nom d'usage", () => {
    expect(trouverRole("Appariteur", ROLES)).toBe("section");
    expect(trouverRole("caisse", ROLES)).toBe("caisse");
    expect(trouverRole("CAISSIÈRE", ROLES)).toBe("caisse");
    expect(trouverRole("Professeur", ROLES)).toBe("enseignant");
    expect(trouverRole("Directeur général", ROLES)).toBeNull(); // rôle non attribuable ici
    expect(trouverRole("Pilote", ROLES)).toBeNull();
  });

  it("lit les colonnes dans n'importe quel ordre, sans confondre nom, prénom et post-nom", () => {
    const csv =
      "Email;Post-nom;Prénom;Nom;Rôle;Titre;Domaine\n" +
      "a@exemple.org;mukengere;Grâce;bahati;Appariteur;;\n" +
      "b@exemple.org;;Paul;amani;Enseignant + Communication;CT;Génie civil\n";
    const [a, b] = lireListePersonnel(csv, ROLES);
    expect(a).toMatchObject({
      prenom: "Grâce",
      nom: "BAHATI",
      postnom: "MUKENGERE",
      roles: ["section"],
    });
    expect(a.erreur).toBeUndefined();
    expect(b).toMatchObject({ roles: ["enseignant", "communication"], titre: "CT" });
  });

  it("signale chaque ligne invalide au lieu de l'ignorer en silence", () => {
    const csv =
      "Prénom,Nom,Email,Rôle\n" +
      "Jean,KABILA,pas-un-email,Caisse\n" +
      "Marie,ZAWADI,m@exemple.org,Super administrateur\n" +
      "Luc,BISIMWA,m@exemple.org,Caisse\n" +
      ",,x@exemple.org,Caisse\n" +
      "Eve,MAPENDO,e@exemple.org,\n";
    const lignes = lireListePersonnel(csv, ROLES);
    expect(lignes.map((l) => l.erreur)).toEqual([
      "Email invalide",
      "Rôle non reconnu ou non attribuable : « Super administrateur »",
      "Email en double dans le fichier",
      "Nom manquant",
      "Rôle manquant",
    ]);
  });

  it("exige les colonnes Nom, Email et Rôle", () => {
    expect(lireListePersonnel("Prénom;Nom;Email\nA;B;c@d.org", ROLES)).toEqual([]);
  });
});

const VIDE: EtatPlateforme = {
  identiteVerifiee: false,
  autorites: 0,
  textesJuridiques: { mentions: false, confidentialite: false },
  signataireDocuments: false,
  personnelParRole: {},
  invitationsEnAttente: 0,
  anneeCourante: null,
  promotions: 0,
  promotionsSansCours: 0,
  coursOfferts: 0,
  coursSansEnseignant: 0,
  enseignants: 0,
  promotionsSansEtudiants: 0,
  etudiants: 0,
  etudiantsActives: 0,
  seances: 0,
  reglementEnregistre: false,
  baremes: 0,
  campagneOuverte: false,
  evenementsAVenir: 0,
  actualitesPubliees: 0,
};

const etape = (e: EtatPlateforme, cle: string) =>
  construireEtapes(e)
    .flatMap((g) => g.etapes)
    .find((x) => x.cle === cle)!;

describe("liste de mise en service", () => {
  it("une plateforme vide n'a que des étapes à faire (sauf l'absence d'invitation en attente)", () => {
    const etapes = construireEtapes(VIDE).flatMap((g) => g.etapes);
    expect(etapes.filter((e) => e.statut === "fait").map((e) => e.cle)).toEqual(["invitations"]);
    expect(etape(VIDE, "reglement").statut).toBe("partiel");
  });

  it("nomme les fonctions du personnel encore sans titulaire", () => {
    const e = { ...VIDE, personnelParRole: { direction: 1, caisse: 2 } };
    expect(etape(e, "personnel").statut).toBe("partiel");
    expect(etape(e, "personnel").detail).toContain("Appariteur / secrétariat de section");
    expect(etape(e, "personnel").detail).not.toContain("Caisse");
  });

  it("suit le programme, les enseignants et l'activation des étudiants", () => {
    const e = {
      ...VIDE,
      anneeCourante: "2026-2027",
      promotions: 4,
      promotionsSansCours: 1,
      coursOfferts: 20,
      coursSansEnseignant: 0,
      etudiants: 80,
      etudiantsActives: 20,
    };
    expect(etape(e, "annee").statut).toBe("fait");
    expect(etape(e, "programme").statut).toBe("partiel");
    expect(etape(e, "enseignants").statut).toBe("fait");
    expect(etape(e, "activation").detail).toContain("20 sur 80 (25 %)");
  });

  it("marque les données attendues de l'institut et calcule l'avancement", () => {
    const groupes = construireEtapes(VIDE);
    const institut = groupes.flatMap((g) => g.etapes).filter((e) => e.institut);
    expect(institut.map((e) => e.cle)).toContain("frais");
    expect(institut.map((e) => e.cle)).toContain("juridique");
    const { total, pourcentage } = avancement(groupes);
    // 1 étape faite + 1 partielle (règlement par défaut) = 1,5 point.
    expect(pourcentage).toBe(Math.round((100 * 1.5) / total));
  });
});
