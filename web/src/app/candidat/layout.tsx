import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Signature } from "@/components/marque/blason";
import { Squelette } from "@/components/ui/elements";
import { exigerCandidat } from "@/features/admissions/acces";
import { seDeconnecter } from "@/features/auth/actions";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "Mon dossier", template: "%s · Candidature ISPT-Bukavu" },
  robots: { index: false },
};

async function Cadre({ children }: { children: React.ReactNode }) {
  const u = await exigerCandidat();
  return (
    <>
      <header className="border-b border-pierre-200 bg-white">
        <div className="conteneur flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Retour au site de l'ISPT-Bukavu">
            <Signature compacte />
          </Link>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-pierre-700 sm:block">{u.nomComplet}</p>
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-xs px-3 text-sm text-pierre-700 hover:bg-pierre-100"
              >
                <LogOut aria-hidden className="size-4" /> Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="contenu" className="conteneur py-10 lg:py-14">
        {children}
      </main>
    </>
  );
}

export default function LayoutCandidat({ children }: LayoutProps<"/candidat">) {
  return (
    <div className="min-h-svh bg-papier">
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
    </div>
  );
}
