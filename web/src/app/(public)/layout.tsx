import { Entete } from "@/components/public/entete";
import { PiedDePage } from "@/components/public/pied-de-page";
import { LienEvitement } from "@/components/ui/elements";

export default function LayoutPublic({ children }: LayoutProps<"/">) {
  return (
    <>
      <LienEvitement />
      <Entete />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <PiedDePage />
    </>
  );
}
