"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import type { EtatImportPersonnel } from "@/features/comptes/actions";
import { MODELE_CSV_PERSONNEL } from "@/features/comptes/import";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";
import { MessageEtat } from "./message-etat";

/**
 * Invitation en masse à partir d'une liste CSV : aperçu des lignes lues et
 * des erreurs, puis création des comptes et envoi des invitations.
 */
export function ImportPersonnel({
  action,
  libellesRoles,
}: {
  action: (etat: EtatImportPersonnel, fd: FormData) => Promise<EtatImportPersonnel>;
  libellesRoles: Record<string, string>;
}) {
  const [etat, envoyer, enCours] = useActionState(action, ETAT_INITIAL as EtatImportPersonnel);
  const [contenu, setContenu] = useState("");
  const [nomFichier, setNomFichier] = useState("");
  const champ = useRef<HTMLInputElement>(null);
  const lignes = etat.statut === "succes" ? [] : (etat.lignes ?? []);
  const valides = lignes.filter((l) => !l.erreur).length;
  const modele = `data:text/csv;charset=utf-8,${encodeURIComponent(`﻿${MODELE_CSV_PERSONNEL}`)}`;

  const soumettre = (mode: "apercu" | "importer", texte = contenu) => {
    const fd = new FormData();
    fd.set("contenu", texte);
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
        <a
          href={modele}
          download="modele-personnel.csv"
          className="inline-flex items-center gap-1.5 text-sm text-ispt-700 underline hover:no-underline"
        >
          <Download aria-hidden className="size-4" /> Télécharger le modèle
        </a>
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
            soumettre("apercu", texte);
          }}
        />
      </div>
      <p className="text-xs text-pierre-600">
        Depuis Excel : Fichier › Enregistrer sous › CSV. Colonnes : « Prénom », « Nom », « Post-nom
        », « Email », « Rôle » (par exemple Appariteur, Caisse, Enseignant ; plusieurs rôles séparés
        par « + »), et pour les enseignants « Titre » et « Domaine ». Chaque personne reçoit un lien
        pour choisir son mot de passe.
      </p>
      <MessageEtat etat={etat} />
      {(etat.liens?.length ?? 0) > 0 && (
        <ul className="space-y-1 rounded-xs border border-attention/40 bg-attention-fond p-3 text-xs">
          {etat.liens!.map((l) => (
            <li key={l.email} className="break-all">
              <span className="font-medium">{l.email}</span> : {l.lien}
            </li>
          ))}
        </ul>
      )}
      {lignes.length > 0 && (
        <>
          <div
            className="max-h-80 overflow-auto rounded-xs border border-pierre-200"
            tabIndex={0}
            role="region"
            aria-label="Aperçu de la liste"
          >
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-pierre-50 font-mono text-xs text-pierre-600 uppercase">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Ligne
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Personne
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Rôles
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
                    <td className="px-3 py-1.5">
                      {[l.titre, l.prenom, l.nom, l.postnom].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-3 py-1.5 text-xs">{l.email}</td>
                    <td className="px-3 py-1.5 text-xs">
                      {l.roles.map((r) => libellesRoles[r] ?? r).join(", ")}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-erreur">{l.erreur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-pierre-700">
              {valides} invitation(s) prête(s)
              {lignes.length - valides > 0 && `, ${lignes.length - valides} ligne(s) ignorée(s)`}.
            </p>
            <Bouton
              type="button"
              variante="institutionnel"
              disabled={enCours || valides === 0}
              onClick={() => soumettre("importer")}
            >
              {enCours ? "Envoi en cours…" : `Créer et inviter ${valides} personne(s)`}
            </Bouton>
          </div>
        </>
      )}
    </div>
  );
}
