"use client";

import {
  Bookmark,
  Check,
  Ellipsis,
  Flag,
  Heart,
  Link2,
  MessageSquareOff,
  Pencil,
  Pin,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  basculerCommentaires,
  basculerEnregistrement,
  basculerEpingle,
  basculerJaime,
  commenter,
  signalerContenu,
  supprimerCommentaire,
  supprimerPublication,
} from "@/features/campus/actions";
import { decouperLiens } from "@/features/campus/regles";
import { MOTIFS_SIGNALEMENT } from "@/features/messagerie/regles";
import { cn } from "@/lib/cn";
import { ETAT_INITIAL } from "@/lib/etat-formulaire";

const bouton =
  "inline-flex h-9 items-center gap-1.5 rounded-xs px-2.5 text-detail font-medium text-pierre-600 transition-colors hover:bg-pierre-100 hover:text-encre";

/** Texte d'une publication : liens cliquables, « Voir plus » au-delà de 500 caractères. */
export function TexteCampus({ texte, court = false }: { texte: string; court?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const long = texte.length > 500;
  const affiche = long && !ouvert ? `${texte.slice(0, 460).trimEnd()}…` : texte;
  return (
    <div className={cn("break-words whitespace-pre-wrap", court ? "text-detail" : "text-corps")}>
      {decouperLiens(affiche).map((s, i) =>
        s.lien ? (
          <a
            key={i}
            href={s.lien}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-ispt-600 underline hover:no-underline"
          >
            {s.texte}
          </a>
        ) : (
          <span key={i}>{s.texte}</span>
        ),
      )}
      {long && (
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          className="ml-1 font-medium text-ispt-600 hover:underline"
        >
          {ouvert ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </div>
  );
}

export function BoutonJaime({ id, aime, total }: { id: string; aime: boolean; total: number }) {
  const [etat, setEtat] = useState({ aime, total });
  const [enCours, demarrer] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={etat.aime}
      disabled={enCours}
      onClick={() => {
        // Affichage immédiat, puis valeur confirmée par le serveur.
        setEtat((e) => ({ aime: !e.aime, total: e.total + (e.aime ? -1 : 1) }));
        demarrer(async () => {
          const r = await basculerJaime(id);
          if (r) setEtat(r);
        });
      }}
      className={cn(bouton, etat.aime && "text-rouge hover:text-rouge")}
    >
      <Heart aria-hidden className={cn("size-4", etat.aime && "fill-current")} />
      J&apos;aime
      {etat.total > 0 && <span className="font-mono text-legende">{etat.total}</span>}
    </button>
  );
}

export function BoutonEnregistrer({ id, enregistre }: { id: string; enregistre: boolean }) {
  const [actif, setActif] = useState(enregistre);
  const [, demarrer] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={() => {
        setActif((a) => !a);
        demarrer(async () => {
          const r = await basculerEnregistrement(id);
          if (r) setActif(r.enregistre);
        });
      }}
      className={cn(bouton, actif && "text-ispt-600")}
    >
      <Bookmark aria-hidden className={cn("size-4", actif && "fill-current")} />
      <span className="sr-only sm:not-sr-only">{actif ? "Enregistré" : "Enregistrer"}</span>
    </button>
  );
}

/** Partage : feuille de partage du téléphone, sinon copie du lien ou WhatsApp. */
export function BoutonPartager({ chemin, texte }: { chemin: string; texte: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [copie, setCopie] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const url = () => `${window.location.origin}${chemin}`;
  const extrait = texte.length > 140 ? `${texte.slice(0, 139)}…` : texte;
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!zone.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);
  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title: "Campus ISPT-Bukavu", text: extrait, url: url() });
              return;
            } catch {
              // Partage annulé : rien à faire.
              return;
            }
          }
          setOuvert((o) => !o);
        }}
        className={bouton}
      >
        <Share2 aria-hidden className="size-4" />
        <span className="sr-only sm:not-sr-only">Partager</span>
      </button>
      {ouvert && (
        <div className="absolute right-0 bottom-full z-20 mb-1 w-56 rounded-md border border-pierre-200 bg-white p-1 text-sm shadow-xl">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(url());
              setCopie(true);
              setTimeout(() => setCopie(false), 2000);
            }}
            className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left hover:bg-pierre-100"
          >
            {copie ? (
              <Check aria-hidden className="size-4 text-succes" />
            ) : (
              <Link2 aria-hidden className="size-4 text-pierre-500" />
            )}
            {copie ? "Lien copié" : "Copier le lien"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${extrait}\n${typeof window === "undefined" ? chemin : url()}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 hover:bg-pierre-100"
          >
            <Share2 aria-hidden className="size-4 text-pierre-500" />
            Envoyer par WhatsApp
          </a>
          <p className="px-2 pt-1 pb-1.5 text-legende text-pierre-500">
            Le lien ne s&apos;ouvre que pour les membres connectés de l&apos;institut.
          </p>
        </div>
      )}
    </div>
  );
}

