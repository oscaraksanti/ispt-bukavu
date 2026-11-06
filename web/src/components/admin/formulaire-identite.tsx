import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import type { EtatFormulaire } from "@/lib/etat-formulaire";

/** Correction de l'identité d'un compte (droit de rectification), par le secrétariat. */
export function FormulaireIdentite({
  action,
  valeurs,
  etudiant,
}: {
  action: (e: EtatFormulaire, fd: FormData) => Promise<EtatFormulaire>;
  valeurs: {
    prenom: string | null;
    nom: string;
    postnom: string | null;
    email: string | null;
    telephone: string | null;
    matricule?: string;
    sexe?: string | null;
  };
  etudiant: boolean;
}) {
  return (
    <FormulaireAction action={action} libelleEnvoi="Enregistrer la correction">
      <div className="grid gap-5 sm:grid-cols-3">
        <Champ id="nom" libelle="Nom" obligatoire>
          <Saisie id="nom" name="nom" defaultValue={valeurs.nom} required maxLength={80} />
        </Champ>
        <Champ id="postnom" libelle="Post-nom">
          <Saisie id="postnom" name="postnom" defaultValue={valeurs.postnom ?? ""} maxLength={80} />
        </Champ>
        <Champ id="prenom" libelle="Prénom">
          <Saisie id="prenom" name="prenom" defaultValue={valeurs.prenom ?? ""} maxLength={80} />
        </Champ>
      </div>
      {etudiant && (
        <div className="grid grid-cols-[1fr_8rem] gap-5">
          <Champ id="matricule" libelle="Matricule" obligatoire>
            <Saisie
              id="matricule"
              name="matricule"
              defaultValue={valeurs.matricule ?? ""}
              autoCapitalize="characters"
              required
            />
          </Champ>
          <Champ id="sexe" libelle="Sexe">
            <Liste id="sexe" name="sexe" defaultValue={valeurs.sexe ?? ""}>
              <option value="">—</option>
              <option value="F">F</option>
              <option value="M">M</option>
            </Liste>
          </Champ>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ
          id="email"
          libelle={etudiant ? "Adresse email (facultative)" : "Adresse email"}
          obligatoire={!etudiant}
        >
          <Saisie
            id="email"
            name="email"
            type="email"
            defaultValue={valeurs.email ?? ""}
            required={!etudiant}
            autoComplete="off"
          />
        </Champ>
        <Champ id="telephone" libelle="Téléphone">
          <Saisie
            id="telephone"
            name="telephone"
            type="tel"
            defaultValue={valeurs.telephone ?? ""}
            autoComplete="off"
          />
        </Champ>
      </div>
      <p className="text-detail text-pierre-500">
        La correction est inscrite au journal d&apos;activité, avec l&apos;état avant et après.
      </p>
    </FormulaireAction>
  );
}
