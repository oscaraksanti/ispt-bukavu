"use client";

import { LogIn } from "lucide-react";

/**
 * Instance de démonstration : un clic remplit le formulaire avec le compte
 * choisi (identifiants publics) et l'envoie. Évite les fautes de frappe.
 */
export function ComptesDemo({
  comptes,
  motDePasse,
}: {
  comptes: { profil: string; identifiant: string }[];
  motDePasse: string;
}) {
  const connecter = (identifiant: string) => {
    const email = document.getElementById("email") as HTMLInputElement | null;
    const mdp = document.getElementById("motDePasse") as HTMLInputElement | null;
    if (!email || !mdp) return;
    email.value = identifiant;
    mdp.value = motDePasse;
    email.form?.requestSubmit();
  };
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {comptes.map((c) => (
        <li key={c.identifiant}>
          <button
            type="button"
            onClick={() => connecter(c.identifiant)}
            className="flex w-full items-center gap-3 rounded-xs border border-pierre-300 bg-white px-3 py-2 text-left hover:border-encre"
          >
            <LogIn aria-hidden className="size-4 shrink-0 text-ispt-600" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-encre">{c.profil}</span>
              <span className="block truncate font-mono text-legende text-pierre-600">
                {c.identifiant}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