/** Menu « … » d'une publication. */
export function MenuPublication({
  id,
  lienModifier,
  moi,
  moderateur,
  commentairesFermes,
  epingle,
}: {
  id: string;
  lienModifier: string;
  moi: boolean;
  moderateur: boolean;
  commentairesFermes: boolean;
  epingle: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [signalement, setSignalement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const zone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!zone.current?.contains(e.target as Node)) {
        setOuvert(false);
        setSignalement(false);
      }
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);
  const agir = (action: () => Promise<{ message?: string }>) =>
    demarrer(async () => {
      const r = await action();
      setMessage(r.message ?? null);
      setOuvert(false);
      setSignalement(false);
    });
  const ligne =
    "flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left hover:bg-pierre-100";
  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
        className="inline-flex size-9 items-center justify-center rounded-full text-pierre-500 hover:bg-pierre-100 hover:text-encre"
      >
        <Ellipsis aria-hidden className="size-5" />
        <span className="sr-only">Options de la publication</span>
      </button>
      {message && (
        <p
          role="status"
          className="absolute top-full right-0 z-10 mt-1 w-56 rounded-xs bg-encre px-3 py-2 text-detail text-white"
        >
          {message}
        </p>
      )}
      {ouvert && (
        <div className="absolute top-full right-0 z-20 mt-1 w-60 rounded-md border border-pierre-200 bg-white p-1 text-sm shadow-xl">
          {signalement ? (
            <>
              <p className="px-2 py-1 text-detail font-medium text-encre">Motif du signalement</p>
              {Object.entries(MOTIFS_SIGNALEMENT).map(([code, libelle]) => (
                <button
                  key={code}
                  type="button"
                  disabled={enCours}
                  onClick={() => agir(() => signalerContenu("publication", id, code))}
                  className={ligne}
                >
                  {libelle}
                </button>
              ))}
            </>
          ) : (
            <>
              {moi && (
                <>
                  <Link href={lienModifier} className={ligne}>
                    <Pencil aria-hidden className="size-4 text-pierre-500" /> Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => agir(() => basculerCommentaires(id))}
                    className={ligne}
                  >
                    <MessageSquareOff aria-hidden className="size-4 text-pierre-500" />
                    {commentairesFermes ? "Rouvrir les commentaires" : "Fermer les commentaires"}
                  </button>
                </>
              )}
              {moderateur && (
                <button
                  type="button"
                  onClick={() => agir(() => basculerEpingle(id))}
                  className={ligne}
                >
                  <Pin aria-hidden className="size-4 text-pierre-500" />
                  {epingle ? "Désépingler" : "Épingler en tête du Campus"}
                </button>
              )}
              {(moi || moderateur) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Supprimer cette publication ?"))
                      agir(() => supprimerPublication(id));
                  }}
                  className={cn(ligne, "text-erreur hover:bg-erreur-fond")}
                >
                  <Trash2 aria-hidden className="size-4" /> Supprimer
                </button>
              )}
              {!moi && (
                <button type="button" onClick={() => setSignalement(true)} className={ligne}>
                  <Flag aria-hidden className="size-4 text-pierre-500" /> Signaler
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Champ de commentaire (ou de réponse à un commentaire). */
export function FormCommentaire({
  publicationId,
  parentId,
  repondA,
  autoFocus = false,
  onFini,
}: {
  publicationId: string;
  parentId?: string;
  repondA?: string;
  autoFocus?: boolean;
  onFini?: () => void;
}) {
  const [etat, envoyer, enCours] = useActionState(
    commenter.bind(null, publicationId),
    ETAT_INITIAL,
  );
  const formulaire = useRef<HTMLFormElement>(null);
  const [texte, setTexte] = useState("");
  useEffect(() => {
    if (etat.statut !== "succes") return;
    formulaire.current?.reset();
    onFini?.();
  }, [etat, onFini]);
  const id = `commentaire-${publicationId}-${parentId ?? "racine"}`;
  return (
    <form
      ref={formulaire}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setTexte("");
        envoyer(fd);
      }}
      className="flex items-start gap-2"
    >
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label htmlFor={id} className="sr-only">
        {repondA ? `Répondre à ${repondA}` : "Écrire un commentaire"}
      </label>
      <div className="min-w-0 flex-1">
        <textarea
          id={id}
          name="contenu"
          rows={1}
          maxLength={1000}
          required
          autoFocus={autoFocus}
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            const t = e.target;
            t.style.height = "auto";
            t.style.height = `${Math.min(t.scrollHeight, 140)}px`;
          }}
          placeholder={repondA ? `Répondre à ${repondA}` : "Écrire un commentaire"}
          className="block min-h-9 w-full resize-none rounded-2xl border border-pierre-300 bg-pierre-50 px-3.5 py-1.5 text-detail outline-none focus:border-ispt-600 focus:bg-white focus:ring-2 focus:ring-ispt-600/20"
        />
        {etat.statut === "erreur" && (
          <p role="alert" className="mt-1 text-legende text-erreur">
            {etat.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={enCours || !texte.trim()}
        className="h-9 shrink-0 rounded-full bg-ispt-600 px-3.5 text-detail font-medium text-white hover:bg-ispt-700 disabled:opacity-40"
      >
        {enCours ? "…" : "Publier"}
      </button>
    </form>
  );
}

/** Actions sous un commentaire : répondre, supprimer, signaler. */
export function ActionsCommentaire({
  id,
  publicationId,
  auteur,
  peutRepondre,
  peutSupprimer,
  peutSignaler,
}: {
  id: string;
  publicationId: string;
  auteur: string;
  peutRepondre: boolean;
  peutSupprimer: boolean;
  peutSignaler: boolean;
}) {
  const [reponse, setReponse] = useState(false);
  const [signalement, setSignalement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const lien = "text-legende font-medium text-pierre-500 hover:text-encre hover:underline";
  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-3 px-1">
        {peutRepondre && (
          <button type="button" className={lien} onClick={() => setReponse((r) => !r)}>
            Répondre
          </button>
        )}
        {peutSupprimer && (
          <button
            type="button"
            className={lien}
            disabled={enCours}
            onClick={() => {
              if (window.confirm("Supprimer ce commentaire ?"))
                demarrer(async () => {
                  const r = await supprimerCommentaire(id);
                  setMessage(r.message ?? null);
                });
            }}
          >
            Supprimer
          </button>
        )}
        {peutSignaler && !signalement && (
          <button type="button" className={lien} onClick={() => setSignalement(true)}>
            Signaler
          </button>
        )}
        {signalement && (
          <label className="flex items-center gap-1.5 text-legende text-pierre-600">
            Motif
            <select
              autoFocus
              defaultValue=""
              disabled={enCours}
              onChange={(e) => {
                const motif = e.target.value;
                if (!motif) return;
                demarrer(async () => {
                  const r = await signalerContenu("commentaire", id, motif);
                  setMessage(r.message ?? null);
                  setSignalement(false);
                });
              }}
              className="h-7 rounded-xs border border-pierre-300 bg-white px-1.5 text-legende"
            >
              <option value="" disabled>
                Choisir…
              </option>
              {Object.entries(MOTIFS_SIGNALEMENT).map(([code, libelle]) => (
                <option key={code} value={code}>
                  {libelle}
                </option>
              ))}
            </select>
          </label>
        )}
        {message && (
          <span role="status" className="text-legende text-succes">
            {message}
          </span>
        )}
      </div>
      {reponse && (
        <div className="mt-2">
          <FormCommentaire
            publicationId={publicationId}
            parentId={id}
            repondA={auteur}
            autoFocus
            onFini={() => setReponse(false)}
          />
        </div>
      )}
    </div>
  );
}
