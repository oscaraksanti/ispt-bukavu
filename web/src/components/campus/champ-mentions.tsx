"use client";

import { useEffect, useId, useRef, useState } from "react";
import { type Mention, mentionEnCours } from "@/features/campus/regles";
import { cn } from "@/lib/cn";

type Suggestion = Mention & { detail: string };

/**
 * Zone de texte avec mentions : « @ » suivi de deux lettres propose des
 * personnes ; le choix insère « @Prénom Nom » et l'ajoute au champ caché
 * `mentions` envoyé avec le formulaire.
 */
export function ChampMentions({
  id,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 1,
  hauteurMax = 160,
  className,
  autoFocus,
  libelle,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  rows?: number;
  hauteurMax?: number;
  className?: string;
  autoFocus?: boolean;
  libelle: string;
}) {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [enCours, setEnCours] = useState<{ debut: number; requete: string } | null>(null);
  const [actif, setActif] = useState(0);
  const champ = useRef<HTMLTextAreaElement>(null);
  const liste = useId();

  // Texte vidé (publication envoyée) : les mentions repartent de zéro.
  const [precedent, setPrecedent] = useState(value);
  if (value !== precedent) {
    setPrecedent(value);
    if (!value) setMentions([]);
  }

  useEffect(() => {
    if (!enCours || enCours.requete.length < 2) return;
    const controle = new AbortController();
    const minuterie = setTimeout(() => {
      fetch(`/api/campus/personnes?q=${encodeURIComponent(enCours.requete)}`, {
        signal: controle.signal,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((d: Suggestion[]) => {
          setSuggestions(d);
          setActif(0);
        })
        .catch(() => undefined);
    }, 180);
    return () => {
      clearTimeout(minuterie);
      controle.abort();
    };
  }, [enCours]);

  const ouvert = !!enCours && enCours.requete.length >= 2 && suggestions.length > 0;

  const choisir = (s: Suggestion) => {
    if (!enCours) return;
    const fin = enCours.debut + 1 + enCours.requete.length;
    const suite = value.slice(fin).replace(/^[\p{L}' -]*/u, "");
    const texte = `${value.slice(0, enCours.debut)}@${s.nom} ${suite.trimStart()}`;
    onChange(texte);
    setMentions((m) => (m.some((x) => x.id === s.id) ? m : [...m, { id: s.id, nom: s.nom }]));
    setEnCours(null);
    setSuggestions([]);
    requestAnimationFrame(() => {
      const t = champ.current;
      if (!t) return;
      const position = enCours.debut + s.nom.length + 2;
      t.focus();
      t.setSelectionRange(position, position);
    });
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {libelle}
      </label>
      <textarea
        ref={champ}
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={ouvert}
        aria-controls={liste}
        aria-autocomplete="list"
        aria-activedescendant={ouvert ? `${liste}-${actif}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setEnCours(mentionEnCours(e.target.value, e.target.selectionStart));
          const t = e.target;
          t.style.height = "auto";
          t.style.height = `${Math.min(t.scrollHeight, hauteurMax)}px`;
        }}
        onKeyDown={(e) => {
          if (!ouvert) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActif((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActif((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            choisir(suggestions[actif]);
          } else if (e.key === "Escape") {
            setEnCours(null);
          }
        }}
        onBlur={() => setTimeout(() => setEnCours(null), 150)}
        className={className}
      />
      <input type="hidden" name="mentions" value={JSON.stringify(mentions)} />
      <ul
        id={liste}
        role="listbox"
        aria-label="Personnes à mentionner"
        className={cn(
          "absolute top-full left-0 z-30 mt-1 w-72 max-w-full overflow-hidden rounded-md border border-pierre-200 bg-white py-1 shadow-xl",
          !ouvert && "hidden",
        )}
      >
        {suggestions.map((s, i) => (
          <li
            key={s.id}
            id={`${liste}-${i}`}
            role="option"
            aria-selected={i === actif}
            onMouseDown={(e) => {
              e.preventDefault();
              choisir(s);
            }}
            className={cn("cursor-pointer px-3 py-2", i === actif && "bg-ispt-50")}
          >
            <span className="block text-sm font-medium text-encre">{s.nom}</span>
            <span className="block text-legende text-pierre-500">{s.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
