import type { Metadata } from "next";
import { Suspense } from "react";
import { CadreEspace } from "@/components/espace/cadre-espace";
import { Squelette } from "@/components/ui/elements";
import { compterConversationsNonLues } from "@/features/messagerie/requetes";
import { compterNonLues } from "@/features/notifications/requetes";
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
      compte="/etudiant/compte"
      aide="/aide/etudiant"
      nom={u.nomComplet}
      sousTitre={`${profil.matricule}${promotion ? ` · ${libellePromotion(promotion)}` : ""}`}
      liens={[
        { libelle: "Accueil", href: "/etudiant" },
        { libelle: "Valve", href: "/etudiant/valve" },
        { libelle: "Horaire", href: "/etudiant/horaire" },
        { libelle: "Examens", href: "/etudiant/examens" },
        { libelle: "Mes cours", href: "/etudiant/cours" },
        { libelle: "Notes", href: "/etudiant/notes" },
        { libelle: "Résultats", href: "/etudiant/resultats" },
        { libelle: "Frais", href: "/etudiant/frais" },
        { libelle: "Stages", href: "/etudiant/stages" },
        { libelle: "Documents", href: "/etudiant/documents" },
      ]}
      notifications={{ href: "/etudiant/notifications", nombre: await compterNonLues(u.id) }}
      messages={{
        href: "/etudiant/messages",
        nombre: await compterConversationsNonLues(u.id),
      }}
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
