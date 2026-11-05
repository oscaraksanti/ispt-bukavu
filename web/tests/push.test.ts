import { describe, expect, it } from "vitest";
import { abonnementPerime, chargeUtile, lireAbonnement } from "@/features/push/regles";

describe("notifications sur le téléphone", () => {
  it("borne les textes et refuse les liens externes", () => {
    const c = JSON.parse(
      chargeUtile({
        titre: "x".repeat(200),
        corps: "Bonjour\n\n  tout le monde",
        lien: "https://pirate.cd",
      }),
    );
    expect(c.titre).toHaveLength(80);
    expect(c.corps).toBe("Bonjour tout le monde");
    expect(c.lien).toBe("/");
    expect(JSON.parse(chargeUtile({ titre: "a", corps: "b", lien: "//pirate.cd" })).lien).toBe("/");
    expect(JSON.parse(chargeUtile({ titre: "a", corps: "b", lien: "/etudiant/notes" })).lien).toBe(
      "/etudiant/notes",
    );
  });

  it("vérifie l'abonnement envoyé par le navigateur", () => {
    const valide = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123def456",
      keys: {
        p256dh:
          "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
        auth: "tBHItJI5svbpez7KI4CCXg",
      },
    };
    expect(lireAbonnement(valide)).toEqual({
      endpoint: valide.endpoint,
      p256dh: valide.keys.p256dh,
      auth: valide.keys.auth,
    });
    expect(lireAbonnement({ ...valide, endpoint: "http://exemple.cd/x" })).toBeNull();
    expect(
      lireAbonnement({ endpoint: valide.endpoint, keys: { p256dh: "<script>", auth: "x" } }),
    ).toBeNull();
    expect(lireAbonnement("n'importe quoi")).toBeNull();
  });

  it("supprime les abonnements que le service déclare disparus", () => {
    expect(abonnementPerime(410)).toBe(true);
    expect(abonnementPerime(404)).toBe(true);
    expect(abonnementPerime(500)).toBe(false);
  });
});
