import {
  BookOpenCheck,
  Briefcase,
  FileBadge,
  FileText,
  Megaphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ouvrirNotification, toutMarquerLu } from "@/features/notifications/actions";
import {
  iconeDe,
  type IconeNotification,
  libelleDe,
  regrouperParJour,
} from "@/features/notifications/regles";
import { cn } from "@/lib/cn";

const ICONES: Record<IconeNotification, LucideIcon> = {
  notes: BookOpenCheck,
  valve: Megaphone,
  candidature: FileText,
  frais: Wallet,
  document: FileBadge,
  stage: Briefcase,
};

const heure = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lubumbashi",
});

type Notification = {
  id: string;
  type: string;
  titre: string;
  message: string;
  lien: string | null;
  lueLe: Date | null;
  creeLe: Date;
};

/** Liste des notifications, groupées par jour ; un clic marque lue et ouvre l'objet. */
export function ListeNotifications({ notifications }: { notifications: Notification[] }) {
  const nonLues = notifications.filter((n) => !n.lueLe).length;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.25rem] leading-tight">Notifications</h1>
          <p className="mt-2 text-pierre-600">
            {nonLues > 0
              ? `${nonLues} nouvelle${nonLues > 1 ? "s" : ""} depuis votre dernière visite.`
              : "Vous êtes à jour."}
          </p>
        </div>
        {nonLues > 0 && (
          <form action={toutMarquerLu}>
            <button
              type="submit"
              className="text-sm text-ispt-600 underline underline-offset-4 hover:no-underline"
            >
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-pierre-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-encre">Aucune notification pour le moment</p>
          <p className="mt-1 text-sm text-pierre-600">
            Vous serez prévenu ici des notes publiées, des communiqués et des suites données à vos
            démarches.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {regrouperParJour(notifications).map((g) => (
            <section key={g.cle} aria-labelledby={`jour-${g.cle}`}>
              <h2
                id={`jour-${g.cle}`}
                className="font-mono text-xs tracking-wide text-pierre-600 uppercase"
              >
                {g.titre}
              </h2>
              <ul className="mt-3 divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
                {g.elements.map((n) => {
                  const Icone = ICONES[iconeDe(n.type)];
                  const lue = !!n.lueLe;
                  return (
                    <li key={n.id}>
                      <form action={ouvrirNotification.bind(null, n.id)}>
                        <button
                          type="submit"
                          className={cn(
                            "flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-pierre-50 sm:px-5",
                            !lue && "bg-ispt-50/40",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                              lue ? "bg-pierre-100 text-pierre-600" : "bg-encre text-chantier",
                            )}
                          >
                            <Icone aria-hidden className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-3">
                              <span
                                className={cn(
                                  "text-[0.9375rem]",
                                  lue ? "text-pierre-800" : "font-medium text-encre",
                                )}
                              >
                                {!lue && <span className="sr-only">Non lue : </span>}
                                {n.titre}
                              </span>
                              <span className="shrink-0 font-mono text-xs text-pierre-600">
                                {heure.format(n.creeLe)}
                              </span>
                            </span>
                            <span className="mt-1 block text-sm text-pierre-600">{n.message}</span>
                            <span className="mt-2 block font-mono text-[0.6875rem] tracking-wide text-pierre-600 uppercase">
                              {libelleDe(n.type)}
                            </span>
                          </span>
                          {!lue && (
                            <span
                              aria-hidden
                              className="mt-2 size-2 shrink-0 rounded-full bg-chantier"
                            />
                          )}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
