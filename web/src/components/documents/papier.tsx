import type { ReactNode } from "react";
import { BoutonImprimer } from "@/components/horaires/bouton-imprimer";
import { Blason } from "@/components/marque/blason";
import type { Institut } from "@/features/contenu/lecture";
import { cn } from "@/lib/cn";

/*
 * Papeterie des documents académiques : une seule grammaire pour les
 * attestations, relevés, bulletins, procès-verbaux, reçus et calendriers.
 * Mesures en points et millimètres (impression A4), chiffres tabulaires,
 * fond de sécurité imprimé en couleurs exactes.
 */

/** Notes et moyennes : toujours deux décimales, pour des colonnes alignées. */
export const note = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Nombres sans décimales superflues (seuils, crédits). */
export const nombre = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/* Fond de sécurité --------------------------------------------------------- */

/** Guilloché : ondes entrelacées, générées une fois (motif SVG répété). */
const GUILLOCHE = (() => {
  const largeur = 160;
  const hauteur = 48;
  const ondes = Array.from({ length: 7 }, (_, k) => {
    const phase = (k / 7) * Math.PI * 2;
    const points = Array.from({ length: 81 }, (_, i) => {
      const x = (i / 80) * largeur;
      const y =
        hauteur / 2 +
        Math.sin((x / largeur) * Math.PI * 4 + phase) * 15 +
        Math.sin((x / largeur) * Math.PI * 2 - phase) * 6;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join("");
    return `<path d="${points}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" fill="none" stroke="#283890" stroke-width="0.45" opacity="0.11">${ondes}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

/** Ligne de micro-texte (visible à la loupe, illisible une fois photocopiée). */
export function MicroTexte({ texte, className }: { texte: string; className?: string }) {
  return (
    <p
      aria-hidden
      className={cn(
        "overflow-hidden text-[3.4pt] leading-none tracking-[0.06em] whitespace-nowrap text-ispt-300 uppercase select-none",
        className,
      )}
    >
      {Array.from({ length: 60 }, () => texte).join(" · ")}
    </p>
  );
}

/* Feuille ------------------------------------------------------------------- */

type Tampon = { texte: string; ton: "erreur" | "attention" };

/**
 * Feuille A4 : fond de sécurité, filigrane du blason, tampon éventuel
 * (« Révoqué », « Document de travail »). Le contenu peut s'étendre sur
 * plusieurs pages : marges et fond se répètent sur chacune.
 */
export function Feuille({
  orientation = "portrait",
  securite,
  tampon,
  cadre = false,
  children,
  className,
}: {
  orientation?: "portrait" | "paysage";
  /** Texte du micro-texte (référence du document). */
  securite: string;
  tampon?: Tampon | null;
  /** Double cadre d'honneur (attestations). */
  cadre?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const portrait = orientation === "portrait";
  return (
    <article
      className={cn(
        "feuille relative mx-auto flex flex-col bg-white [box-decoration-break:clone] font-sans text-[9.5pt] leading-[1.5] text-pierre-900 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_40px_-12px_rgb(20_27_74/0.25)] print:shadow-none",
        portrait
          ? "feuille-portrait min-h-[297mm] w-[210mm] px-[17mm] pt-[13mm] pb-[11mm]"
          : "feuille-paysage min-h-[210mm] w-[297mm] px-[13mm] pt-[10mm] pb-[9mm]",
        className,
      )}
      style={{ backgroundImage: GUILLOCHE, backgroundSize: "160px 48px" }}
    >
      {/* Voile blanc : le guilloché ne reste visible qu'en bordure et sous le texte, très atténué. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[7mm] bg-white/80 [box-decoration-break:clone]"
      />
      {cadre && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[6mm] border-[1.2pt] border-encre p-[1.4mm]"
        >
          <div className="size-full border-[0.4pt] border-encre/60" />
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045] grayscale"
      >
        <Blason hauteur={portrait ? 420 : 330} decoratif />
      </div>
      {tampon && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-[38%] left-1/2 z-10 -translate-x-1/2 -rotate-[14deg] border-[2.5pt] px-[6mm] py-[2mm] font-sans text-[26pt] font-bold tracking-[0.18em] whitespace-nowrap uppercase opacity-[0.22]",
            tampon.ton === "erreur"
              ? "border-erreur text-erreur"
              : "border-attention text-attention",
          )}
        >
          {tampon.texte}
        </div>
      )}
      {!cadre && (
        <MicroTexte
          texte={securite}
          className={cn("absolute top-[4.5mm]", portrait ? "inset-x-[17mm]" : "inset-x-[13mm]")}
        />
      )}
      <div className="relative flex flex-1 flex-col">{children}</div>
    </article>
  );
}

/** Page d'aperçu à l'écran : barre d'outils, feuille centrée, défilement horizontal sur mobile. */
export function Apercu({
  children,
  informations,
  libelleImprimer = "Imprimer ou enregistrer en PDF",
}: {
  children: ReactNode;
  informations?: ReactNode;
  libelleImprimer?: string;
}) {
  return (
    <main className="min-h-svh bg-[#e9e7e1] print:bg-white">
      <div className="sticky top-0 z-20 border-b border-pierre-300/70 bg-[#e9e7e1]/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[297mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 text-sm text-pierre-700">{informations}</div>
          <BoutonImprimer libelle={libelleImprimer} />
        </div>
      </div>
      <div
        role="region"
        aria-label="Aperçu du document"
        tabIndex={0}
        className="overflow-x-auto py-8 outline-none print:overflow-visible print:p-0"
      >
        <div className="flex min-w-max flex-col items-center gap-8 px-4 print:block print:min-w-0 print:p-0">
          {children}
        </div>
      </div>
    </main>
  );
}

/* En-tête -------------------------------------------------------------------- */

/** En-tête officiel : tutelle, nom de l'institut, coordonnées, double filet. */
export function EnteteOfficiel({
  institut,
  tutelle,
  compact = false,
}: {
  institut: Institut;
  tutelle?: string;
  compact?: boolean;
}) {
  const hauteur = compact ? 58 : 70;
  const coordonnees = [
    institut.rue,
    institut.boitePostale,
    `${institut.ville}, ${institut.province}`,
    institut.telephone,
    institut.email,
  ].filter(Boolean);
  return (
    <header>
      <div className="grid grid-cols-[20mm_1fr_20mm] items-center gap-3">
        <div className="justify-self-start">
          <Blason hauteur={hauteur} decoratif />
        </div>
        <div className="text-center">
          <p className="text-[6.5pt] font-semibold tracking-[0.2em] text-pierre-600 uppercase">
            {institut.pays}
          </p>
          {tutelle && (
            <p className="mt-0.5 text-[6.5pt] font-semibold tracking-[0.2em] text-pierre-600 uppercase">
              {tutelle}
            </p>
          )}
          <p
            className={cn(
              "mt-1.5 font-serif leading-[1.1] font-medium whitespace-nowrap text-encre",
              compact ? "text-[13.5pt]" : "text-[14.5pt]",
            )}
          >
            {institut.nom}
          </p>
          <p className="mt-1 text-[7.5pt] font-semibold tracking-[0.32em] text-encre uppercase">
            {institut.sigle}
          </p>
          <p className="mt-1.5 text-[6.5pt] text-pierre-600">{coordonnees.join("  ·  ")}</p>
        </div>
        <div />
      </div>
      <div className="relative mt-3">
        <div className="h-[1.4pt] bg-encre" />
        <div className="mt-[1.2pt] h-[0.4pt] bg-encre" />
        <div className="absolute top-[-1pt] left-1/2 h-[3.4pt] w-[24mm] -translate-x-1/2 bg-chantier" />
      </div>
    </header>
  );
}

/** Titre du document, sous-titre et numéro de référence. */
export function TitreDocument({
  titre,
  sousTitre,
  reference,
  className,
}: {
  titre: string;
  sousTitre?: ReactNode;
  reference?: string;
  className?: string;
}) {
  return (
    <div className={cn("mt-7 text-center", className)}>
      <h1 className="font-serif text-[19pt] leading-tight font-medium tracking-[0.1em] text-encre uppercase">
        {titre}
      </h1>
      {sousTitre && <p className="mt-1.5 text-[10pt] text-pierre-700">{sousTitre}</p>}
      {reference && (
        <p className="mt-2.5 flex items-center justify-center gap-3 font-mono text-[7.5pt] tracking-[0.14em] text-pierre-600">
          <span className="h-[0.5pt] w-10 bg-pierre-400" />
          N° {reference}
          <span className="h-[0.5pt] w-10 bg-pierre-400" />
        </p>
      )}
    </div>
  );
}

/* Contenu --------------------------------------------------------------------- */

/** Titre de section en petites capitales, prolongé d'un filet. */
export function Rubrique({
  titre,
  complement,
  className,
}: {
  titre: string;
  complement?: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "flex items-center gap-3 text-[7pt] font-semibold tracking-[0.18em] text-encre uppercase",
        className,
      )}
    >
      <span>{titre}</span>
      <span className="h-[0.5pt] flex-1 bg-pierre-300" />
      {complement && (
        <span className="font-normal tracking-normal text-pierre-600 normal-case">
          {complement}
        </span>
      )}
    </h2>
  );
}

/** Fiche d'identité : libellés en petites capitales, valeurs en gras. */
export function Fiche({
  elements,
  colonnes = 3,
  className,
}: {
  elements: { libelle: string; valeur: ReactNode; mono?: boolean; large?: boolean }[];
  colonnes?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-2.5 border-y-[0.6pt] border-encre/70 bg-pierre-50/80 px-4 py-3",
        { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[colonnes],
        className,
      )}
    >
      {elements.map((e) => (
        <div key={e.libelle} className={cn("min-w-0", e.large && "col-span-2")}>
          <dt className="text-[6pt] font-semibold tracking-[0.16em] text-pierre-500 uppercase">
            {e.libelle}
          </dt>
          <dd
            className={cn(
              "mt-0.5 text-[9.5pt] leading-snug font-semibold text-encre",
              e.mono && "font-mono text-[9pt] font-normal tracking-[0.04em]",
            )}
          >
            {e.valeur}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Classes des tableaux de notes : filets fins, en-tête en petites capitales. */
export const T = {
  tableau: "w-full border-collapse text-[8.5pt] tabular-nums",
  th: "border-t-[1.2pt] border-b-[0.6pt] border-encre px-2 py-[4pt] text-left align-bottom text-[6pt] font-semibold tracking-[0.12em] text-encre uppercase",
  td: "border-b-[0.4pt] border-pierre-300 px-2 py-[3.2pt] align-top",
  total: "border-t-[0.8pt] border-b-[1.2pt] border-encre bg-pierre-50 font-semibold",
  centre: "text-center",
  droite: "text-right",
};

/** Synthèse chiffrée : une case par indicateur, la valeur en grand. */
export function Synthese({
  elements,
  className,
}: {
  elements: { libelle: string; valeur: ReactNode; detail?: ReactNode; accent?: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid divide-x-[0.5pt] divide-pierre-300 border-y-[1.2pt] border-encre",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${elements.length}, minmax(0, 1fr))` }}
    >
      {elements.map((e) => (
        <div key={e.libelle} className={cn("px-3 py-2.5", e.accent && "bg-encre text-white")}>
          <p
            className={cn(
              "text-[6pt] font-semibold tracking-[0.16em] uppercase",
              e.accent ? "text-chantier" : "text-pierre-500",
            )}
          >
            {e.libelle}
          </p>
          <p
            className={cn(
              "mt-1 font-serif text-[15pt] leading-none font-medium tabular-nums",
              e.accent ? "text-white" : "text-encre",
            )}
          >
            {e.valeur}
          </p>
          {e.detail && (
            <p className={cn("mt-1 text-[7pt]", e.accent ? "text-white/75" : "text-pierre-600")}>
              {e.detail}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* Pied ------------------------------------------------------------------------ */

/** Lieu, date, signataires et emplacement du sceau. */
export function Signatures({
  lieu,
  date,
  signataires,
  sceau = true,
  className,
}: {
  lieu: string;
  date: string;
  signataires: { fonction: string; nom?: string | null }[];
  sceau?: boolean;
  className?: string;
}) {
  const bloc = (s: { fonction: string; nom?: string | null }) => (
    <div key={s.fonction} className="w-[52mm] text-center">
      <p className="text-[7.5pt] font-semibold tracking-[0.08em] text-encre uppercase">
        {s.fonction}
      </p>
      <div className="h-[19mm]" />
      <div className="mx-auto w-[46mm] border-t-[0.5pt] border-pierre-400" />
      <p className="mt-1 text-[9pt] font-semibold text-encre">{s.nom || "\u00a0"}</p>
    </div>
  );
  return (
    <div className={cn("break-inside-avoid", className)}>
      <p className="text-right text-[9pt] text-pierre-800">
        Fait à {lieu}, le {date}
      </p>
      {signataires.length >= 2 ? (
        <div className="mt-3 flex items-start justify-between">
          {bloc(signataires[0])}
          {sceau && <Sceau />}
          {bloc(signataires[1])}
        </div>
      ) : (
        <div className="mt-3 flex items-start justify-end gap-8">
          {sceau && <Sceau />}
          {signataires[0] && bloc(signataires[0])}
        </div>
      )}
    </div>
  );
}

/** Emplacement réservé au sceau de l'institut. */
export function Sceau({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "mt-3 flex size-[24mm] items-center justify-center rounded-full border-[0.6pt] border-dashed border-pierre-400 text-center text-[5.5pt] leading-tight tracking-[0.14em] text-pierre-400 uppercase",
        className,
      )}
    >
      Sceau de
      <br />
      l&apos;institut
    </div>
  );
}

/** Bloc de vérification : QR code, adresse et numéro du document. */
export function Verification({
  qr,
  code,
  url,
  className,
}: {
  qr: string;
  code: string;
  /** Adresse de la page de vérification, sans le code. */
  url: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-max items-center gap-3.5 border-[0.6pt] border-pierre-400 bg-white/90 py-2 pr-4 pl-2",
        className,
      )}
    >
      <div
        className="size-[21mm] shrink-0 [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <div className="min-w-0 leading-snug">
        <p className="text-[6pt] font-semibold tracking-[0.16em] text-encre uppercase">
          Authenticité vérifiable en ligne
        </p>
        <p className="mt-0.5 text-[7pt] text-pierre-600">
          Scannez le code ou saisissez le numéro sur
        </p>
        <p className="font-mono text-[7.5pt] whitespace-nowrap text-encre">{url}</p>
        <p className="mt-1 font-mono text-[10pt] font-medium tracking-[0.16em] text-encre">
          {code}
        </p>
      </div>
    </div>
  );
}

/** Pied de feuille : mention réglementaire et référence, au-dessus du micro-texte. */
export function PiedFeuille({
  gauche,
  droite,
  securite,
}: {
  gauche?: ReactNode;
  droite?: ReactNode;
  securite: string;
}) {
  return (
    <footer className="mt-auto pt-5">
      <div className="flex items-end justify-between gap-6 border-t-[0.5pt] border-pierre-300 pt-1.5 text-[6.5pt] leading-snug text-pierre-500">
        <p className="max-w-[70%]">{gauche}</p>
        <p className="shrink-0 text-right font-mono tracking-[0.06em]">{droite}</p>
      </div>
      <MicroTexte texte={securite} className="mt-1.5" />
    </footer>
  );
}
