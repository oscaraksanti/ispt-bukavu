import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Case, Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import type { EtatFormulaire } from "@/lib/etat-formulaire";

type Valeurs = {
  libelle: string;
  anneeId: string;
  ouverture: string;
  cloture: string;
  frais: string;
  devise: string;
  filieres: string[];
  pieces: string;
};

/** Formulaire d'une campagne d'admission (création et modification). */
export function FormulaireCampagne({
  action,
  valeurs,
  annees,
  filieres,
  libelleEnvoi,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  valeurs: Valeurs;
  annees: { id: string; libelle: string }[];
  filieres: { id: string; nom: string }[];
  libelleEnvoi: string;
}) {
  return (
    <FormulaireAction action={action} libelleEnvoi={libelleEnvoi}>
      <div className="grid gap-5 md:grid-cols-2">
        <Champ id="libelle" libelle="Intitulé" obligatoire className="md:col-span-2">
          <Saisie
            id="libelle"
            name="libelle"
            defaultValue={valeurs.libelle}
            maxLength={120}
            placeholder="Admissions 2026-2027"
          />
        </Champ>
        <Champ id="anneeId" libelle="Année académique" obligatoire>
          <Liste id="anneeId" name="anneeId" defaultValue={valeurs.anneeId}>
            {annees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}
              </option>
            ))}
          </Liste>
        </Champ>
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Champ id="frais" libelle="Frais d'inscription" obligatoire>
            <Saisie id="frais" name="frais" inputMode="decimal" defaultValue={valeurs.frais} />
          </Champ>
          <Champ id="devise" libelle="Devise">
            <Liste id="devise" name="devise" defaultValue={valeurs.devise}>
              <option value="USD">$ (USD)</option>
              <option value="CDF">FC (CDF)</option>
            </Liste>
          </Champ>
        </div>
        <Champ id="ouverture" libelle="Ouverture du dépôt" obligatoire>
          <Saisie id="ouverture" name="ouverture" type="date" defaultValue={valeurs.ouverture} />
        </Champ>
        <Champ id="cloture" libelle="Clôture du dépôt (inclus)" obligatoire>
          <Saisie id="cloture" name="cloture" type="date" defaultValue={valeurs.cloture} />
        </Champ>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-pierre-800">Filières ouvertes</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {filieres.map((f) => (
            <label key={f.id} className="flex items-center gap-2.5 text-sm text-pierre-900">
              <Case name="filieres" value={f.id} defaultChecked={valeurs.filieres.includes(f.id)} />
              {f.nom}
            </label>
          ))}
        </div>
      </fieldset>
      <Champ
        id="pieces"
        libelle="Pièces à déposer"
        aide="Une pièce par ligne. Ajoutez « (facultatif) » en fin de ligne pour une pièce non obligatoire."
      >
        <ZoneTexte
          id="pieces"
          name="pieces"
          rows={9}
          defaultValue={valeurs.pieces}
          aria-describedby="pieces-aide"
        />
      </Champ>
    </FormulaireAction>
  );
}
