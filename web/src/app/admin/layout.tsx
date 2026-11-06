import type { Metadata } from "next";
import { Suspense } from "react";
import { BarreLaterale } from "@/components/admin/barre-laterale";
import { entreeAccessible, NAVIGATION_ADMIN } from "@/components/admin/navigation";
import { LienEvitement, Squelette } from "@/components/ui/elements";
import { exigerPersonnel } from "@/features/auth/acces";
import { compterConversationsNonLues } from "@/features/messagerie/requetes";
import { compterNonLues } from "@/features/notifications/requetes";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration ISPT-Bukavu" },
  robots: { index: false },
};

async function Cadre({ children }: { children: React.ReactNode }) {
  const u = await exigerPersonnel();
  const groupes = NAVIGATION_ADMIN.map((g) => ({
    ...g,
    entrees: g.entrees.filter((e) => entreeAccessible(e, u.permissions)),
  })).filter((g) => g.entrees.length > 0);
  return (
    <>
      <LienEvitement />
      <BarreLaterale
        groupes={groupes}
        nom={u.nomComplet}
        email={u.email ?? ""}
        avatar={{ id: u.id, photo: u.photo }}
        notifications={await compterNonLues(u.id)}
        messages={await compterConversationsNonLues(u.id)}
      />
      <div className="lg:pl-64">
        <main id="contenu" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
          {children}
        </main>
      </div>
    </>
  );
}

function Chargement() {
  return (
    <div className="lg:pl-64">
      <div className="fixed inset-y-0 left-0 hidden w-64 bg-encre lg:block" />
      <div className="mx-auto max-w-6xl space-y-4 px-8 py-12">
        <Squelette className="h-8 w-64" />
        <Squelette className="h-4 w-96" />
        <Squelette className="mt-10 h-40 w-full" />
      </div>
    </div>
  );
}

export default function LayoutAdministration({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-svh bg-papier">
      <Suspense fallback={<Chargement />}>
        <Cadre>{children}</Cadre>
      </Suspense>
    </div>
  );
}
