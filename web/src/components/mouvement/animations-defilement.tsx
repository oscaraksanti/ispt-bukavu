"use client";

import { useEffect } from "react";

const SELECTEUR = ".revele, .revele-titre, .revele-image, .revele-trait";
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Décalage dans une série (variable CSS --i), plafonné pour ne jamais faire attendre. */
function decalage(el: HTMLElement, pas: number) {
  const i = Number.parseFloat(el.style.getPropertyValue("--i")) || 0;
  return Math.min(i, 4) * pas;
}

/**
 * Joue l'animation d'entrée avec l'API Web Animations : l'état final est porté
 * par l'animation elle-même, sans attribut ajouté au DOM. React peut ainsi
 * hydrater les sections diffusées en continu sans divergence.
 * Un élément déjà dépassé (saut d'ancre, défilement rapide) est affiché sans délai.
 */
function reveler(el: HTMLElement, immediat: boolean) {
  const options = (duree: number, delai: number): KeyframeAnimationOptions => ({
    duration: immediat ? 0 : duree,
    delay: immediat ? 0 : delai,
    easing: EXPO,
    fill: "forwards",
  });
  if (el.classList.contains("revele-image")) {
    const delai = decalage(el, 100);
    el.animate([{ opacity: 0 }, { opacity: 1 }], options(700, delai));
    el.querySelector("img")?.animate([{ scale: "1.08" }, { scale: "1" }], options(1200, delai));
  } else if (el.classList.contains("revele-titre")) {
    const ligne = el.firstElementChild;
    ligne?.animate(
      [
        { opacity: 0, translate: "0 0.6em" },
        { opacity: 1, translate: "0 0" },
      ],
      options(700, decalage(el, 70)),
    );
  } else if (el.classList.contains("revele-trait")) {
    el.animate([{ scale: "0 1" }, { scale: "1 1" }], options(600, 120));
  } else {
    el.animate(
      [
        { opacity: 0, translate: "0 16px" },
        { opacity: 1, translate: "0 0" },
      ],
      options(600, decalage(el, 70)),
    );
  }
}

/**
 * Révèle les éléments marqués lorsqu'ils entrent dans l'écran et signale le
 * défilement de la page (en-tête compact). Un seul observateur pour tout le
 * site : aucun composant serveur n'a besoin de devenir composant client.
 */
export function AnimationsDefilement() {
  useEffect(() => {
    const racine = document.documentElement;
    // Mouvement réduit : la feuille de style affiche tout, sans animation.
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vus = new WeakSet<Element>();

    const surEntree = (entrees: IntersectionObserverEntry[], obs: IntersectionObserver) => {
      for (const entree of entrees) {
        const depasse = entree.boundingClientRect.bottom < 0;
        if (!entree.isIntersecting && !depasse) continue;
        obs.unobserve(entree.target);
        if (!reduit) reveler(entree.target as HTMLElement, depasse);
      }
    };
    const observateurTexte = new IntersectionObserver(surEntree, {
      rootMargin: "0px 0px -6% 0px",
      threshold: [0, 0.1],
    });
    const observateurImage = new IntersectionObserver(surEntree, {
      rootMargin: "0px 0px -8% 0px",
      threshold: [0, 0.15],
    });
    const suivre = (el: Element) => {
      if (vus.has(el)) return;
      vus.add(el);
      (el.classList.contains("revele-image") ? observateurImage : observateurTexte).observe(el);
    };

    document.querySelectorAll(SELECTEUR).forEach(suivre);

    // Nouveaux éléments : sections diffusées en continu et navigations côté client.
    const mutations = new MutationObserver((liste) => {
      for (const m of liste) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches(SELECTEUR)) suivre(n);
          n.querySelectorAll(SELECTEUR).forEach(suivre);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    let enAttente = false;
    const surDefilement = () => {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(() => {
        racine.toggleAttribute("data-defile", window.scrollY > 24);
        enAttente = false;
      });
    };
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });

    return () => {
      observateurTexte.disconnect();
      observateurImage.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", surDefilement);
    };
  }, []);

  return null;
}
