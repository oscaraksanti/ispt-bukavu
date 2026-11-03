import { Entete } from "@/components/public/entete";
import { PiedDePage } from "@/components/public/pied-de-page";

export default function LayoutPublic({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 bg-chantier px-4 py-2 text-encre focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Aller au contenu
      </a>
      <Entete />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <PiedDePage />
    </>
  );
}
