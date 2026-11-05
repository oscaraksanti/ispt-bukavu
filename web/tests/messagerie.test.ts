import { describe, expect, it } from "vitest";
import {
  apercu,
  clePrivee,
  lecteurs,
  normaliserContenu,
  peutEcrireA,
  peutPublier,
  type ProfilMessagerie,
  quandCourt,
  verifierContenu,
} from "@/features/messagerie/regles";

const profil = (id: string, p: Partial<ProfilMessagerie> = {}): ProfilMessagerie => ({
  id,
  personnel: false,
  enseignant: false,
  etudiant: false,
  promotions: [],
  promotionsEnseignees: [],
  ...p,
});

const alice = profil("alice", { etudiant: true, promotions: ["bac2-gi"] });
const bruno = profil("bruno", { etudiant: true, promotions: ["bac2-gi"] });
const chloe = profil("chloe", { etudiant: true, promotions: ["bac3-gc"] });
const prof = profil("prof", { enseignant: true, promotionsEnseignees: ["bac2-gi"] });
const autreProf = profil("autre", { enseignant: true, promotionsEnseignees: ["bac4-ee"] });
const caisse = profil("caisse", { personnel: true });
const candidat = profil("candidat");

describe("qui peut écrire à qui", () => {
  it("un étudiant écrit à sa promotion, à ses enseignants et au personnel", () => {
    expect(peutEcrireA(alice, bruno)).toBe(true);
    expect(peutEcrireA(alice, prof)).toBe(true);
    expect(peutEcrireA(alice, caisse)).toBe(true);
  });

  it("mais pas aux étudiants d'une autre promotion ni aux enseignants d'autres cours", () => {
    expect(peutEcrireA(alice, chloe)).toBe(false);
    expect(peutEcrireA(alice, autreProf)).toBe(false);
  });

  it("le personnel et les enseignants écrivent à toute personne ayant la messagerie", () => {
    expect(peutEcrireA(caisse, chloe)).toBe(true);
    expect(peutEcrireA(autreProf, alice)).toBe(true);
  });

  it("personne n'écrit à un candidat ni à soi-même", () => {
    expect(peutEcrireA(caisse, candidat)).toBe(false);
    expect(peutEcrireA(candidat, caisse)).toBe(false);
    expect(peutEcrireA(alice, alice)).toBe(false);
  });
});

describe("conversations", () => {
  it("une seule conversation privée par paire, quel que soit l'ordre", () => {
    expect(clePrivee("b", "a")).toBe(clePrivee("a", "b"));
    expect(clePrivee("a", "b")).toBe("privee:a:b");
  });

  it("un groupe d'annonces n'est ouvert qu'aux animateurs", () => {
    expect(peutPublier({ annoncesSeulement: true }, false)).toBe(false);
    expect(peutPublier({ annoncesSeulement: true }, true)).toBe(true);
    expect(peutPublier({ annoncesSeulement: false }, false)).toBe(true);
  });

  it("compte les lecteurs d'un message", () => {
    const envoye = new Date("2026-11-05T10:00:00Z");
    expect(
      lecteurs(envoye, [new Date("2026-11-05T10:01:00Z"), new Date("2026-11-05T09:00:00Z"), null]),
    ).toBe(1);
  });
});

describe("contenu", () => {
  it("exige un texte ou une pièce jointe, et borne la longueur", () => {
    expect(verifierContenu("   ", false)).toMatch(/Écrivez/);
    expect(verifierContenu("", true)).toBeNull();
    expect(verifierContenu("x".repeat(4001), false)).toMatch(/trop long/);
  });

  it("normalise les retours à la ligne", () => {
    expect(normaliserContenu("  a\r\n\n\n\n\nb  ")).toBe("a\n\n\nb");
  });

  it("produit l'aperçu de la liste", () => {
    expect(
      apercu({
        contenu: "Bonjour\n tout le   monde",
        supprime: false,
        masque: false,
        piece: false,
      }),
    ).toBe("Bonjour tout le monde");
    expect(apercu({ contenu: "x", supprime: false, masque: true, piece: false })).toMatch(/masqué/);
    expect(apercu({ contenu: "", supprime: false, masque: false, piece: true })).toBe(
      "Pièce jointe",
    );
    expect(
      apercu({ contenu: "a".repeat(200), supprime: false, masque: false, piece: false }),
    ).toHaveLength(90);
  });

  it("affiche l'heure aujourd'hui, « Hier », puis la date", () => {
    const maintenant = new Date("2026-11-05T12:00:00Z");
    expect(quandCourt(new Date("2026-11-05T08:30:00Z"), maintenant)).toBe("10:30");
    expect(quandCourt(new Date("2026-11-04T08:30:00Z"), maintenant)).toBe("Hier");
    expect(quandCourt(new Date("2026-10-01T08:30:00Z"), maintenant)).toBe("1 oct.");
  });
});

describe("sécurité de la messagerie", () => {
  it("l'appartenance à un groupe suit les inscriptions et affectations du moment", async () => {
    const { membreDuGroupe } = await import("@/features/messagerie/regles");
    const etudiant = { promotions: ["p1"], coursSuivis: ["c1"], coursEnseignes: [] };
    const ancien = { promotions: [], coursSuivis: [], coursEnseignes: [] };
    const groupeP = { type: "PROMOTION", promotionId: "p1", coursOffertId: null };
    const groupeC = { type: "COURS", promotionId: null, coursOffertId: "c1" };
    expect(membreDuGroupe(etudiant, groupeP)).toBe(true);
    expect(membreDuGroupe(etudiant, groupeC)).toBe(true);
    expect(membreDuGroupe(ancien, groupeP)).toBe(false);
    expect(membreDuGroupe({ ...ancien, coursEnseignes: ["c1"] }, groupeC)).toBe(true);
    expect(
      membreDuGroupe(etudiant, { type: "PRIVEE", promotionId: null, coursOffertId: null }),
    ).toBe(false);
  });
  it("le signalement garde une copie du contenu", async () => {
    const { extraitSignale } = await import("@/features/messagerie/regles");
    expect(extraitSignale("  Texte  ")).toBe("Texte");
    expect(extraitSignale("", "copie.pdf")).toBe("[Pièce jointe : copie.pdf]");
    expect(extraitSignale("")).toBeNull();
    expect(extraitSignale("x".repeat(3000))?.length).toBe(2000);
  });
});
