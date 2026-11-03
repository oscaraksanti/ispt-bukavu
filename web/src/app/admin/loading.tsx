import { Squelette } from "@/components/ui/elements";

/** Affiché instantanément pendant le chargement d'une page de l'administration. */
export default function Chargement() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="space-y-4">
      <Squelette className="h-4 w-48" />
      <Squelette className="h-9 w-80" />
      <Squelette className="h-4 w-full max-w-xl" />
      <Squelette className="mt-8 h-48 w-full" />
    </div>
  );
}
