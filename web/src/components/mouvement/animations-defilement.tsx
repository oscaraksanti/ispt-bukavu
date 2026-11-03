"use client";

import { useEffect } from "react";

const SELECTEUR = ".revele, .revele-image, .revele-trait";
const COURBE_DOUCE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
const COURBE_RIDEAU = "cubic-bezier(0.65, 0, 0.15, 1)";

/** Rang de l'élément dans sa série (variable CSS --i), pour décaler les entrées. */
function rang(el: HTMLElement) {
  return Number.parseFloat(el.style.getPropertyValue("--i")) || 0;
}

/**
 * Joue l'animation d'entrée avec l'API Web Animations : l'état final est porté
 * par l'animation elle-même, sans attribut ajouté au DOM. React peut ainsi
 * hydrater les sections diffusées en continu sans divergence.
 */
function reveler(el: HTMLElement) {
  const i = rang(el);
  const fin = { fill: "forwards" as const };
  if (el.classList.contains("revele-image")) {
    el.animate([{ clipPath: "inset(98% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
      ...fin,
      duration: 1100,
      delay: i * 90,
      easing: COURBE_RIDEAU,
    });
    el.querySelector("img")?.animate([{ transform: "scale(1.12)" }, { transform: "scale(1)" }], {
      ...fin,
      duration: 1600,
      delay: i * 90,
      easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    });
  } else if (el.classList.contains("revele-trait")) {
    el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      ...fin,
      duration: 900,
      easing: COURBE_DOUCE,
    });
  } else {
    el.animate(
      [
        { opacity: 0, transform: "translate3d(0, 18px, 0)" },
        { opacity: 1, transform: "none" },
      ],
      { ...fin, duration: 700, delay: i * 70, easing: COURBE_DOUCE },
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
        if (!entree.isIntersecting) continue;
        obs.unobserve(entree.target);
        if (!reduit) reveler(entree.target as HTMLElement);
      }
    };
    const observateurTexte = new IntersectionObserver(surEntree, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    });
    // Les images sont masquées par un clip-path : leur surface visible est presque
    // nulle avant l'animation, d'où un seuil à zéro.
    const observateurImage = new IntersectionObserver(surEntree, {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0,
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
