import { describe, expect, it } from "vitest";
import {
  destinationSure,
  estBloque,
  MAX_ECHECS_PAR_COMPTE,
  MAX_ECHECS_PAR_EMAIL,
  MAX_ECHECS_PAR_IP,
  normaliserEmail,
  verifierMotDePasse,
} from "@/features/auth/regles";
import { compteModifiable, rolesAttribuables } from "@/features/comptes/regles";
import { cleMedia, nomDeFichierSur, tailleLisible } from "@/features/medias/regles";
import { urlMedia } from "@/features/medias/url";
import { PERMISSIONS, ROLES_PAR_DEFAUT, ROLES_PERSONNEL } from "@/lib/permissions";

describe("politique de mot de passe", () => {
  it("exige au moins 10 caractères, des lettres et des chiffres", () => {
    expect(verifierMotDePasse("court1")).not.toBeNull();
    expect(verifierMotDePasse("seulementdeslettres")).not.toBeNull();
    expect(verifierMotDePasse("1234567890")).not.toBeNull();
    expect(verifierMotDePasse("Bukavu-2026")).toBeNull();
    expect(verifierMotDePasse("a1".repeat(65))).not.toBeNull();
  });
});

describe("limitation des tentatives", () => {
  it("bloque à partir du plafond par email ou par adresse IP", () => {
    expect(estBloque(MAX_ECHECS_PAR_EMAIL - 1, 0)).toBe(false);
    expect(estBloque(MAX_ECHECS_PAR_EMAIL, 0)).toBe(true);
    expect(estBloque(0, MAX_ECHECS_PAR_IP)).toBe(true);
  });

  it("ne laisse pas un tiers bloquer un compte depuis une autre connexion", () => {
    // Le tiers a épuisé ses essais depuis son adresse : le compte reste ouvert ailleurs.
    expect(estBloque(0, 0, MAX_ECHECS_PAR_EMAIL * 2)).toBe(false);
    expect(estBloque(0, 0, MAX_ECHECS_PAR_COMPTE)).toBe(true);
  });
});

describe("redirection après connexion", () => {
  it("n'accepte que des chemins internes", () => {
    expect(destinationSure("/admin/medias")).toBe("/admin/medias");
    expect(destinationSure("https://exemple.com")).toBe("/admin");
    expect(destinationSure("//exemple.com")).toBe("/admin");
    expect(destinationSure("/\\exemple.com")).toBe("/admin");
    expect(destinationSure(null)).toBe("/admin");
    expect(destinationSure("/\t/exemple.com")).toBe("/admin");
    expect(destinationSure("/%09/exemple.com")).toBe("/%09/exemple.com");
    expect(destinationSure("/etudiant/notes?s=1#a")).toBe("/etudiant/notes?s=1#a");
  });

  it("normalise les adresses email", () => {
    expect(normaliserEmail("  Oscar@Example.ORG ")).toBe("oscar@example.org");
  });
});

