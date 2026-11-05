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

describe("services de notification autorisés", () => {
  it("accepte les services des navigateurs", async () => {
    const { serviceAutorise } = await import("@/features/push/regles");
    for (const u of [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://web.push.apple.com/QGx",
      "https://wns2-par02p.notify.windows.com/w/?token=x",
    ])
      expect(serviceAutorise(u)).toBe(true);
  });
  it("refuse toute autre adresse (relais vers un site tiers ou interne)", async () => {
    const { serviceAutorise, lireAbonnement } = await import("@/features/push/regles");
    for (const u of [
      "https://exemple.org/push/abc",
      "https://fcm.googleapis.com.exemple.org/x",
      "https://fcm.googleapis.com:8443/x",
      "https://user@fcm.googleapis.com/x",
      "http://fcm.googleapis.com/x",
      "https://169.254.169.254/latest",
    ])
      expect(serviceAutorise(u)).toBe(false);
    expect(
      lireAbonnement({
        endpoint: "https://exemple.org/push/abcdefghijkl",
        keys: { p256dh: "a".repeat(40), auth: "b".repeat(16) },
      }),
    ).toBeNull();
  });
});
