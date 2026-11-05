import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntetePage } from "@/components/public/entete-page";
import { TransitionPage } from "@/components/public/transition-page";
import { Champ, Saisie } from "@/components/ui/champs";
import { normaliserCodeDocument } from "@/features/documents/regles";

export const metadata: Metadata = {
  title: "Vérifier un document",
  description:
    "Vérifiez l'authenticité d'une attestation ou d'un relevé de notes délivré par l'ISPT-Bukavu.",
};

async function verifier(fd: FormData) {
  "use server";
  const code = normaliserCodeDocument(String(fd.get("code") ?? ""));
  redirect(`/verifier/${code || "-"}`);
}

export default function Verifier() {
  return (
    <TransitionPage>
      <EntetePage
        ariane={[{ libelle: "Accueil", href: "/" }, { libelle: "Vérifier un document" }]}
        surtitre="Documents officiels"
        titre="Vérifier un document"
        intro="Chaque attestation et chaque relevé délivrés par l'institut portent un code et un QR code. Saisissez le code pour confirmer que le document est authentique et toujours valable."
      />
      <section className="conteneur max-w-xl py-14 lg:py-20">
        <form
          action={verifier}
          className="revele space-y-5 rounded-md border border-pierre-200 bg-white p-6 sm:p-8"
        >
          <Champ
            id="code"
            libelle="Code du document"
            aide="Douze caractères, par exemple ABCD-EFGH-JKMN."
          >
            <Saisie
              id="code"
              name="code"
              required
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono tracking-wider"
              aria-describedby="code-aide"
            />
          </Champ>
          <button
            type="submit"
            className="h-11 w-full rounded-xs bg-ispt-600 text-corps font-medium text-white hover:bg-ispt-700"
          >
            Vérifier
          </button>
        </form>
      </section>
    </TransitionPage>
  );
}
