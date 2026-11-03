"use client";

import { useEffect } from "react";

const SELECTEUR = ".revele, .revele-image, .revele-trait";

/**
 * Révèle les éléments marqués lorsqu'ils entrent dans l'écran et signale le
 * défilement de la page (en-tête compact). Un seul observateur pour tout le
 * site : aucun composant serveur n'a besoin de devenir composant client.
 */
export function AnimationsDefilement() {
  useEffect(() => {
    const racine = document.documentElement;

    const surEntree = (entrees: IntersectionObserverEntry[], obs: IntersectionObserver) => {
      for (const entree of entrees) {
        if (entree.isIntersecting) {
          entree.target.setAttribute("data-visible", "");
          obs.unobserve(entree.target);
        }
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
    const observateur = {
      observe: (el: Element) =>
        (el.classList.contains("revele-image") ? observateurImage : observateurTexte).observe(el),
      disconnect: () => {
        observateurTexte.disconnect();
        observateurImage.disconnect();
      },
    };

    const observer = (noeud: ParentNode) =>
      noeud.querySelectorAll(SELECTEUR).forEach((el) => {
        if (!el.hasAttribute("data-visible")) observateur.observe(el);
      });
    observer(document);

    // Nouveaux éléments après une navigation côté client.
    const mutations = new MutationObserver((liste) => {
      for (const m of liste) {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) {
            if (n.matches(SELECTEUR)) observateur.observe(n);
            observer(n);
          }
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
      observateur.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", surDefilement);
    };
  }, []);

  return null;
}
