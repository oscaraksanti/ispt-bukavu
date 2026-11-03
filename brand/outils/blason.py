"""Génère le blason vectoriel de l'ISPT-Bukavu (SVG) et ses déclinaisons.

Redessin fidèle du blason officiel (brand/blason-officiel-avec-devise.png),
dans le même repère que l'original (174 × 204 unités).

Usage : python3 brand/outils/blason.py
"""

from __future__ import annotations

import math
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

RACINE = Path(__file__).resolve().parents[1]
SORTIE = RACINE / "svg"
POLICE_DEVISE = "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"

COULEURS = {
    "bleu": "#283890",
    "blanc": "#FFFFFF",
    "jaune": "#FEF200",
    "rouge": "#E31D2F",
    "violet": "#612D89",
    "orange": "#E8521E",
}

# --- Écu ---------------------------------------------------------------

X_G, X_D, Y_H = 15.5, 161.5, 3.5  # bords gauche, droit, haut
Y_EPAULE = 134.0  # début de l'arrondi bas
X_AXE, Y_POINTE = 91.0, 183.5  # partition verticale et pointe


def contour_ecu() -> str:
    return (
        f"M{X_G} {Y_H} H{X_D} V{Y_EPAULE} "
        f"C{X_D} {Y_EPAULE + 30} {X_AXE + 30} {Y_POINTE - 6} {X_AXE} {Y_POINTE} "
        f"C{X_AXE - 30} {Y_POINTE - 6} {X_G} {Y_EPAULE + 30} {X_G} {Y_EPAULE} Z"
    )


def moitie_gauche() -> str:
    return (
        f"M{X_G} {Y_H} H{X_AXE} V{Y_POINTE} "
        f"C{X_AXE - 30} {Y_POINTE - 6} {X_G} {Y_EPAULE + 30} {X_G} {Y_EPAULE} Z"
    )


# --- Meubles de la partie gauche ----------------------------------------


def etoile(cx: float, cy: float, r: float, ratio: float = 0.42) -> str:
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * ratio
        pts.append(f"{cx + rr * math.cos(ang):.2f} {cy + rr * math.sin(ang):.2f}")
    return "M" + " L".join(pts) + " Z"


def livre() -> str:
    # Deux ailes jaunes légèrement bombées, de part et d'autre de la flèche.
    gauche = "M18.5 72.5 C30 73.5 42 77 51.5 83.5 L51.5 101 C42 94 30 89.5 18.5 88.5 Z"
    droite = "M88.5 72.5 C77 73.5 65 77 57 83.5 L57 101 C65 94 77 89.5 88.5 88.5 Z"
    return gauche + " " + droite


def fleche() -> tuple[str, str]:
    hampe = "M51.8 51.5 H57 V143 H51.8 Z"
    pointe = "M54.4 41.5 L61 52.5 H47.8 Z"
    return hampe, pointe


# --- Monogramme de la partie droite --------------------------------------

EP = 3.9  # épaisseur du trait violet


def monogramme() -> str:
    traits = [
        # I : grande verticale
        f"M109 18 V155",
        # barre horizontale haute
        f"M94 37 H128",
        # S
        "M122.5 58 C119 53 112.5 52 106.5 53 C99.5 54.5 95 61 95.5 68 "
        "C96 76 103 80.5 110 85.5 C117 90.5 123 97 123 108 "
        "C123 122 118 135 108 137.5 C102 139 97 135 95 130",
        # P : jambage et panse
        "M126 37 V155",
        "M126 37 C139 34 155 40 155 57.5 C155 74 140 80 126 78.5",
        # T : traverse et fût
        "M117 84.5 H155",
        "M138.5 84.5 V155",
    ]
    return " ".join(traits)


def eclair() -> str:
    return "M150.5 25 L141 25 L127.5 69 L136.5 64.5 L126.5 99 L147 51.5 L138 55.5 Z"


def engrenage(cx: float, cy: float, r: float, dents: int = 10) -> str:
    r_ext, r_int, r_trou = r, r * 0.74, r * 0.32
    pts = []
    pas = 2 * math.pi / dents
    for i in range(dents):
        a0 = i * pas
        for frac, rr in ((0.0, r_int), (0.18, r_ext), (0.5, r_ext), (0.68, r_int)):
            a = a0 + frac * pas
            pts.append(f"{cx + rr * math.cos(a):.2f} {cy + rr * math.sin(a):.2f}")
    roue = "M" + " L".join(pts) + " Z"
    trou = (
        f"M{cx + r_trou:.2f} {cy:.2f} "
        f"A{r_trou:.2f} {r_trou:.2f} 0 1 0 {cx - r_trou:.2f} {cy:.2f} "
        f"A{r_trou:.2f} {r_trou:.2f} 0 1 0 {cx + r_trou:.2f} {cy:.2f} Z"
    )
    return roue + " " + trou


# --- Devise sur arc --------------------------------------------------------

DEVISE = "SCIENTIA SPLENDET ET CONSCIENTIA"
ARC_CX, ARC_CY, ARC_R = 88.5, 104.5, 93.0  # ligne de base
TAILLE_DEVISE = 11.4
ANGLE_DEBUT, ANGLE_FIN = 155.0, 25.0  # degrés (sens trigonométrique écran)


