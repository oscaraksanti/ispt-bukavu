"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import type { GroupeNavigation } from "./navigation";

const EVENEMENT = "ispt:recherche-rapide";

/** Minuscules sans accents : « Délibérations » se trouve en tapant « deliber ». */
function normaliser(texte: string) {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const sansAbonnement = () => () => {};

/** « ⌘K » sur Mac, « Ctrl K » ailleurs (valeur neutre au rendu serveur). */
function useRaccourci() {
  return useSyncExternalStore(
    sansAbonnement,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
}

/** Bouton qui ouvre la recherche rapide (le raccourci ⌘K / Ctrl K fait de même). */
export function BoutonRecherche({ compact = false }: { compact?: boolean }) {
  const raccourci = useRaccourci();
  const ouvrir = () => window.dispatchEvent(new Event(EVENEMENT));
  if (compact)
    return (
      <button
        type="button"
        onClick={ouvrir}
        className="inline-flex size-11 items-center justify-center text-white"
        aria-label="Rechercher une page"
      >
        <Search aria-hidden className="size-5" />
      </button>
    );
  return (
    <button
      type="button"
      onClick={ouvrir}
      className="flex w-full items-center gap-2.5 rounded-xs border border-white/15 bg-white/5 px-3 py-2 text-left text-sm text-white/65 transition-colors hover:border-white/30 hover:text-white"
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="flex-1">Aller à…</span>
      <kbd className="font-mono text-legende tracking-wide text-white/50">{raccourci}</kbd>
    </button>
  );
}

/**
 * Palette de navigation : toutes les pages accessibles au rôle connecté,
 * filtrées au clavier. Fenêtre modale native (focus piégé, Échap).
 */
export function RechercheRapide({ groupes }: { groupes: GroupeNavigation[] }) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const champ = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const idListe = useId();
  const [requete, setRequete] = useState("");
  const [index, setIndex] = useState(0);

  const entrees = useMemo(
    () =>
      groupes.flatMap((g) =>
        g.entrees.map((e) => ({
          ...e,
          groupe: g.titre,
          cle: normaliser(`${e.libelle} ${g.titre} ${e.motsCles ?? ""}`),
        })),
      ),
    [groupes],
  );
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  const resultats = entrees.filter((e) => mots.every((m) => e.cle.includes(m)));
  const actif = Math.min(index, resultats.length - 1);

  useEffect(() => {
    const ouvrir = () => {
      setRequete("");
      setIndex(0);
      fenetre.current?.showModal();
      champ.current?.focus();
    };
    const surTouche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (fenetre.current?.open) fenetre.current.close();
        else ouvrir();
      }
    };
    window.addEventListener(EVENEMENT, ouvrir);
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener(EVENEMENT, ouvrir);
      window.removeEventListener("keydown", surTouche);
    };
  }, []);

  const aller = (href: string) => {
    fenetre.current?.close();
    router.push(href);
  };

  return (
    <dialog
      ref={fenetre}
      aria-label="Aller à une page de l'administration"
      onClick={(e) => e.target === fenetre.current && fenetre.current?.close()}
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-md bg-white p-0 text-pierre-900 shadow-2xl backdrop:bg-encre/55"
    >
      <div className="flex items-center gap-3 border-b border-pierre-200 px-4">
        <Search aria-hidden className="size-5 shrink-0 text-pierre-500" />
        <input
          ref={champ}
          type="text"
          role="combobox"
          enterKeyHint="go"
          aria-expanded="true"
          aria-controls={idListe}
          aria-activedescendant={actif >= 0 ? `${idListe}-${actif}` : undefined}
          aria-label="Rechercher une page"
          placeholder="Rechercher une page : notes, caisse, jury…"
          autoComplete="off"
          value={requete}
          onChange={(e) => {
            setRequete(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, resultats.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && resultats[actif]) {
              e.preventDefault();
              aller(resultats[actif].href);
            }
          }}
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-pierre-400"
        />
        <kbd className="hidden font-mono text-legende text-pierre-400 sm:block">Échap</kbd>
      </div>
      <ul id={idListe} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
        {resultats.map((e, i) => (
          <li
            key={e.href}
            id={`${idListe}-${i}`}
            role="option"
            aria-selected={i === actif}
            onClick={() => aller(e.href)}
            onMouseMove={() => setIndex(i)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xs px-3 py-2.5",
              i === actif && "bg-ispt-50",
            )}
          >
            <span className="flex-1">
              <span className="block text-corps text-encre">{e.libelle}</span>
              <span className="block text-xs text-pierre-500">{e.groupe}</span>
            </span>
            {i === actif && <CornerDownLeft aria-hidden className="size-4 text-pierre-400" />}
          </li>
        ))}
        {resultats.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-pierre-500">
            Aucune page ne correspond à « {requete} ».
          </li>
        )}
      </ul>
    </dialog>
  );
}
