import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import { masquerAdresse, nettoyerEvenement, relaisSentry } from "@/lib/surveillance";

const DSN = "https://cle123@o42.ingest.de.sentry.io/4510000000000001";
const enveloppe = (dsn: unknown) =>
  `${JSON.stringify({ dsn, sent_at: "x" })}\n{"type":"event"}\n{}`;

describe("masquerAdresse", () => {
  it("masque les jetons à usage unique et retire la requête", () => {
    expect(masquerAdresse("https://www.isptbukavu.org/reinitialiser/abc123?x=1")).toBe(
      "https://www.isptbukavu.org/reinitialiser/[jeton]",
    );
    expect(masquerAdresse("/confirmer-email/zzz#haut")).toBe("/confirmer-email/[jeton]");
    expect(masquerAdresse("/anciens/retrait/tok")).toBe("/anciens/retrait/[jeton]");
  });
  it("laisse les autres chemins intacts (hors requête)", () => {
    expect(masquerAdresse("/etudiant/notes?annee=2")).toBe("/etudiant/notes");
    expect(masquerAdresse("/valve/12")).toBe("/valve/12");
  });
});

describe("nettoyerEvenement", () => {
  it("retire identité, cookies, corps et paramètres", () => {
    const e = nettoyerEvenement({
      type: undefined,
      user: { email: "a@b.c" },
      transaction: "/reinitialiser/secret",
      request: {
        url: "https://x.org/reinitialiser/secret?q=1",
        cookies: { session: "s" },
        data: { motDePasse: "p" },
        query_string: "q=1",
      },
      breadcrumbs: [{ data: { url: "/confirmer-email/t", from: "/", to: "/activer/c" } }],
    } as ErrorEvent);
    expect(e.user).toBeUndefined();
    expect(e.request).toEqual({ url: "https://x.org/reinitialiser/[jeton]" });
    expect(e.transaction).toBe("/reinitialiser/[jeton]");
    expect(e.breadcrumbs?.[0].data).toEqual({
      url: "/confirmer-email/[jeton]",
      from: "/",
      to: "/activer/[jeton]",
    });
  });
});

describe("relaisSentry", () => {
  it("accepte une enveloppe destinée au projet configuré", () => {
    expect(relaisSentry(enveloppe(DSN), DSN)).toBe(
      "https://o42.ingest.de.sentry.io/api/4510000000000001/envelope/",
    );
  });
  it("refuse tout autre destinataire ou une enveloppe invalide", () => {
    expect(relaisSentry(enveloppe("https://k@evil.example/1"), DSN)).toBeNull();
    expect(relaisSentry(enveloppe(undefined), DSN)).toBeNull();
    expect(relaisSentry("pas du json", DSN)).toBeNull();
    expect(relaisSentry(enveloppe("http://k@h/1"), "http://k@h/1")).toBeNull();
    expect(relaisSentry(enveloppe("https://k@h/abc"), "https://k@h/abc")).toBeNull();
  });
});