def devise_en_chemins() -> str:
    police = TTFont(POLICE_DEVISE)
    glyphes = police.getGlyphSet()
    cmap = police.getBestCmap()
    upm = police["head"].unitsPerEm
    echelle = TAILLE_DEVISE / upm
    hmtx = police["hmtx"]

    largeurs = [hmtx[cmap[ord(c)]][0] * echelle for c in DEVISE]
    longueur_texte = sum(largeurs)
    arc = math.radians(ANGLE_DEBUT - ANGLE_FIN) * ARC_R
    interlettre = (arc - longueur_texte) / (len(DEVISE) - 1)

    chemins = []
    s = 0.0
    for c, w in zip(DEVISE, largeurs):
        milieu = s + w / 2
        theta = math.radians(ANGLE_DEBUT) - milieu / ARC_R
        x = ARC_CX + ARC_R * math.cos(theta)
        y = ARC_CY + ARC_R * math.sin(theta)
        rotation = math.degrees(theta) - 90
        if c != " ":
            pen = SVGPathPen(glyphes)
            rad = math.radians(rotation)
            cos_r, sin_r = math.cos(rad), math.sin(rad)
            # repère glyphe (y vers le haut) -> repère SVG (y vers le bas), centré
            t = TransformPen(
                pen,
                (
                    echelle * cos_r,
                    echelle * sin_r,
                    echelle * sin_r,
                    -echelle * cos_r,
                    x - (w / 2) * cos_r,
                    y - (w / 2) * sin_r,
                ),
            )
            glyphes[cmap[ord(c)]].draw(t)
            chemins.append(pen.getCommands())
        s += w + interlettre
    return " ".join(chemins)


# --- Assemblage ---------------------------------------------------------------


def svg(variante: str = "couleur", avec_devise: bool = True) -> str:
    """Variantes : « couleur », « mono » (bleu uni) et « blanc » (sur fond sombre)."""
    hauteur = 204 if avec_devise else 187
    hampe, pointe = fleche()
    engrenages = f"{engrenage(109.6, 122.6, 9.2, 12)} {engrenage(124.2, 114, 9.8, 12)}"
    c = COULEURS
    if variante == "couleur":
        elements = [
            f'<path d="{contour_ecu()}" fill="{c["blanc"]}"/>',
            f'<path d="{moitie_gauche()}" fill="{c["bleu"]}"/>',
            f'<path d="{etoile(54.4, 27.5, 17.5)} {livre()}" fill="{c["jaune"]}"/>',
            f'<path d="{hampe}" fill="{c["rouge"]}"/>',
            f'<path d="{pointe}" fill="{c["jaune"]}" stroke="{c["rouge"]}" '
            'stroke-width="1.6" stroke-linejoin="round"/>',
            f'<path d="{monogramme()}" fill="none" stroke="{c["violet"]}" stroke-width="{EP}"/>',
            f'<path d="{eclair()}" fill="{c["rouge"]}"/>',
            f'<path d="{engrenages}" fill="{c["orange"]}" fill-rule="evenodd"/>',
            f'<path d="{contour_ecu()}" fill="none" stroke="{c["bleu"]}" '
            'stroke-width="1.8" stroke-linejoin="round"/>',
        ]
        couleur_devise = c["violet"]
    else:
        # Monochrome : partie gauche pleine, meubles en réserve ; partie droite au trait.
        plein = c["bleu"] if variante == "mono" else "#FFFFFF"
        reserve = "#FFFFFF" if variante == "mono" else c["bleu"]
        elements = [
            f'<path d="{moitie_gauche()}" fill="{plein}"/>',
            f'<path d="{etoile(54.4, 27.5, 17.5)} {livre()} {hampe} {pointe}" fill="{reserve}"/>',
            f'<path d="{monogramme()}" fill="none" stroke="{plein}" stroke-width="{EP}"/>',
            f'<path d="{eclair()} {engrenages}" fill="{plein}" fill-rule="evenodd"/>',
            f'<path d="{contour_ecu()}" fill="none" stroke="{plein}" '
            'stroke-width="1.8" stroke-linejoin="round"/>',
        ]
        couleur_devise = plein
    if avec_devise:
        elements.append(f'<path d="{devise_en_chemins()}" fill="{couleur_devise}"/>')
    corps = "\n  ".join(elements)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 174 {hauteur}" '
        f'role="img" aria-label="Blason de l\'ISPT-Bukavu">\n  {corps}\n</svg>\n'
    )


def main() -> None:
    SORTIE.mkdir(parents=True, exist_ok=True)
    fichiers = {
        "blason-couleur.svg": svg("couleur", True),
        "blason-couleur-sans-devise.svg": svg("couleur", False),
        "blason-monochrome.svg": svg("mono", True),
        "blason-monochrome-sans-devise.svg": svg("mono", False),
        "blason-blanc.svg": svg("blanc", True),
        "blason-blanc-sans-devise.svg": svg("blanc", False),
    }
    for nom, contenu in fichiers.items():
        (SORTIE / nom).write_text(contenu, encoding="utf-8")
        print("écrit", SORTIE / nom)


if __name__ == "__main__":
    main()
