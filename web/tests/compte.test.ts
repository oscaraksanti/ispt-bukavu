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

describe("photo de profil", () => {
  it("n'accepte que des photos légères aux formats courants", async () => {
    const { verifierPhotoProfil } = await import("@/features/compte/regles");
    expect(verifierPhotoProfil({ type: "image/jpeg", size: 200_000 })).toBeNull();
    expect(verifierPhotoProfil({ type: "image/webp", size: 1 })).toBeNull();
    expect(verifierPhotoProfil(null)).toMatch(/Choisissez/);
    expect(verifierPhotoProfil({ type: "image/gif", size: 1000 })).toMatch(/Formats/);
    expect(verifierPhotoProfil({ type: "image/svg+xml", size: 1000 })).toMatch(/Formats/);
    expect(verifierPhotoProfil({ type: "image/png", size: 5 * 1024 * 1024 })).toMatch(/lourde/);
  });
  it("n'est visible que des membres connectés (un candidat ne voit que la sienne)", async () => {
    const { peutVoirPhoto } = await import("@/features/compte/regles");
    expect(peutVoirPhoto(null, "a")).toBe(false);
    expect(peutVoirPhoto({ id: "a", roles: ["candidat"] }, "a")).toBe(true);
    expect(peutVoirPhoto({ id: "a", roles: ["candidat"] }, "b")).toBe(false);
    expect(peutVoirPhoto({ id: "a", roles: ["etudiant"] }, "b")).toBe(true);
    expect(peutVoirPhoto({ id: "a", roles: ["enseignant"] }, "b")).toBe(true);
  });
  it("affiche deux initiales à défaut de photo", async () => {
    const { initialesDe } = await import("@/features/compte/regles");
    expect(initialesDe("Grâce Bahati Mukengere")).toBe("GB");
    expect(initialesDe("  ")).toBe("?");
  });
});
