import { Clock, EyeOff, MessageCircle, Pin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { accepterRegles, modifierPublication } from "@/features/campus/actions";
import { lireReglagesCampus } from "@/features/campus/reglages";
import {
  type CarteCommentaire,
  type CartePublication,
  choixAudience,
  commentairesDe,
  fil,
  FILTRES,
  type FiltreFil,
  lecteurDe,
  publication,
} from "@/features/campus/requetes";
import { ilYA, LIBELLES_AUDIENCE } from "@/features/campus/regles";
import { exigerMessagerie } from "@/features/messagerie/acces";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { ListeRegles, RappelRegles } from "./regles";
import { cn } from "@/lib/cn";
import { Compositeur } from "./compositeur";
import {
  ActionsCommentaire,
  BoutonEnregistrer,
  BoutonJaime,
  BoutonPartager,
  FormCommentaire,
  MenuPublication,
  TexteCampus,
} from "./interactions";

function Photos({ photos }: { photos: CartePublication["photos"] }) {
  if (!photos.length) return null;
  const n = photos.length;
  return (
    <div
      className={cn(
        "mt-3 grid gap-1 overflow-hidden rounded-md",
        n === 1 ? "grid-cols-1" : "grid-cols-2",
        n === 3 && "grid-rows-2",
      )}
    >
      {photos.map((ph, i) => (
        <a
          key={ph.id}
          href={`/campus/photos/${ph.id}`}
          target="_blank"
          rel="noopener"
          className={cn(
            "relative block overflow-hidden bg-pierre-100",
            n === 1 ? "aspect-[4/3] max-h-[28rem]" : "aspect-square",
            n === 3 && i === 0 && "row-span-2 aspect-auto",
          )}
        >
          <Image
            src={`/campus/photos/${ph.id}`}
            alt={ph.alt}
            fill
            unoptimized
            sizes="(min-width: 768px) 640px, 100vw"
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
          />
        </a>
      ))}
    </div>
  );
}

function Commentaires({
  liste,
  publicationId,
  ferme,
  auteurPublication,
  moderateur,
}: {
  liste: CarteCommentaire[];
  publicationId: string;
  ferme: boolean;
  auteurPublication: boolean;
  moderateur: boolean;
}) {
  const maintenant = new Date();
  const bulle = (c: CarteCommentaire | CarteCommentaire["reponses"][number], racine: boolean) => (
    <div key={c.id} className="flex gap-2">
      <Avatar
        id={c.auteurId ?? ""}
        nom={c.auteur}
        photo={c.auteurPhoto}
        taille={racine ? 32 : 24}
        className={cn("bg-pierre-100 text-pierre-600", racine ? "text-legende" : "text-[0.625rem]")}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "inline-block max-w-full rounded-2xl px-3 py-1.5",
            c.masque || c.supprime ? "border border-dashed border-pierre-300" : "bg-pierre-100",
          )}
        >
          <p className="text-legende font-semibold text-encre">{c.auteur}</p>
          {c.supprime ? (
            <p className="text-detail text-pierre-500 italic">Commentaire supprimé</p>
          ) : c.masque ? (
            <p className="text-detail text-pierre-500 italic">
              Commentaire masqué par la modération
            </p>
          ) : (
            <TexteCampus texte={c.contenu} court noms={c.mentions} />
          )}
        </div>
        <p className="mt-0.5 px-1 text-legende text-pierre-500">
          {ilYA(c.creeLe, maintenant)}
          {c.modifie ? " · modifié" : ""}
        </p>
        {!c.supprime && (
          <ActionsCommentaire
            id={c.id}
            publicationId={publicationId}
            auteur={c.auteur}
            peutRepondre={!ferme}
            peutSupprimer={c.moi || auteurPublication || moderateur}
            peutSignaler={!c.moi && !c.masque}
          />
        )}
      </div>
    </div>
  );
  return (
    <div className="space-y-3">
      {liste.map((c) => (
        <div key={c.id}>
          {bulle(c, true)}
          {c.reponses.length > 0 && (
            <div className="mt-2 ml-10 space-y-2 border-l-2 border-pierre-100 pl-3">
              {c.reponses.map((r) => bulle(r, false))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Carte({
  p,
  base,
  moderateur,
  commentaires,
  complet,
}: {
  p: CartePublication;
  base: string;
  moderateur: boolean;
  commentaires: CarteCommentaire[];
  complet: boolean;
}) {
  const chemin = `${base}/${p.id}`;
  const maintenant = new Date();
  return (
    <article
      aria-labelledby={`pub-${p.id}`}
      className={cn(
        "rounded-md border bg-white",
        p.epingle
          ? "border-chantier-fonce shadow-[inset_3px_0_0_var(--color-chantier)]"
          : "border-pierre-200",
      )}
    >
      <div className="p-4 sm:p-5">
        {(p.epingle || p.statut !== "PUBLIEE" || p.masque) && (
          <p className="mb-3 flex flex-wrap items-center gap-2 text-legende font-medium">
            {p.epingle && (
              <span className="inline-flex items-center gap-1 text-encre">
                <Pin aria-hidden className="size-3.5" /> Épinglé par l&apos;institut
              </span>
            )}
            {p.statut === "EN_ATTENTE" && (
              <span className="inline-flex items-center gap-1 rounded-xs bg-attention-fond px-2 py-0.5 text-attention">
                <Clock aria-hidden className="size-3.5" /> En attente de validation
              </span>
            )}
            {p.statut === "REFUSEE" && (
              <span className="rounded-xs bg-erreur-fond px-2 py-0.5 text-erreur">
                Non retenue par la modération
              </span>
            )}
            {p.masque && (
              <span className="inline-flex items-center gap-1 rounded-xs bg-erreur-fond px-2 py-0.5 text-erreur">
                <EyeOff aria-hidden className="size-3.5" /> Masquée : en cours d&apos;examen
              </span>
            )}
          </p>
        )}
        <header className="flex items-start gap-3">
          <Avatar id={p.auteurId ?? ""} nom={p.auteur} photo={p.auteurPhoto} taille={40} />
          <div className="min-w-0 flex-1">
            <h2 id={`pub-${p.id}`} className="truncate font-sans text-sm font-semibold text-encre">
              {p.auteur}
            </h2>
            <p className="truncate text-legende text-pierre-500">
              {p.qualite && <>{p.qualite} · </>}
              <Link href={chemin} className="hover:underline">
                <time dateTime={p.creeLe.toISOString()}>{ilYA(p.creeLe, maintenant)}</time>
              </Link>
              {p.modifie && " · modifié"} ·{" "}
              {p.audience === "INSTITUT" ? LIBELLES_AUDIENCE.INSTITUT : p.cible}
            </p>
          </div>
          <MenuPublication
            id={p.id}
            lienModifier={`${chemin}?modifier=1`}
            moi={p.moi}
            moderateur={moderateur}
            commentairesFermes={p.commentairesFermes}
            epingle={p.epingle}
          />
        </header>
        {p.contenu && (
          <div className="mt-3 text-pierre-900">
            <TexteCampus texte={p.contenu} noms={p.mentions} />
          </div>
        )}
        <Photos photos={p.photos} />
      </div>

      {p.statut === "PUBLIEE" && (
        <>
          <div className="flex flex-wrap items-center gap-1 border-t border-pierre-100 px-2 py-1 sm:px-3">
            <BoutonJaime id={p.id} aime={p.aime} total={p.jaimes} />
            <Link
              href={`${chemin}#commentaires`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xs px-2.5 text-detail font-medium text-pierre-600 hover:bg-pierre-100 hover:text-encre"
            >
              <MessageCircle aria-hidden className="size-4" />
              Commenter
              {p.commentaires > 0 && (
                <span className="font-mono text-legende">{p.commentaires}</span>
              )}
            </Link>
            <span className="ml-auto flex items-center">
              <BoutonPartager chemin={chemin} texte={p.contenu} />
              <BoutonEnregistrer id={p.id} enregistre={p.enregistre} />
            </span>
          </div>
          <div
            id={complet ? "commentaires" : undefined}
            className="space-y-3 border-t border-pierre-100 px-4 py-3 sm:px-5"
          >
            {!complet &&
              p.commentaires > commentaires.reduce((t, c) => t + 1 + c.reponses.length, 0) && (
                <Link
                  href={`${chemin}#commentaires`}
                  className="text-detail font-medium text-pierre-600 hover:underline"
                >
                  Voir les {p.commentaires} commentaires
                </Link>
              )}
            <Commentaires
              liste={commentaires}
              publicationId={p.id}
              ferme={p.commentairesFermes}
              auteurPublication={p.moi}
              moderateur={moderateur}
            />
            {p.commentairesFermes ? (
              <p className="text-detail text-pierre-500">Les commentaires sont fermés.</p>
            ) : (
              !p.masque && <FormCommentaire publicationId={p.id} />
            )}
          </div>
        </>
      )}
    </article>
  );
}

function Regles({ texte }: { texte: string }) {
  return (
    <section className="rounded-md border border-ispt-200 bg-ispt-50 p-5">
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-encre">
        <ShieldCheck aria-hidden className="size-5 text-ispt-600" />
        Règles du Campus et de la messagerie
      </h2>
      <p className="mt-1 text-detail text-pierre-700">
        Avant votre première publication, lisez et acceptez ces règles.
      </p>
      <div className="mt-3">
        <ListeRegles texte={texte} />
      </div>
      <div className="mt-4">
        <BoutonAction action={accepterRegles} variante="institutionnel" taille="md">
          J&apos;ai lu et j&apos;accepte les règles
        </BoutonAction>
      </div>
    </section>
  );
}

/** Le fil du Campus. */
export async function EcranCampus({
  base,
  suite,
  filtre,
  avant,
}: {
  base: string;
  suite: string;
  filtre: FiltreFil;
  avant: Date | null;
}) {
  const { u, profil } = await exigerMessagerie(suite);
  const l = lecteurDe(profil, u.permissions);
  const [compte, reglages, choix, { publications, suivante }] = await Promise.all([
    db.utilisateur.findUnique({ where: { id: u.id }, select: { reglesCampusLe: true } }),
    lireReglagesCampus(),
    choixAudience(l),
    fil(l, filtre, avant ?? undefined),
  ]);
  const commentaires = await Promise.all(publications.map((p) => commentairesDe(p.id, l, 2)));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-titre-page leading-tight">Campus</h1>
          <p className="mt-2 text-pierre-600">
            L&apos;espace d&apos;échange de l&apos;institut. Les annonces officielles restent sur la
            valve.
          </p>
        </div>
      </div>

      <nav
        aria-label="Filtrer le Campus"
        className="-mx-4 mt-6 [scrollbar-width:none] overflow-x-auto px-4"
      >
        <ul className="flex gap-2">
          {FILTRES.map((f) => (
            <li key={f.cle}>
              <Link
                href={f.cle === "tout" ? base : `${base}?filtre=${f.cle}`}
                aria-current={f.cle === filtre ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3.5 text-detail font-medium whitespace-nowrap",
                  f.cle === filtre
                    ? "border-encre bg-encre text-white"
                    : "border-pierre-300 bg-white text-pierre-700 hover:border-encre",
                )}
              >
                {f.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-5">
        {compte?.reglesCampusLe ? (
          <Compositeur
            auteur={{ id: u.id, nom: u.nomComplet, photo: u.photo }}
            filieres={choix.filieres}
            promotions={choix.promotions}
            validationPrealable={
              reglages.validationPrealable && !profil.personnel && !profil.enseignant
            }
          />
        ) : (
          <Regles texte={reglages.regles} />
        )}
      </div>
      {compte?.reglesCampusLe && (
        <div className="mt-3">
          <RappelRegles texte={reglages.regles} />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {publications.length === 0 && (
          <p className="rounded-md border border-dashed border-pierre-300 px-6 py-12 text-center text-pierre-500">
            {filtre === "enregistres"
              ? "Aucune publication enregistrée. Touchez « Enregistrer » sous une publication pour la retrouver ici."
              : filtre === "miennes"
                ? "Vous n'avez encore rien publié."
                : "Rien de publié pour l'instant. Lancez la conversation !"}
          </p>
        )}
        {publications.map((p, i) => (
          <Carte
            key={p.id}
            p={p}
            base={base}
            moderateur={l.moderateur}
            commentaires={commentaires[i]}
            complet={false}
          />
        ))}
      </div>
      {suivante && (
        <div className="mt-6 text-center">
          <Link
            href={`${base}?${new URLSearchParams({ ...(filtre !== "tout" ? { filtre } : {}), avant: suivante })}`}
            className="inline-flex h-10 items-center rounded-full border border-pierre-300 bg-white px-5 text-sm font-medium text-encre hover:border-encre"
          >
            Publications plus anciennes
          </Link>
        </div>
      )}
    </div>
  );
}

/** Une publication, tous ses commentaires (et sa modification par l'auteur). */
export async function EcranPublication({
  base,
  suite,
  id,
  modifier,
}: {
  base: string;
  suite: string;
  id: string;
  modifier: boolean;
}) {
  const { u, profil } = await exigerMessagerie(suite);
  const l = lecteurDe(profil, u.permissions);
  const p = await publication(id, l);
  if (!p) notFound();
  const commentaires = await commentairesDe(id, l);
  return (
    <div className="mx-auto max-w-2xl">
      <Link href={base} className="text-sm text-ispt-600 underline hover:no-underline">
        Retour au Campus
      </Link>
      {modifier && p.moi ? (
        <section className="mt-4 rounded-md border border-pierre-200 bg-white p-5">
          <h1 className="font-sans text-lg font-semibold text-encre">Modifier la publication</h1>
          <FormulaireAction
            action={modifierPublication.bind(null, id)}
            libelleEnvoi="Enregistrer"
            className="mt-4 space-y-4"
          >
            <label htmlFor="contenu-modifie" className="sr-only">
              Texte de la publication
            </label>
            <textarea
              id="contenu-modifie"
              name="contenu"
              rows={6}
              maxLength={3000}
              defaultValue={p.contenu}
              className="block w-full rounded-md border border-pierre-300 px-3 py-2 text-corps outline-none focus:border-ispt-600 focus:ring-2 focus:ring-ispt-600/20"
            />
          </FormulaireAction>
          <Link
            href={`${base}/${id}`}
            className="mt-3 inline-block text-sm text-pierre-600 underline"
          >
            Voir la publication
          </Link>
        </section>
      ) : (
        <div className="mt-4">
          <h1 className="sr-only">Publication de {p.auteur}</h1>
          <Carte p={p} base={base} moderateur={l.moderateur} commentaires={commentaires} complet />
        </div>
      )}
    </div>
  );
}
