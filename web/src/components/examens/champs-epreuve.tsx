import { Case, Champ, Liste, Saisie } from "@/components/ui/champs";
import { enHeureBukavu, MODALITES } from "@/features/examens/regles";

export type CoursProposes = { promotion: string; cours: { id: string; intitule: string }[] }[];

/** Champs d'une épreuve. Le préfixe rend les identifiants uniques sur la page. */
export function ChampsEpreuve({
  prefixe,
  cours,
  enseignants,
  bornes,
  epreuve,
}: {
  prefixe: string;
  cours: CoursProposes;
  enseignants: { id: string; nom: string }[];
  bornes: { min: string; max: string };
  epreuve?: {
    coursOffertId: string;
    debut: Date;
    fin: Date;
    salle: string | null;
    modalite: string;
    remarque: string | null;
    surveillants: { enseignantId: string }[];
  };
}) {
  const id = (cle: string) => `${prefixe}-${cle}`;
  const debut = epreuve ? enHeureBukavu(epreuve.debut) : null;
  const fin = epreuve ? enHeureBukavu(epreuve.fin) : null;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Champ id={id("cours")} libelle="Cours" obligatoire className="md:col-span-2">
          <Liste
            id={id("cours")}
            name="coursOffertId"
            required
            defaultValue={epreuve?.coursOffertId ?? ""}
          >
            <option value="">Choisir…</option>
            {cours.map((p) => (
              <optgroup key={p.promotion} label={p.promotion}>
                {p.cours.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.intitule}
                  </option>
                ))}
              </optgroup>
            ))}
          </Liste>
        </Champ>
        <Champ id={id("jour")} libelle="Jour" obligatoire>
          <Saisie
            id={id("jour")}
            name="jour"
            type="date"
            required
            min={bornes.min}
            max={bornes.max}
            defaultValue={debut?.jour ?? bornes.min}
          />
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          <Champ id={id("debut")} libelle="Début" obligatoire>
            <Saisie
              id={id("debut")}
              name="debut"
              type="time"
              required
              step={900}
              defaultValue={debut?.heure ?? "08:00"}
            />
          </Champ>
          <Champ id={id("fin")} libelle="Fin" obligatoire>
            <Saisie
              id={id("fin")}
              name="fin"
              type="time"
              required
              step={900}
              defaultValue={fin?.heure ?? "11:00"}
            />
          </Champ>
        </div>
        <Champ id={id("salle")} libelle="Salle">
          <Saisie
            id={id("salle")}
            name="salle"
            maxLength={60}
            defaultValue={epreuve?.salle ?? ""}
          />
        </Champ>
        <Champ id={id("modalite")} libelle="Modalité">
          <Liste id={id("modalite")} name="modalite" defaultValue={epreuve?.modalite ?? "ECRIT"}>
            {Object.entries(MODALITES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Liste>
        </Champ>
        <Champ id={id("remarque")} libelle="Remarque (facultatif)" className="md:col-span-2">
          <Saisie
            id={id("remarque")}
            name="remarque"
            maxLength={300}
            defaultValue={epreuve?.remarque ?? ""}
            placeholder="Calculatrice autorisée, apporter le matériel de dessin…"
          />
        </Champ>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-pierre-800">Surveillants (6 au plus)</legend>
        {enseignants.length === 0 ? (
          <p className="mt-2 text-sm text-pierre-600">Aucun enseignant enregistré.</p>
        ) : (
          <div className="mt-3 grid max-h-48 gap-x-6 gap-y-2 overflow-y-auto sm:grid-cols-2">
            {enseignants.map((e) => (
              <label key={e.id} className="flex items-center gap-2.5 text-sm text-pierre-900">
                <Case
                  name="surveillants"
                  value={e.id}
                  defaultChecked={epreuve?.surveillants.some((s) => s.enseignantId === e.id)}
                />
                {e.nom}
              </label>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  );
}
