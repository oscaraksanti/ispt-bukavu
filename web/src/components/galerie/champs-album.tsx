import { Champ, Saisie, ZoneTexte } from "@/components/ui/champs";

/** Champs d'un album (création et modification). */
export function ChampsAlbum({
  album,
}: {
  album?: { titre: string; description: string | null; date: Date | null };
}) {
  const date = album?.date
    ? new Date(album.date.getTime() + 2 * 3600_000).toISOString().slice(0, 10)
    : "";
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <Champ id="titre" libelle="Titre" obligatoire className="md:col-span-2">
        <Saisie id="titre" name="titre" required maxLength={120} defaultValue={album?.titre} />
      </Champ>
      <Champ id="date" libelle="Date de l'événement">
        <Saisie id="date" name="date" type="date" defaultValue={date} />
      </Champ>
      <Champ id="description" libelle="Description (facultatif)" className="md:col-span-3">
        <ZoneTexte
          id="description"
          name="description"
          rows={3}
          maxLength={600}
          defaultValue={album?.description ?? ""}
        />
      </Champ>
    </div>
  );
}
