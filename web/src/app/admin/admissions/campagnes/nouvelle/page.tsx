import type { Metadata } from "next";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireCampagne } from "@/components/admin/formulaire-campagne";
import { enregistrerCampagne } from "@/features/admissions/actions-admin";
import { exigerPermission } from "@/features/auth/acces";
import { lirePage } from "@/features/contenu/lecture";
import { lecteur } from "@/features/contenu/lecteur";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Nouvelle campagne" };

export default async function NouvelleCampagne() {
  await exigerPermission("admissions.campagnes");
  const [annees, filieres, pageAdmissions] = await Promise.all([
    db.anneeAcademique.findMany({ orderBy: { debut: "desc" } }),
    db.filiere.findMany({ where: { ouverte: true }, orderBy: { ordre: "asc" } }),
    lirePage("admissions"),
  ]);
  const courante = annees.find((a) => a.courante) ?? annees[0];
  // Pièces reprises de la page Admissions, sans la ligne des frais (saisis à part).
  const pieces = lecteur(pageAdmissions.pieces)
    .liste("liste")
    .map((p) => p.texte("libelle"))
    .filter((l) => l && !/^frais/i.test(l))
    .join("\n");
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Campagnes", href: "/admin/admissions/campagnes" },
          { libelle: "Nouvelle" },
        ]}
        titre="Nouvelle campagne"
        description="La campagne est créée en brouillon : publiez-la depuis la liste pour ouvrir le dépôt."
      />
      <Panneau className="mt-8">
        <FormulaireCampagne
          action={enregistrerCampagne.bind(null, null)}
          libelleEnvoi="Créer la campagne"
          annees={annees}
          filieres={filieres}
          valeurs={{
            libelle: courante ? `Admissions ${courante.libelle}` : "",
            anneeId: courante?.id ?? "",
            ouverture: "",
            cloture: "",
            frais: "10",
            devise: "USD",
            filieres: filieres.map((f) => f.id),
            pieces,
          }}
        />
      </Panneau>
    </>
  );
}
