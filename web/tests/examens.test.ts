import { describe, expect, it } from "vitest";
import {
  calendrierIcs,
  conflits,
  enHeureBukavu,
  type EpreuvePlanifiee,
  instantBukavu,
  libelleSalle,
  modifieeApresPublication,
  parJour,
  verifierEpreuve,
} from "@/features/examens/regles";

const h = (jour: string, heure: string) => instantBukavu(jour, heure)!;

function epreuve(p: Partial<EpreuvePlanifiee> & { id: string }): EpreuvePlanifiee {
  return {
    libelle: `Cours ${p.id}`,
    promotionId: "p1",
    promotion: "BAC1 GI",
    debut: h("2026-12-07", "08:00"),
    fin: h("2026-12-07", "11:00"),
    salle: null,
    surveillants: [],
    ...p,
  };
}

describe("heures de Bukavu", () => {
  it("convertit dans les deux sens (UTC+2)", () => {
    const d = h("2026-12-07", "08:30");
    expect(d.toISOString()).toBe("2026-12-07T06:30:00.000Z");
    expect(enHeureBukavu(d)).toEqual({ jour: "2026-12-07", heure: "08:30" });
    expect(instantBukavu("2026-12-07", "8h")).toBeNull();
  });
});

describe("contrôle d'une épreuve", () => {
  const session = { debut: h("2026-12-07", "00:00"), fin: h("2026-12-18", "00:00") };
  it("accepte une épreuve dans la session", () => {
    expect(verifierEpreuve({ jour: "2026-12-18", debut: "13:00", fin: "16:00" }, session)).toBe(
      null,
    );
  });
  it("refuse les heures incohérentes, trop longues ou hors session", () => {
    expect(verifierEpreuve({ jour: "2026-12-08", debut: "11:00", fin: "08:00" }, session)).toMatch(
      /après son début/,
    );
    expect(verifierEpreuve({ jour: "2026-12-08", debut: "07:00", fin: "16:00" }, session)).toMatch(
      /8 heures/,
    );
    expect(verifierEpreuve({ jour: "2026-12-19", debut: "08:00", fin: "11:00" }, session)).toMatch(
      /en dehors/,
    );
  });
});

describe("conflits du planning", () => {
  it("signale une promotion qui compose deux fois en même temps", () => {
    const c = conflits([
      epreuve({ id: "a" }),
      epreuve({ id: "b", debut: h("2026-12-07", "10:00"), fin: h("2026-12-07", "12:00") }),
    ]);
    expect(c.map((x) => x.type)).toEqual(["PROMOTION"]);
    expect(c[0].epreuves).toEqual(["a", "b"]);
  });

  it("autorise deux promotions en même temps dans des salles différentes", () => {
    expect(
      conflits([
        epreuve({ id: "a", salle: "A1" }),
        epreuve({ id: "b", promotionId: "p2", promotion: "BAC1 EM", salle: "A2" }),
      ]),
    ).toEqual([]);
  });

  it("signale une salle ou un surveillant pris deux fois (salle sans tenir compte de la casse)", () => {
    const prof = { id: "s1", nom: "N.N." };
    const c = conflits([
      epreuve({ id: "a", salle: "Salle 101", surveillants: [prof] }),
      epreuve({
        id: "b",
        promotionId: "p2",
        promotion: "BAC1 EM",
        salle: "salle  101",
        surveillants: [prof],
      }),
    ]);
    expect(c.map((x) => x.type).sort()).toEqual(["SALLE", "SURVEILLANT"]);
  });

  it("ignore deux épreuves qui se suivent sans se chevaucher", () => {
    expect(
      conflits([
        epreuve({ id: "a" }),
        epreuve({ id: "b", debut: h("2026-12-07", "11:00"), fin: h("2026-12-07", "12:00") }),
      ]),
    ).toEqual([]);
  });
});

describe("présentation", () => {
  it("nomme les salles sans répéter « Salle »", () => {
    expect(libelleSalle("104")).toBe("Salle 104");
    expect(libelleSalle("A1")).toBe("Salle A1");
    expect(libelleSalle("Salle 104")).toBe("Salle 104");
    expect(libelleSalle("auditoire central")).toBe("Auditoire central");
    expect(libelleSalle(null)).toBe("Salle à préciser");
  });

  it("regroupe par jour dans l'ordre chronologique", () => {
    const jours = parJour([
      { id: "2", debut: h("2026-12-08", "08:00") },
      { id: "1", debut: h("2026-12-07", "13:00") },
      { id: "0", debut: h("2026-12-07", "08:00") },
    ]);
    expect(jours.map((j) => [j.jour, j.epreuves.map((e) => e.id)])).toEqual([
      ["2026-12-07", ["0", "1"]],
      ["2026-12-08", ["2"]],
    ]);
  });

  it("signale une épreuve modifiée après la publication", () => {
    const publieeLe = new Date("2026-11-20T10:00:00Z");
    expect(modifieeApresPublication({ majLe: new Date("2026-11-20T09:59:00Z") }, publieeLe)).toBe(
      false,
    );
    expect(modifieeApresPublication({ majLe: new Date("2026-11-21T08:00:00Z") }, publieeLe)).toBe(
      true,
    );
    expect(modifieeApresPublication({ majLe: new Date() }, null)).toBe(false);
  });

  it("produit un fichier d'agenda valide avec un rappel la veille", () => {
    const ics = calendrierIcs(
      "Examens",
      [
        {
          id: "e1",
          titre: "Examen · Analyse, partie 1",
          debut: h("2026-12-07", "08:00"),
          fin: h("2026-12-07", "11:00"),
          lieu: "Salle A1",
          description: "Session ordinaire",
        },
      ],
      new Date("2026-11-20T10:00:00Z"),
    );
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261207T060000Z");
    expect(ics).toContain("SUMMARY:Examen · Analyse\\, partie 1");
    expect(ics).toContain("TRIGGER:-PT18H");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});
