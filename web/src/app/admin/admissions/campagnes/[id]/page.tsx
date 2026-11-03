import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireCampagne } from "@/components/admin/formulaire-campagne";
import { versChampDate } from "@/features/actualites/dates";
import { enregistrerCampagne } from "@/features/admissions/actions-admin";
import { exigerPermission } from "@/features/auth/acces";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Campagne d'admission" };

export default async function Campagne({ params }: PageProps<"/admin/admissions/campagnes/[id]">) {
  await exigerPermission("admissions.campagnes");
  const { id } = await params;
  const [c, annees, filieres] = await Promise.all([
    db.campagneAdmission.findUnique({
      where: { id },
      include: { filieres: true, pieces: { orderBy: { ordre: "asc" } } },
    }),
    db.anneeAcademique.findMany({ orderBy: { debut: "desc" } }),
    db.filiere.findMany({ orderBy: { ordre: "asc" } }),
  ]);
  if (!c) notFound();
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Campagnes", href: "/admin/admissions/campagnes" },
          { libelle: c.libelle },
        ]}
        titre={c.libelle}
      />
      <Panneau className="mt-8">
        <FormulaireCampagne
          action={enregistrerCampagne.bind(null, c.id)}
          libelleEnvoi="Enregistrer"
          annees={annees}
          filieres={filieres}
          valeurs={{
            libelle: c.libelle,
            anneeId: c.anneeId,
            ouverture: versChampDate(c.ouverture).slice(0, 10),
            cloture: versChampDate(c.cloture).slice(0, 10),
            frais: c.fraisInscription.toString(),
            devise: c.devise,
            filieres: c.filieres.map((f) => f.id),
            pieces: c.pieces
              .map((p) => p.libelle + (p.obligatoire ? "" : " (facultatif)"))
              .join("\n"),
          }}
        />
      </Panneau>
    </>
  );
}
