"use client";

import {
  ArrowDown,
  ArrowLeft,
  CheckCheck,
  CornerUpLeft,
  Ellipsis,
  FileText,
  Flag,
  Megaphone,
  Paperclip,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import {
  envoyerMessage,
  marquerLu,
  signalerMessage,
  supprimerMessage,
} from "@/features/messagerie/actions";
import { MOTIFS_SIGNALEMENT } from "@/features/messagerie/regles";
import type { MessageClient } from "@/features/messagerie/types";
import { cn } from "@/lib/cn";
import { reduireImage } from "@/lib/reduire-image";

const FUSEAU = "Africa/Lubumbashi";
const heure = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: FUSEAU,
});
const jourLong = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: FUSEAU,
});
const cleJour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: FUSEAU });

function libelleJour(iso: string) {
  const aujourdhui = new Date().toLocaleDateString("fr-FR", { timeZone: FUSEAU });
  const hier = new Date(Date.now() - 86_400_000).toLocaleDateString("fr-FR", { timeZone: FUSEAU });
  const k = cleJour(iso);
  if (k === aujourdhui) return "Aujourd'hui";
  if (k === hier) return "Hier";
  return jourLong.format(new Date(iso));
}

const taille = (o: number) =>
  o < 1024 * 1024
    ? `${Math.max(1, Math.round(o / 1024))} Ko`
    : `${(o / 1024 / 1024).toFixed(1)} Mo`;

/** Intervalle d'actualisation d'une conversation ouverte. */
const ACTUALISATION_MS = 8000;

