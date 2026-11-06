import { BellOff, Ellipsis, MessageSquarePlus, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoutonAction } from "@/components/admin/bouton-action";
import {
  accesConversation,
  exigerMessagerie,
  synchroniserGroupes,
} from "@/features/messagerie/acces";
import {
  basculerAnnonces,
  basculerBlocage,
  basculerSourdine,
  ouvrirConversation,
} from "@/features/messagerie/actions";
import {
  contactsPossibles,
  type ConversationListe,
  listeConversations,
  messagesDe,
} from "@/features/messagerie/requetes";
import { peutPublier, quandCourt } from "@/features/messagerie/regles";
import { db } from "@/lib/db";
import { RappelRegles } from "@/components/campus/regles";
import { Avatar } from "@/components/ui/avatar";
import { lireReglagesCampus } from "@/features/campus/reglages";
import { cn } from "@/lib/cn";
import { FilConversation } from "./fil-conversation";

/** Cadre à deux volets : la liste à gauche (bureau), la conversation à droite. */
function Cadre({
  liste,
  children,
  conversationOuverte,
}: {
  liste: React.ReactNode;
  children: React.ReactNode;
  conversationOuverte: boolean;
}) {
  return (
    <div className="-mx-4 grid h-[calc(100svh-13rem-var(--bandeau-demo,0rem))] min-h-[28rem] grid-cols-1 overflow-hidden border-y border-pierre-200 bg-white sm:mx-0 sm:h-[calc(100svh-13rem-var(--bandeau-demo,0rem))] sm:rounded-md sm:border lg:grid-cols-[21rem_minmax(0,1fr)]">
      <div
        className={cn(
          "min-h-0 min-w-0 flex-col border-r border-pierre-200",
          conversationOuverte ? "hidden lg:flex" : "flex",
        )}
      >
        {liste}
      </div>
      <div
        className={cn("min-h-0 min-w-0", conversationOuverte ? "flex flex-col" : "hidden lg:flex")}
      >
        {children}
      </div>
    </div>
  );
}

