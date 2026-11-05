import { describe, expect, it } from "vitest";
import { decrireAppareil } from "@/features/compte/regles";
import { bornesPurge, CONSERVATION_JOURS } from "@/features/exploitation/regles";

describe("appareils connectés", () => {
  it("décrit le navigateur et le système", () => {
    expect(
      decrireAppareil(
        "Mozilla/5.0 (Linux; Android 14; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
      ),
    ).toBe("Chrome sur Android");
    expect(
      decrireAppareil(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari sur iOS");
    expect(
      decrireAppareil(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0",
      ),
    ).toBe("Edge sur Windows");
    expect(decrireAppareil(null)).toBe("Appareil inconnu");
  });
});

describe("purge", () => {
  it("calcule les bornes de conservation", () => {
    const maintenant = new Date("2027-01-31T00:00:00Z");
    const b = bornesPurge(maintenant);
    expect(b.sessions).toEqual(maintenant);
    expect(b.tentatives.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(b.jetons.toISOString()).toBe("2027-01-24T00:00:00.000Z");
    expect(CONSERVATION_JOURS.notificationsLues).toBe(365);
  });
});