export function FilConversation({
  conversationId,
  base,
  titre,
  sousTitre,
  groupe,
  initial,
  peutEcrire,
  annoncesSeulement,
  menu,
  brouillon = "",
}: {
  conversationId: string;
  base: string;
  titre: string;
  sousTitre: string;
  groupe: boolean;
  initial: MessageClient[];
  peutEcrire: boolean;
  annoncesSeulement: boolean;
  /** Actions de la conversation (sourdine, annonces, blocage), rendues par le serveur. */
  menu: React.ReactNode;
  /** Début de message proposé (question sur un communiqué). */
  brouillon?: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [texte, setTexte] = useState(brouillon);
  const [fichier, setFichier] = useState<File | null>(null);
  const [reponse, setReponse] = useState<MessageClient | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [envoi, demarrer] = useTransition();
  const [enBas, setEnBas] = useState(true);
  const [nouveaux, setNouveaux] = useState(0);
  const fil = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);
  const choix = useRef<HTMLInputElement>(null);
  const dernier = useRef(initial.at(-1)?.creeLe ?? new Date(0).toISOString());

  const defiler = useCallback((doux = false) => {
    const f = fil.current;
    if (f) f.scrollTo({ top: f.scrollHeight, behavior: doux ? "smooth" : "auto" });
  }, []);

  // Ouverture : en bas du fil, conversation marquée comme lue.
  useLayoutEffect(() => {
    const f = fil.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, []);
  useEffect(() => {
    void marquerLu(conversationId);
  }, [conversationId]);

  const actualiser = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const mes = messages.filter((m) => m.moi);
    // Accusés de lecture des 10 derniers messages envoyés.
    const depuis = mes[Math.max(0, mes.length - 10)]?.creeLe;
    const parametres = new URLSearchParams({ apres: dernier.current });
    if (depuis) parametres.set("depuis", depuis);
    try {
      const r = await fetch(`/api/messagerie/${conversationId}?${parametres}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const d = (await r.json()) as { messages: MessageClient[]; lectures: Record<string, number> };
      if (d.messages.length) dernier.current = d.messages.at(-1)!.creeLe;
      const connus = new Set(messages.map((m) => m.id));
      const recus = d.messages.filter((m) => !connus.has(m.id) && !m.moi).length;
      if (recus) {
        void marquerLu(conversationId);
        if (!enBas) setNouveaux((n) => n + recus);
      }
      setMessages((actuels) => {
        const deja = new Set(actuels.map((m) => m.id));
        return [...actuels, ...d.messages.filter((m) => !deja.has(m.id))].map((m) =>
          m.id in d.lectures ? { ...m, lu: d.lectures[m.id] } : m,
        );
      });
    } catch {
      // Hors ligne : nouvel essai au prochain passage.
    }
  }, [conversationId, messages, enBas]);

  useEffect(() => {
    const minuterie = setInterval(actualiser, ACTUALISATION_MS);
    const auRetour = () => void actualiser();
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      clearInterval(minuterie);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [actualiser]);

  // Nouveau message : on suit le fil seulement si l'on était déjà en bas.
  const nombre = messages.length;
  useEffect(() => {
    if (enBas) defiler(true);
  }, [nombre, enBas, defiler]);

  const envoyer = () => {
    if (envoi || (!texte.trim() && !fichier)) return;
    setErreur(null);
    demarrer(async () => {
      const fd = new FormData();
      fd.set("contenu", texte);
      if (reponse) fd.set("reponseA", reponse.id);
      if (fichier) {
        const pret =
          fichier.type === "application/pdf" ? fichier : await reduireImage(fichier, 1600);
        fd.set("fichier", pret, fichier.name);
      }
      const r = await envoyerMessage(conversationId, fd);
      if (!r.ok) {
        setErreur(r.erreur);
        return;
      }
      dernier.current = r.message.creeLe > dernier.current ? r.message.creeLe : dernier.current;
      setMessages((m) => [...m, r.message]);
      setTexte("");
      setFichier(null);
      setReponse(null);
      setEnBas(true);
      champ.current?.focus();
    });
  };

  const retirer = (id: string) =>
    demarrer(async () => {
      const r = await supprimerMessage(id);
      if (r.statut === "erreur") setErreur(r.message ?? "Action impossible.");
      else
        setMessages((m) =>
          m.map((x) => (x.id === id ? { ...x, supprime: true, contenu: "", piece: null } : x)),
        );
    });

  const signaler = (id: string, motif: string) =>
    demarrer(async () => {
      const r = await signalerMessage(id, motif);
      if (r.statut === "erreur") setErreur(r.message ?? "Action impossible.");
      else setInfo(r.message ?? null);
    });

  return (
    <section
      aria-label={`Conversation : ${titre}`}
      className="flex h-full min-h-0 flex-col bg-white"
    >
      <header className="flex items-center gap-3 border-b border-pierre-200 px-3 py-2.5 sm:px-5">
        <Link
          href={base}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xs text-pierre-700 hover:bg-pierre-100 lg:hidden"
        >
          <ArrowLeft aria-hidden className="size-5" />
          <span className="sr-only">Toutes les conversations</span>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-sans text-base font-semibold text-encre">{titre}</h1>
          <p className="truncate text-detail text-pierre-500">{sousTitre}</p>
        </div>
        {menu}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={fil}
          role="log"
          aria-label="Messages"
          tabIndex={0}
          onScroll={(e) => {
            const f = e.currentTarget;
            const bas = f.scrollHeight - f.scrollTop - f.clientHeight < 80;
            setEnBas(bas);
            if (bas) setNouveaux(0);
          }}
          className="h-full overflow-y-auto bg-pierre-50 px-3 py-4 outline-none sm:px-5"
        >
          {messages.length === 0 && (
            <p className="mx-auto mt-10 max-w-xs text-center text-sm text-pierre-500">
              {groupe
                ? "Aucun message pour l'instant. Le groupe réunit automatiquement ses membres."
                : "Écrivez le premier message de cette conversation."}
            </p>
          )}
          <ol className="space-y-1.5">
            {messages.map((m, i) => {
              const precedent = messages[i - 1];
              const nouveauJour = !precedent || cleJour(precedent.creeLe) !== cleJour(m.creeLe);
              const suite =
                !nouveauJour &&
                precedent?.auteurId === m.auteurId &&
                new Date(m.creeLe).getTime() - new Date(precedent.creeLe).getTime() < 5 * 60_000;
              return (
                <li key={m.id}>
                  {nouveauJour && (
                    <p className="my-4 text-center">
                      <span className="rounded-full bg-white px-3 py-1 text-legende font-medium text-pierre-600 shadow-[0_0_0_1px_var(--color-pierre-200)] first-letter:uppercase">
                        {libelleJour(m.creeLe)}
                      </span>
                    </p>
                  )}
                  <Bulle
                    m={m}
                    groupe={groupe}
                    suite={suite}
                    onRepondre={() => {
                      setReponse(m);
                      champ.current?.focus();
                    }}
                    onSupprimer={() => retirer(m.id)}
                    onSignaler={(motif) => signaler(m.id, motif)}
                    conversationId={conversationId}
                  />
                </li>
              );
            })}
          </ol>
        </div>
        {nouveaux > 0 && (
          <button
            type="button"
            onClick={() => {
              defiler(true);
              setNouveaux(0);
            }}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-encre px-3.5 py-2 text-detail font-medium text-white shadow-lg"
          >
            <ArrowDown aria-hidden className="size-4" />
            {nouveaux} nouveau{nouveaux > 1 ? "x" : ""} message{nouveaux > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="border-t border-pierre-200 bg-white px-3 py-2.5 sm:px-5">
        {(erreur || info) && (
          <p
            role="status"
            className={cn(
              "mb-2 flex items-start gap-2 text-detail",
              erreur ? "text-erreur" : "text-succes",
            )}
          >
            <span className="flex-1">{erreur ?? info}</span>
            <button
              type="button"
              onClick={() => {
                setErreur(null);
                setInfo(null);
              }}
              className="text-pierre-500 hover:text-encre"
            >
              <X aria-hidden className="size-4" />
              <span className="sr-only">Fermer le message</span>
            </button>
          </p>
        )}
        {!peutEcrire ? (
          <p className="flex items-center gap-2 py-2 text-detail text-pierre-600">
            <Megaphone aria-hidden className="size-4 shrink-0 text-ispt-600" />
            {annoncesSeulement
              ? "Groupe d'annonces : seuls les enseignants du cours y écrivent."
              : "Vous ne pouvez pas écrire dans cette conversation."}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              envoyer();
            }}
          >
            {reponse && (
              <div className="mb-2 flex items-start gap-2 border-l-2 border-ispt-600 bg-ispt-50 px-3 py-1.5 text-detail">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ispt-700">
                    Réponse à {reponse.moi ? "vous-même" : reponse.auteur}
                  </p>
                  <p className="truncate text-pierre-600">
                    {reponse.contenu || (reponse.piece ? "Pièce jointe" : "")}
                  </p>
                </div>
                <button type="button" onClick={() => setReponse(null)}>
                  <X aria-hidden className="size-4 text-pierre-500" />
                  <span className="sr-only">Annuler la réponse</span>
                </button>
              </div>
            )}
            {fichier && (
              <p className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xs border border-pierre-200 px-2.5 py-1 text-detail">
                <FileText aria-hidden className="size-4 shrink-0 text-pierre-500" />
                <span className="truncate">{fichier.name}</span>
                <span className="text-pierre-500">{taille(fichier.size)}</span>
                <button type="button" onClick={() => setFichier(null)}>
                  <X aria-hidden className="size-4 text-pierre-500" />
                  <span className="sr-only">Retirer la pièce jointe</span>
                </button>
              </p>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={choix}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  setFichier(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => choix.current?.click()}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xs text-pierre-600 hover:bg-pierre-100"
              >
                <Paperclip aria-hidden className="size-5" />
                <span className="sr-only">Joindre une photo ou un PDF</span>
              </button>
              <label htmlFor={`message-${conversationId}`} className="sr-only">
                Votre message
              </label>
              <textarea
                ref={champ}
                id={`message-${conversationId}`}
                value={texte}
                rows={1}
                maxLength={4000}
                enterKeyHint="send"
                placeholder="Écrire un message"
                onChange={(e) => {
                  setTexte(e.target.value);
                  const t = e.target;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    envoyer();
                  }
                }}
                className="max-h-40 min-h-10 flex-1 resize-none rounded-md border border-pierre-300 bg-white px-3 py-2 text-corps leading-snug outline-none focus:border-ispt-600 focus:ring-2 focus:ring-ispt-600/20"
              />
              <button
                type="submit"
                disabled={envoi}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-ispt-600 text-white hover:bg-ispt-700 disabled:opacity-50"
              >
                <SendHorizontal aria-hidden className="size-5" />
                <span className="sr-only">Envoyer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function Bulle({
  m,
  groupe,
  suite,
  conversationId,
  onRepondre,
  onSupprimer,
  onSignaler,
}: {
  m: MessageClient;
  groupe: boolean;
  suite: boolean;
  conversationId: string;
  onRepondre: () => void;
  onSupprimer: () => void;
  onSignaler: (motif: string) => void;
}) {
  const retire = m.supprime || m.masque;
  return (
    <div
      className={cn("group flex flex-col", m.moi ? "items-end" : "items-start", !suite && "pt-2")}
    >
      {groupe && !m.moi && !suite && (
        <p className="mb-0.5 px-1 text-legende font-medium text-pierre-600">
          {m.auteur}
          {m.qualite && (
            <span className="ml-1.5 rounded-xs bg-ispt-50 px-1.5 py-px text-ispt-700">
              {m.qualite}
            </span>
          )}
        </p>
      )}
      <div
        className={cn(
          "flex max-w-[85%] items-end gap-1 sm:max-w-[70%]",
          m.moi && "flex-row-reverse",
        )}
      >
        <div
          className={cn(
            "min-w-0 rounded-2xl px-3 py-2 text-corps leading-snug",
            m.moi
              ? "rounded-br-md bg-ispt-600 text-white"
              : "rounded-bl-md border border-pierre-200 bg-white text-pierre-900",
            retire &&
              "border border-dashed border-pierre-300 bg-transparent text-pierre-500 italic",
          )}
        >
          {retire ? (
            <p>{m.masque ? "Message masqué par la modération" : "Message supprimé"}</p>
          ) : (
            <>
              {m.reponseA && (
                <div
                  className={cn(
                    "mb-1.5 border-l-2 px-2 py-0.5 text-detail",
                    m.moi ? "border-white/60 text-white/85" : "border-ispt-600 text-pierre-600",
                  )}
                >
                  <p className="font-medium">{m.reponseA.auteur}</p>
                  <p className="line-clamp-2">{m.reponseA.extrait}</p>
                </div>
              )}
              {m.piece &&
                (m.piece.image ? (
                  <a
                    href={`/messages/pieces/${m.id}`}
                    target="_blank"
                    rel="noopener"
                    className="block"
                  >
                    <Image
                      src={`/messages/pieces/${m.id}`}
                      alt={`Photo envoyée : ${m.piece.nom}`}
                      width={480}
                      height={360}
                      unoptimized
                      className="mb-1 h-auto max-h-64 w-auto rounded-lg object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={`/messages/pieces/${m.id}`}
                    target="_blank"
                    rel="noopener"
                    className={cn(
                      "mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-detail",
                      m.moi ? "bg-white/15" : "bg-pierre-100",
                    )}
                  >
                    <FileText aria-hidden className="size-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.piece.nom}</span>
                      <span className="opacity-75">{taille(m.piece.taille)}</span>
                    </span>
                  </a>
                ))}
              {m.contenu && <p className="break-words whitespace-pre-wrap">{m.contenu}</p>}
            </>
          )}
          <p
            className={cn(
              "mt-0.5 flex items-center justify-end gap-1 text-legende not-italic",
              m.moi && !retire ? "text-white/70" : "text-pierre-500",
            )}
          >
            <time dateTime={m.creeLe}>{heure.format(new Date(m.creeLe))}</time>
            {m.moi && !retire && m.lu > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <CheckCheck aria-hidden className="size-3.5" />
                {groupe ? `Vu par ${m.lu}` : "Vu"}
              </span>
            )}
          </p>
        </div>
        {!retire && (
          <ActionsMessage
            moi={m.moi}
            id={`${conversationId}-${m.id}`}
            onRepondre={onRepondre}
            onSupprimer={onSupprimer}
            onSignaler={onSignaler}
          />
        )}
      </div>
    </div>
  );
}

function ActionsMessage({
  moi,
  id,
  onRepondre,
  onSupprimer,
  onSignaler,
}: {
  moi: boolean;
  id: string;
  onRepondre: () => void;
  onSupprimer: () => void;
  onSignaler: (motif: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [signalement, setSignalement] = useState(false);
  // Ouvert vers le bas quand la place manque au-dessus (premiers messages du fil).
  const [versLeBas, setVersLeBas] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const basculer = () => {
    const ici = menu.current?.getBoundingClientRect();
    const fil = menu.current?.closest('[role="log"]')?.getBoundingClientRect();
    if (ici && fil) setVersLeBas(ici.top - fil.top < 240);
    setOuvert((o) => !o);
  };
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node)) {
        setOuvert(false);
        setSignalement(false);
      }
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);
  return (
    <div ref={menu} className="relative self-center">
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls={`actions-${id}`}
        onClick={basculer}
        className="inline-flex size-8 items-center justify-center rounded-full text-pierre-500 opacity-60 group-hover:opacity-100 hover:bg-pierre-200/60 hover:text-encre focus-visible:opacity-100"
      >
        <Ellipsis aria-hidden className="size-4" />
        <span className="sr-only">Actions sur le message</span>
      </button>
      {ouvert && (
        <div
          id={`actions-${id}`}
          className={cn(
            "absolute z-20 w-56 rounded-md border border-pierre-200 bg-white p-1 text-sm shadow-xl",
            versLeBas ? "top-full mt-1" : "bottom-full mb-1",
            moi ? "right-0" : "left-0",
          )}
        >
          {signalement ? (
            <div className="p-1">
              <p className="px-2 py-1 text-detail font-medium text-encre">Motif du signalement</p>
              {Object.entries(MOTIFS_SIGNALEMENT).map(([code, libelle]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onSignaler(code);
                    setOuvert(false);
                    setSignalement(false);
                  }}
                  className="block w-full rounded-xs px-2 py-1.5 text-left hover:bg-pierre-100"
                >
                  {libelle}
                </button>
              ))}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onRepondre();
                  setOuvert(false);
                }}
                className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left hover:bg-pierre-100"
              >
                <CornerUpLeft aria-hidden className="size-4 text-pierre-500" /> Répondre
              </button>
              {moi ? (
                <button
                  type="button"
                  onClick={() => {
                    onSupprimer();
                    setOuvert(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-erreur hover:bg-erreur-fond"
                >
                  <Trash2 aria-hidden className="size-4" /> Supprimer pour tous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSignalement(true)}
                  className="flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left hover:bg-pierre-100"
                >
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
