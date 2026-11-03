"use client";

import { FileSpreadsheet } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import type { EtatImport } from "@/features/academique/actions-etudiants";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";
import { MessageEtat } from "./message-etat";

/**
 * Import d'un registre d'étudiants (CSV exporté d'un tableur) en deux temps :
 * aperçu des lignes lues et des erreurs, puis import confirmé.
 */
export function ImportRegistre({
  action,
}: {
  action: (etat: EtatImport, fd: FormData) => Promise<EtatImport>;
}) {
  const [etat, envoyer, enCours] = useActionState(action, ETAT_INITIAL as EtatImport);
  const [contenu, setContenu] = useState("");
  const [nomFichier, setNomFichier] = useState("");
  const champ = useRef<HTMLInputElement>(null);
  const lignes = etat.lignes ?? [];
  const valides = lignes.filter((l) => !l.erreur).length;

  const soumettre = (mode: "apercu" | "importer") => {
    const fd = new FormData();
    fd.set("contenu", contenu);
    fd.set("mode", mode);
    startTransition(() => envoyer(fd));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Bouton type="button" variante="contour" taille="sm" onClick={() => champ.current?.click()}>
          <FileSpreadsheet aria-hidden /> Choisir le fichier CSV
        </Bouton>
        <span className="text-sm text-pierre-600">{nomFichier || "Aucun fichier"}</span>
        <input
          ref={champ}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setNomFichier(f.name);
            const texte = await f.text();
            setContenu(texte);
            const fd = new FormData();
            fd.set("contenu", texte);
            fd.set("mode", "apercu");
            startTransition(() => envoyer(fd));
          }}
        />
      </div>
      <p className="text-xs text-pierre-500">
        Depuis Excel : Fichier › Enregistrer sous › CSV. Colonnes attendues : « Nom, post-nom et
        prénom », « Sexe », « Matricule », et facultativement « Email ».
      </p>
      <MessageEtat etat={etat} />
      {lignes.length > 0 && (
        <>
          <div className="max-h-80 overflow-auto rounded-xs border border-pierre-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-pierre-50 font-mono text-xs text-pierre-600 uppercase">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Ligne
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Nom
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Post-nom
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Prénom
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Sexe
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Matricule
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Remarque
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pierre-200">
                {lignes.map((l) => (
                  <tr key={l.ligne} className={l.erreur ? "bg-erreur-fond" : ""}>
                    <td className="px-3 py-1.5 font-mono text-xs">{l.ligne}</td>
                    <td className="px-3 py-1.5">{l.nom}</td>
                    <td className="px-3 py-1.5">{l.postnom}</td>
                    <td className="px-3 py-1.5">{l.prenom}</td>
                    <td className="px-3 py-1.5">{l.sexe}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{l.matricule}</td>
                    <td className="px-3 py-1.5 text-xs text-erreur">{l.erreur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-pierre-700">
              {valides} ligne(s) prête(s) à importer
              {lignes.length - valides > 0 && `, ${lignes.length - valides} ignorée(s)`}. Vérifiez
              la séparation des noms et prénoms avant de confirmer.
            </p>
            <Bouton
              type="button"
              variante="institutionnel"
              disabled={enCours || valides === 0}
              onClick={() => soumettre("importer")}
            >
              {enCours ? "Import en cours…" : `Importer ${valides} étudiant(s)`}
            </Bouton>
          </div>
        </>
      )}
    </div>
  );
}