function Liste({
  conversations,
  base,
  actif,
}: {
  conversations: ConversationListe[];
  base: string;
  actif?: string;
}) {
  const maintenant = new Date();
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-pierre-200 px-4 py-3">
        <h1 className="font-sans text-lg font-semibold text-encre">Messages</h1>
        <Link
          href={`${base}/nouveau`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xs bg-ispt-600 px-3 text-sm font-medium text-white hover:bg-ispt-700"
        >
          <MessageSquarePlus aria-hidden className="size-4" />
          Nouveau
        </Link>
      </div>
      {conversations.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-pierre-500">
          Aucune conversation. Écrivez à un camarade, à un enseignant ou à un service de
          l&apos;institut.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`${base}/${c.id}`}
                aria-current={c.id === actif ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 border-b border-pierre-100 px-4 py-3 hover:bg-pierre-50",
                  c.id === actif && "bg-ispt-50 hover:bg-ispt-50",
                )}
              >
                {c.autre?.photo ? (
                  <Avatar id={c.autre.id} nom={c.titre} photo={c.autre.photo} taille={40} />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                      c.type === "PRIVEE" ? "bg-pierre-100 text-pierre-700" : "bg-encre text-white",
                    )}
                  >
                    {c.type === "PRIVEE" ? c.initiales : <UsersRound className="size-4" />}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm text-encre",
                        c.nonLus > 0 ? "font-semibold" : "font-medium",
                      )}
                    >
                      {c.titre}
                    </span>
                    {c.dernierLe && (
                      <span className="shrink-0 text-legende text-pierre-500">
                        {quandCourt(c.dernierLe, maintenant)}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-detail",
                        c.nonLus > 0 ? "text-pierre-800" : "text-pierre-500",
                      )}
                    >
                      {c.apercu}
                    </span>
                    {c.sourdine && (
                      <BellOff
                        aria-label="En sourdine"
                        className="size-3.5 shrink-0 text-pierre-400"
                      />
                    )}
                    {c.nonLus > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ispt-600 px-1.5 font-mono text-legende text-white">
                        {c.nonLus > 99 ? "99+" : c.nonLus}
                        <span className="sr-only"> non lu{c.nonLus > 1 ? "s" : ""}</span>
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Écran « Messages » : liste des conversations (et invitation à en choisir une sur bureau). */
export async function EcranMessages({ base, suite }: { base: string; suite: string }) {
  const { profil } = await exigerMessagerie(suite);
  await synchroniserGroupes(profil);
  const [conversations, reglages] = await Promise.all([
    listeConversations(profil),
    lireReglagesCampus(),
  ]);
  return (
    <>
      <Cadre
        conversationOuverte={false}
        liste={<Liste conversations={conversations} base={base} />}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-pierre-50 p-8 text-center">
          <UsersRound aria-hidden className="size-8 text-pierre-300" />
          <p className="text-sm text-pierre-500">
            Choisissez une conversation, ou écrivez un nouveau message.
          </p>
        </div>
      </Cadre>
      <div className="mt-4">
        <RappelRegles texte={reglages.regles} />
      </div>
    </>
  );
}

/** Écran d'une conversation ouverte. */
export async function EcranConversation({
  base,
  suite,
  id,
  communique,
}: {
  base: string;
  suite: string;
  id: string;
  /** Question posée depuis un communiqué de la valve : le message est pré-rempli. */
  communique?: string;
}) {
  const { profil } = await exigerMessagerie(suite);
  const acces = await accesConversation(profil, id);
  if (!acces) notFound();
  const { conversation, participant, animateur } = acces;
  const groupe = conversation.type !== "PRIVEE";
  const [conversations, messages] = await Promise.all([
    listeConversations(profil),
    messagesDe(id, profil.id, conversation.type),
  ]);

  let titre = conversation.titre ?? "Groupe";
  let sousTitre = "Conversation privée";
  let bloque = false;
  let autreId: string | null = null;
  if (conversation.type === "PRIVEE") {
    const autre = await db.participantConversation.findFirst({
      where: { conversationId: id, utilisateurId: { not: profil.id } },
      include: {
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            profilEtudiant: { select: { matricule: true } },
            roles: { select: { role: { select: { code: true, libelle: true } } } },
          },
        },
      },
    });
    if (autre) {
      const u = autre.utilisateur;
      autreId = u.id;
      titre = [u.prenom, u.nom].filter(Boolean).join(" ");
      sousTitre =
        u.profilEtudiant?.matricule ??
        u.roles
          .filter((r) => r.role.code !== "etudiant")
          .map((r) => r.role.libelle)
          .join(", ");
      bloque = !!(await db.blocage.findUnique({
        where: { bloqueurId_bloqueId: { bloqueurId: profil.id, bloqueId: u.id } },
      }));
    }
  } else if (conversation.type === "PROMOTION" && conversation.promotionId) {
    const n = await db.inscription.count({
      where: { promotionId: conversation.promotionId, statut: { not: "ABANDON" } },
    });
    sousTitre = `Groupe de la promotion · ${n} membre${n > 1 ? "s" : ""}`;
  } else if (conversation.type === "COURS" && conversation.coursOffertId) {
    const co = await db.coursOffert.findUnique({
      where: { id: conversation.coursOffertId },
      select: { promotionId: true, _count: { select: { enseignants: true } } },
    });
    const n =
      (co
        ? await db.inscription.count({
            where: { promotionId: co.promotionId, statut: { not: "ABANDON" } },
          })
        : 0) + (co?._count.enseignants ?? 0);
    sousTitre = `Groupe du cours${conversation.annoncesSeulement ? " · annonces" : ""} · ${n} membre${n > 1 ? "s" : ""}`;
  }

  // Seulement si l'interlocuteur est l'auteur du communiqué (pas de titre divulgué au hasard).
  const sujet =
    communique && autreId
      ? await db.communique.findFirst({
          where: { id: communique, auteurId: autreId },
          select: { titre: true },
        })
      : null;

  const menu = (
    <details className="relative">
      <summary className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-xs text-pierre-700 hover:bg-pierre-100 [&::-webkit-details-marker]:hidden">
        <Ellipsis aria-hidden className="size-5" />
        <span className="sr-only">Options de la conversation</span>
      </summary>
      <div className="absolute right-0 z-30 mt-1 flex w-64 flex-col items-stretch gap-1 rounded-md border border-pierre-200 bg-white p-2 shadow-xl">
        {participant && (
          <BoutonAction action={basculerSourdine.bind(null, id)} variante="fantome">
            {participant.sourdine ? "Réactiver les notifications" : "Mettre en sourdine"}
          </BoutonAction>
        )}
        {conversation.type === "COURS" && animateur && (
          <BoutonAction action={basculerAnnonces.bind(null, id)} variante="fantome">
            {conversation.annoncesSeulement
              ? "Permettre à tous d'écrire"
              : "Réserver l'écriture aux enseignants"}
          </BoutonAction>
        )}
        {conversation.type === "PRIVEE" && (
          <BoutonAction
            action={basculerBlocage.bind(null, id)}
            variante="fantome"
            confirmation={bloque ? undefined : "Bloquer cette personne ?"}
            className={bloque ? undefined : "text-erreur hover:bg-erreur-fond"}
          >
            {bloque ? "Débloquer" : "Bloquer cette personne"}
          </BoutonAction>
        )}
      </div>
    </details>
  );

  return (
    <Cadre
      conversationOuverte
      liste={<Liste conversations={conversations} base={base} actif={id} />}
    >
      <FilConversation
        key={id}
        conversationId={id}
        base={base}
        titre={titre}
        sousTitre={sousTitre}
        groupe={groupe}
        initial={messages}
        peutEcrire={peutPublier(conversation, animateur) && !bloque}
        annoncesSeulement={conversation.annoncesSeulement}
        menu={menu}
        brouillon={sujet ? `À propos du communiqué « ${sujet.titre} » : ` : ""}
      />
    </Cadre>
  );
}

