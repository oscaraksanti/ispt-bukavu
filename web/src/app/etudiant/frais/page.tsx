import type { Metadata } from "next";
import { SituationFinanciere } from "@/components/finances/situation";
import { EtatVide } from "@/components/ui/elements";
import { exigerEtudiant } from "@/features/espaces/acces";
import { situationEtudiant } from "@/features/finances/requetes";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Frais" };

export default async function FraisEtudiant() {
  const { profil } = await exigerEtudiant();
  const s = await situationEtudiant(profil.id);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-titre-page leading-tight">Frais académiques</h1>
      <p className="mt-2 text-pierre-600">
        Paiements enregistrés par la caisse de l&apos;institut. Conservez vos bordereaux : la
        référence figure sur chaque reçu.
      </p>
      <div className="mt-8">
        {s ? <SituationFinanciere s={s} /> : <EtatVide titre="Aucune année académique en cours" />}
      </div>
    </div>
  );
}