describe("rôles et permissions", () => {
  it("donne toutes les permissions à l'administrateur technique", () => {
    const sa = ROLES_PAR_DEFAUT.find((r) => r.code === "super_admin")!;
    expect(new Set(sa.permissions)).toEqual(new Set(Object.keys(PERMISSIONS)));
  });

  it("ne référence que des permissions existantes", () => {
    for (const r of ROLES_PAR_DEFAUT)
      for (const p of r.permissions) expect(PERMISSIONS, `${r.code}: ${p}`).toHaveProperty(p);
  });

  it("ne donne aucune permission d'administration aux étudiants et candidats", () => {
    for (const code of ["etudiant", "candidat"]) {
      expect(ROLES_PAR_DEFAUT.find((r) => r.code === code)!.permissions).toEqual([]);
      expect(ROLES_PERSONNEL).not.toContain(code);
    }
  });

  it("réserve l'attribution du rôle d'administrateur technique", () => {
    const admin = { roles: ["secretariat_administratif"], permissions: ["utilisateurs.gerer"] };
    const sa = { roles: ["super_admin"], permissions: [] };
    expect(rolesAttribuables(admin)).not.toContain("super_admin");
    expect(rolesAttribuables(sa)).toContain("super_admin");
    expect(rolesAttribuables(sa)).not.toContain("etudiant");
  });

  it("n'attribue jamais un rôle plus puissant que son auteur", () => {
    const catalogue = ROLES_PAR_DEFAUT.map((r) => ({
      code: r.code,
      permissions: [...r.permissions],
    }));
    const admin = ROLES_PAR_DEFAUT.find((r) => r.code === "secretariat_administratif")!;
    const permis = rolesAttribuables(
      { roles: [admin.code], permissions: admin.permissions },
      catalogue,
    );
    expect(permis).toContain("secretariat_administratif");
    expect(permis).not.toContain("direction");
    expect(permis).not.toContain("secretariat_academique");
    expect(permis).toContain("enseignant");
  });

  it("protège son propre compte et celui de l'administrateur technique", () => {
    const gestionnaire = { id: "a", roles: ["secretariat_administratif"] };
    expect(compteModifiable(gestionnaire, { id: "a", roles: ["secretariat_administratif"] })).toBe(
      false,
    );
    expect(compteModifiable(gestionnaire, { id: "b", roles: ["super_admin"] })).toBe(false);
    expect(compteModifiable(gestionnaire, { id: "b", roles: ["enseignant"] })).toBe(true);
    expect(
      compteModifiable({ id: "a", roles: ["super_admin"] }, { id: "a", roles: ["super_admin"] }),
    ).toBe(true);
  });
});

describe("médiathèque", () => {
  it("produit des noms de fichiers sûrs", () => {
    expect(nomDeFichierSur("Collation 2026 — Remise (1).JPG")).toBe("collation-2026-remise-1");
    expect(nomDeFichierSur("../../etc/passwd")).toBe("passwd");
    expect(nomDeFichierSur("???.png")).toBe("image");
  });

  it("range les fichiers par année et par mois", () => {
    expect(cleMedia(new Date("2026-11-03T12:00:00Z"), "ab12", "Photo.jpg")).toBe(
      "medias/2026/11/ab12-photo.webp",
    );
  });

  it("sert les photos officielles et les fichiers envoyés depuis la bonne adresse", () => {
    expect(urlMedia("public/photos/a.jpg")).toBe("/photos/a.jpg");
    expect(urlMedia("medias/2026/11/ab12-photo.webp")).toBe("/medias/2026/11/ab12-photo.webp");
  });

  it("affiche les tailles en unités françaises", () => {
    expect(tailleLisible(512)).toBe("512 o");
    expect(tailleLisible(250 * 1024)).toBe("250 Ko");
    expect(tailleLisible(1.5 * 1024 * 1024)).toBe("1,5 Mo");
  });
});

describe("connexion à la base", () => {
  it("adopte la sémantique libpq pour sslmode=require", async () => {
    const { adapterChaine, BASE_ABSENTE } = await import("@/lib/connexion");
    expect(adapterChaine("postgres://u:p@h:6543/db?sslmode=require&pgbouncer=true")).toBe(
      "postgres://u:p@h:6543/db?sslmode=require&pgbouncer=true&uselibpqcompat=true",
    );
    expect(adapterChaine("postgres://u@h/db")).toBe("postgres://u@h/db");
    expect(adapterChaine(undefined)).toBe(BASE_ABSENTE);
  });
});

import { normaliserIdentifiant } from "@/features/auth/regles";

describe("identifiant de connexion", () => {
  it("accepte une adresse email ou un matricule", () => {
    expect(normaliserIdentifiant(" Oscar@Example.org ")).toBe("oscar@example.org");
    expect(normaliserIdentifiant(" isp 2025 0042 ")).toBe("ISP20250042");
  });
});