/** Écran « Nouveau message » : choisir une personne autorisée. */
export async function EcranNouveau({
  base,
  suite,
  q,
  refus,
}: {
  base: string;
  suite: string;
  q: string;
  refus: boolean;
}) {
  const { profil } = await exigerMessagerie(suite);
  const contacts = await contactsPossibles(profil, q);
  const etudiantSeul = profil.etudiant && !profil.personnel && !profil.enseignant;
  return (
    <div className="mx-auto max-w-2xl">
      <Link href={base} className="text-sm text-ispt-600 underline hover:no-underline">
        Retour aux messages
      </Link>
      <h1 className="mt-4 text-titre-page leading-tight">Nouveau message</h1>
      <p className="mt-2 text-pierre-600">
        {etudiantSeul
          ? "Vous pouvez écrire aux étudiants de votre promotion, à vos enseignants et aux services de l'institut."
          : "Recherchez la personne par son nom, son matricule ou son adresse email."}
      </p>
      {refus && (
        <p role="alert" className="mt-4 text-sm font-medium text-erreur">
          Vous ne pouvez pas écrire à cette personne.
        </p>
      )}
      <form method="get" className="mt-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Rechercher une personne
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-pierre-400"
          />
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            autoComplete="off"
            placeholder="Nom, matricule ou adresse email"
            className="h-11 w-full rounded-md border border-pierre-300 bg-white pr-3 pl-9 text-corps outline-none focus:border-ispt-600 focus:ring-2 focus:ring-ispt-600/20"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-md border border-pierre-300 bg-white px-4 text-sm font-medium text-encre hover:border-encre"
        >
          Rechercher
        </button>
      </form>
      <h2 className="mt-8 text-legende font-semibold tracking-[0.14em] text-pierre-500 uppercase">
        {q ? "Résultats" : etudiantSeul ? "Votre promotion et vos enseignants" : "Vos étudiants"}
      </h2>
      {contacts.length === 0 ? (
        <p className="mt-3 text-sm text-pierre-500">
          {q.trim().length === 1
            ? "Saisissez au moins deux caractères."
            : q
              ? "Aucune personne trouvée parmi celles à qui vous pouvez écrire."
              : "Utilisez la recherche pour trouver une personne."}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-pierre-100 overflow-hidden rounded-md border border-pierre-200 bg-white">
          {contacts.map((c) => (
            <li key={c.id}>
              <form action={ouvrirConversation.bind(null, c.id, base)}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-pierre-50"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pierre-100 font-mono text-xs text-pierre-700"
                  >
                    {c.nom
                      .split(" ")
                      .slice(0, 2)
                      .map((x) => x[0]?.toUpperCase())
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-encre">{c.nom}</span>
                    <span className="block truncate text-detail text-pierre-500">{c.detail}</span>
                  </span>
                  <span className="text-detail text-ispt-600">Écrire</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
