import { CircleHelp, CircleUserRound, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Signature } from "@/components/marque/blason";
import { Cloche } from "@/components/notifications/cloche";
import { LienEvitement, Squelette } from "@/components/ui/elements";
import { exigerCandidat } from "@/features/admissions/acces";
import { seDeconnecter } from "@/features/auth/actions";
import { compterNonLues } from "@/features/notifications/requetes";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "Mon dossier", template: "%s · Candidature ISPT-Bukavu" },
  robots: { index: false },
};

async function Cadre({ children }: { children: React.ReactNode }) {
  const u = await exigerCandidat();
  const nonLues = await compterNonLues(u.id);
  return (
    <>
      <LienEvitement />
      <header className="border-b border-pierre-200 bg-white">
        <div className="conteneur flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Retour au site de l'ISPT-Bukavu">
            <Signature compacte />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/candidat/compte"
              className="inline-flex size-10 items-center justify-center rounded-xs text-pierre-700 hover:bg-pierre-100 sm:size-auto sm:px-2 sm:py-2"
            >
              <span className="sr-only">Mon compte, </span>
              <span className="hidden text-sm sm:block">{u.nomComplet}</span>
              <CircleUserRound aria-hidden className="size-5 sm:hidden" />
            </Link>
            <Link
              prefetch={false}
              href="/aide/candidat"
              className="inline-flex size-10 items-center justify-center rounded-xs text-pierre-700 hover:bg-pierre-100"
            >
              <CircleHelp aria-hidden className="size-5" />
              <span className="sr-only">Aide</span>
            </Link>
            <Cloche href="/candidat/notifications" nombre={nonLues} />
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-xs px-3 text-sm text-pierre-700 hover:bg-pierre-100"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="sr-only sm:not-sr-only">Se déconnecter</span>
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
