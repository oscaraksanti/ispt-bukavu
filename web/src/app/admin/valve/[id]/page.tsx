import type { Metadata } from "next";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { GestionCommunique } from "@/components/valve/gestion-communique";
import { exigerPersonnel } from "@/features/auth/acces";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Communiqué" };

export default async function PageCommunique({
  params,
  searchParams,
}: PageProps<"/admin/valve/[id]">) {
  const u = await exigerPersonnel();
  const { id } = await params;
  const { enregistre } = await searchParams;
  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Valve", href: "/admin/valve" },
          { libelle: "Communiqué" },
        ]}
        titre="Communiqué"
      />
      <div className="mt-8">
        <GestionCommunique id={id} u={u} retour="admin" enregistre={enregistre === "1"} />
      </div>
    </>
  );
}
