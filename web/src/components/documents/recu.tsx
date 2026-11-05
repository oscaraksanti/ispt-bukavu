import type { Institut } from "@/features/contenu/lecture";
import {
  EnteteOfficiel,
  Feuille,
  Fiche,
  PiedFeuille,
  Signatures,
  Synthese,
  TitreDocument,
} from "./papier";

/** Reçu imprimable (paiement des frais académiques ou frais de dossier). */
export function RecuImprimable({
  institut,
  tutelle,
  titre,
  numero,
  synthese,
  details,
  mention,
  caissier,
  date,
  annulation,
}: {
  institut: Institut;
  tutelle?: string;
  titre: string;
  numero: string;
  synthese: { libelle: string; valeur: string; detail?: string; accent?: boolean }[];
  details: { libelle: string; valeur: string; mono?: boolean; large?: boolean }[];
  mention: string;
  caissier: string | null;
  date: string;
  annulation?: string | null;
}) {
  const securite = `${institut.sigle} ${titre} ${numero}`;
  return (
    <Feuille securite={securite} tampon={annulation ? { texte: "Annulé", ton: "erreur" } : null}>
      <EnteteOfficiel institut={institut} tutelle={tutelle} />
      <TitreDocument titre={titre} reference={numero} />
      {annulation && (
        <p className="mt-5 border-[0.8pt] border-erreur bg-erreur-fond px-3 py-1.5 text-center text-[8pt] font-semibold text-erreur">
          {annulation}
        </p>
      )}
      <Synthese className="mt-7" elements={synthese} />
      <Fiche className="mt-5" colonnes={2} elements={details} />
      <p className="mt-4 max-w-[150mm] text-[7.5pt] leading-relaxed text-pierre-600">{mention}</p>
      <Signatures
        className="mt-auto pt-10"
        lieu={institut.ville}
        date={date}
        signataires={[{ fonction: "La caisse", nom: caissier }]}
      />
      <PiedFeuille
        securite={securite}
        gauche={`${institut.statut} · ${institut.acteCreation}`}
        droite={`N° ${numero}`}
      />
    </Feuille>
  );
}
