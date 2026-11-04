import { describe, expect, it } from "vitest";
import { depotOuvert, estEnRetard, etatRemise, signatureValide } from "@/features/devoirs/regles";
import { appelPossible, bilanPresences, estStatutPresence } from "@/features/presences/regles";

const echeance = new Date("2026-11-10T23:59:00+02:00");
const avant = new Date("2026-11-09T10:00:00+02:00");
const apres = new Date("2026-11-11T10:00:00+02:00");

describe("devoirs", () => {
  it("ouvre le dépôt jusqu'à l'échéance, puis seulement si les retards sont acceptés", () => {
    expect(depotOuvert({ echeance, accepteRetard: false }, null, avant)).toBe(true);
    expect(depotOuvert({ echeance, accepteRetard: false }, null, apres)).toBe(false);
    expect(depotOuvert({ echeance, accepteRetard: true }, null, apres)).toBe(true);
  });

  it("ferme le dépôt d'une copie déjà corrigée", () => {
    expect(depotOuvert({ echeance, accepteRetard: true }, { corrigeLe: avant }, avant)).toBe(false);
  });

  it("déduit l'état d'un devoir pour l'étudiant", () => {
    const d = { echeance, accepteRetard: false };
    expect(etatRemise(d, null, avant)).toBe("a_rendre");
    expect(etatRemise(d, null, apres)).toBe("non_rendu");
    expect(etatRemise(d, { enRetard: false, corrigeLe: null }, apres)).toBe("rendu");
    expect(etatRemise(d, { enRetard: true, corrigeLe: null }, apres)).toBe("rendu_en_retard");
    expect(etatRemise(d, { enRetard: true, corrigeLe: apres }, apres)).toBe("corrige");
  });

  it("marque en retard une copie déposée après l'échéance", () => {
    expect(estEnRetard(echeance, avant)).toBe(false);
    expect(estEnRetard(echeance, apres)).toBe(true);
  });

  it("vérifie la signature réelle des fichiers", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7");
    expect(signatureValide("pdf", pdf)).toBe(true);
    expect(signatureValide("jpg", pdf)).toBe(false);
    expect(signatureValide("png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    expect(signatureValide("exe", pdf)).toBe(false);
  });
});

describe("présences", () => {
  it("compte les retards comme présences et exclut les absences excusées", () => {
    const b = bilanPresences(["PRESENT", "RETARD", "ABSENT", "EXCUSE"]);
    expect(b).toMatchObject({ seances: 4, presents: 2, absents: 1, excuses: 1, retards: 1 });
    expect(b.taux).toBe(67);
  });

  it("n'affiche pas de taux sans séance comptée", () => {
    expect(bilanPresences([]).taux).toBeNull();
    expect(bilanPresences(["EXCUSE"]).taux).toBeNull();
  });

  it("n'ouvre l'appel qu'au début d'une séance non annulée", () => {
    const debut = new Date("2026-11-10T08:00:00+02:00");
    expect(appelPossible({ debut, statut: "PREVUE" }, avant)).toBe(false);
    expect(appelPossible({ debut, statut: "PREVUE" }, apres)).toBe(true);
    expect(appelPossible({ debut, statut: "ANNULEE" }, apres)).toBe(false);
  });

  it("refuse un statut inconnu", () => {
    expect(estStatutPresence("ABSENT")).toBe(true);
    expect(estStatutPresence("DORMANT")).toBe(false);
  });
});
