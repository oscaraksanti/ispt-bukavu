import type { Metadata } from "next";
import { Suspense } from "react";
import { CadreEspace } from "@/components/espace/cadre-espace";
import { Squelette } from "@/components/ui/elements";
import { compterNonLues } from "@/features/notifications/requetes";
import { exigerEnseignant } from "@/features/espaces/acces";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "Espace enseignant", template: "%s · Espace enseignant ISPT-Bukavu" },
  robots: { index: false },
};

async function Cadre({ children }: { children: React.ReactNode }) {
  const { u, profil } = await exigerEnseignant();
  return (
    <CadreEspace
      nom={[profil.titre, u.nomComplet].filter(Boolean).join(" ")}
      sousTitre={profil.domaine ?? "Enseignant"}
      liens={[
        { libelle: "Mes cours", href: "/enseignant" },
        { libelle: "Horaire", href: "/enseignant/horaire" },
        { libelle: "Valve", href: "/enseignant/valve" },
        { libelle: "Stages", href: "/enseignant/stages" },
      ]}
      notifications={{ href: "/enseignant/notifications", nombre: await compterNonLues(u.id) }}
      autresEspaces={u.estPersonnel ? [{ libelle: "Administration", href: "/admin" }] : undefined}
    >
      {children}
    </CadreEspace>
  );
}

export default function LayoutEnseignant({ children }: LayoutProps<"/enseignant">) {
  return (
    <Suspense
      fallback={
        <div className="conteneur space-y-4 py-14">
          <Squelette className="h-8 w-72" />
          <Squelette className="h-40 w-full" />
        </div>
      }
    >
      <Cadre>{children}</Cadre>
    </Suspense>
  );
}
