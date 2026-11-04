import { Champ, Liste, Saisie, ZoneTexte } from "@/components/ui/champs";
import { enHeureBukavu, TYPES_SESSION } from "@/features/examens/regles";

/** Champs d'une session d'examens (création et modification). */
export function ChampsSession({
  session,
}: {
  session?: { libelle: string; type: string; debut: Date; fin: Date; consignes: string | null };
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Champ id="libelle" libelle="Intitulé" obligatoire>
        <Saisie
          id="libelle"
          name="libelle"
          required
          maxLength={120}
          defaultValue={session?.libelle}
          placeholder="Session ordinaire du premier semestre"
        />
      </Champ>
      <Champ id="type" libelle="Type">
        <Liste id="type" name="type" defaultValue={session?.type ?? "ORDINAIRE"}>
          {Object.entries(TYPES_SESSION).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Liste>
      </Champ>
      <Champ id="debut" libelle="Premier jour" obligatoire>
        <Saisie
          id="debut"
          name="debut"
          type="date"
          required
          defaultValue={session ? enHeureBukavu(session.debut).jour : undefined}
        />
      </Champ>
      <Champ id="fin" libelle="Dernier jour" obligatoire>
        <Saisie
          id="fin"
          name="fin"
          type="date"
          required
          defaultValue={session ? enHeureBukavu(session.fin).jour : undefined}
        />
      </Champ>
      <Champ
        id="consignes"
        libelle="Consignes aux étudiants (facultatif)"
        aide="Affichées en tête du calendrier : pièces à présenter, retard toléré, matériel autorisé… selon le règlement de l'institut."
        className="md:col-span-2"
      >
        <ZoneTexte
          id="consignes"
          name="consignes"
          rows={3}
          maxLength={3000}
          defaultValue={session?.consignes ?? ""}
          aria-describedby="consignes-aide"
        />
      </Champ>
    </div>
  );
}
