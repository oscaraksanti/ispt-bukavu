import type { Metadata } from "next";
import { Suspense } from "react";
import { CadreEspace } from "@/components/espace/cadre-espace";
import { Squelette } from "@/components/ui/elements";
import { libellePromotion } from "@/features/academique/regles";
import { exigerEtudiant } from "@/features/espaces/acces";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "Espace étudiant", template: "%s · Espace étudiant ISPT-Bukavu" },
  robots: { index: false },
};

async function Cadre({ children }: { children: React.ReactNode }) {
  const { u, profil } = await exigerEtudiant();
  const promotion = profil.inscriptions[0]?.promotion;
  return (
    <CadreEspace
      nom={u.nomComplet}
      sousTitre={`${profil.matricule}${promotion ? ` · ${libellePromotion(promotion)}` : ""}`}
      liens={[
        { libelle: "Accueil", href: "/etudiant" },
        { libelle: "Valve", href: "/etudiant/valve" },
        { libelle: "Horaire", href: "/etudiant/horaire" },
        { libelle: "Mes cours", href: "/etudiant/cours" },
        { libelle: "Notes", href: "/etudiant/notes" },
        { libelle: "Frais", href: "/etudiant/frais" },
      ]}
      autresEspaces={u.estPersonnel ? [{ libelle: "Administration", href: "/admin" }] : undefined}
    >
      {children}
    </CadreEspace>
  );
}

export default function LayoutEtudiant({ children }: LayoutProps<"/etudiant">) {
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
