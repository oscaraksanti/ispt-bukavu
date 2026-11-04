import { Case, Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { TYPES_OFFRE } from "@/features/offres/regles";

/** Champs d'une offre d'insertion (création et modification). */
export function ChampsOffre({
  filieres,
  offre,
}: {
  filieres: { id: string; nom: string }[];
  offre?: {
    titre: string;
    type: string;
    organisation: string;
    lieu: string | null;
    description: string;
    lienCandidature: string | null;
    emailCandidature: string | null;
    dateLimite: Date | null;
    filieres: { id: string }[];
  };
}) {
  const dateLimite = offre?.dateLimite
    ? new Date(offre.dateLimite.getTime() + 2 * 3600_000).toISOString().slice(0, 10)
    : "";
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <Champ id="titre" libelle="Intitulé" obligatoire className="md:col-span-2">
          <Saisie id="titre" name="titre" required maxLength={140} defaultValue={offre?.titre} />
        </Champ>
        <Champ id="type" libelle="Type">
          <Liste id="type" name="type" defaultValue={offre?.type ?? "STAGE"}>
            {Object.entries(TYPES_OFFRE).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Liste>
        </Champ>
        <Champ id="organisation" libelle="Organisation" obligatoire>
          <Saisie
            id="organisation"
            name="organisation"
            required
            maxLength={140}
            defaultValue={offre?.organisation}
          />
        </Champ>
        <Champ id="lieu" libelle="Lieu">
          <Saisie id="lieu" name="lieu" maxLength={100} defaultValue={offre?.lieu ?? ""} />
        </Champ>
        <Champ id="dateLimite" libelle="Date limite de candidature">
          <Saisie id="dateLimite" name="dateLimite" type="date" defaultValue={dateLimite} />
        </Champ>
      </div>
      <Champ
        id="description"
        libelle="Description"
        obligatoire
        aide="Missions, profil recherché, durée, rémunération éventuelle. Intertitres avec « ## », listes avec « - »."
      >
        <ZoneTexte
          id="description"
          name="description"
          rows={8}
          maxLength={5000}
          required
          defaultValue={offre?.description}
          aria-describedby="description-aide"
        />
      </Champ>
      <div className="grid gap-5 md:grid-cols-2">
        <Champ id="lienCandidature" libelle="Lien pour postuler" aide="Commençant par https://">
          <Saisie
            id="lienCandidature"
            name="lienCandidature"
            type="url"
            maxLength={300}
            defaultValue={offre?.lienCandidature ?? ""}
            aria-describedby="lienCandidature-aide"
          />
        </Champ>
        <Champ id="emailCandidature" libelle="Ou adresse email de candidature">
          <Saisie
            id="emailCandidature"
            name="emailCandidature"
            type="email"
            maxLength={160}
            defaultValue={offre?.emailCandidature ?? ""}
          />
        </Champ>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-pierre-800">
          Filières visées (aucune = toutes)
        </legend>
        <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {filieres.map((f) => (
            <label key={f.id} className="flex items-center gap-2.5 text-sm text-pierre-900">
              <Case
                name="filieres"
                value={f.id}
                defaultChecked={offre?.filieres.some((x) => x.id === f.id)}
              />
              {f.nom}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
