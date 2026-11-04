import { FileText } from "lucide-react";
import { BoutonAction } from "@/components/admin/bouton-action";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Saisie } from "@/components/ui/champs";
import { Etiquette } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import {
  refuserPaiementDossier,
  verifierPaiementDossier,
} from "@/features/admissions/actions-admin";
import { type EtatPaiement, LIBELLES_PAIEMENT } from "@/features/admissions/regles";
import { MODES_PAIEMENT } from "@/features/finances/regles";

const TON: Record<EtatPaiement, "neutre" | "ispt" | "succes" | "erreur" | "attention"> = {
  SANS_FRAIS: "neutre",
  A_SAISIR: "attention",
  A_VERIFIER: "ispt",
  VERIFIE: "succes",
  REFUSE: "erreur",
};

/** État des frais de dossier d'un candidat et, pour la caisse, vérification ou refus. */
export function PaiementDossier({
  dossier: d,
  etat,
  peutEncaisser,
}: {
  dossier: {
    id: string;
    referencePaiement: string | null;
    modePaiement: keyof typeof MODES_PAIEMENT | null;
    paiementMotifRefus: string | null;
    paiementVerifieLe: Date | null;
    numeroRecu: string | null;
  };
  etat: EtatPaiement;
  peutEncaisser: boolean;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Etiquette ton={TON[etat]}>{LIBELLES_PAIEMENT[etat]}</Etiquette>
        {d.paiementVerifieLe && (
          <span className="text-pierre-600">le {formatJour.format(d.paiementVerifieLe)}</span>
        )}
      </div>
      <p className="text-pierre-800">
        {d.referencePaiement ? (
          <>
            Référence <span className="font-mono">{d.referencePaiement}</span>
            {d.modePaiement ? ` · ${MODES_PAIEMENT[d.modePaiement]}` : ""}
          </>
        ) : (
          "Aucune référence indiquée."
        )}
      </p>
      {etat === "REFUSE" && d.paiementMotifRefus && (
        <p className="text-erreur">Refus communiqué : {d.paiementMotifRefus}</p>
      )}
      {d.numeroRecu && (
        <a
          href={`/recu-dossier/${d.id}`}
          className="inline-flex items-center gap-1.5 font-medium text-ispt-700 underline hover:no-underline"
        >
          <FileText aria-hidden className="size-4" /> Reçu n° {d.numeroRecu}
        </a>
      )}
      {peutEncaisser && etat === "A_VERIFIER" && (
        <div className="space-y-3 border-t border-pierre-200 pt-3">
          <BoutonAction
            action={verifierPaiementDossier.bind(null, d.id)}
            variante="institutionnel"
            confirmation="Paiement reçu ?"
          >
            Paiement reçu : émettre le reçu
          </BoutonAction>
          <details>
            <summary className="cursor-pointer text-ispt-700">Référence introuvable</summary>
            <div className="mt-3">
              <FormulaireAction
                action={refuserPaiementDossier.bind(null, d.id)}
                libelleEnvoi="Prévenir le candidat"
              >
                <Champ id={`motif-paiement-${d.id}`} libelle="Message au candidat">
                  <Saisie
                    id={`motif-paiement-${d.id}`}
                    name="motif"
                    maxLength={300}
                    placeholder="Aucun versement ne correspond à cette référence…"
                  />
                </Champ>
              </FormulaireAction>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
