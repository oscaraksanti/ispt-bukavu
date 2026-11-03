import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin } from "@/components/admin/entete-admin";
import { EtatVide } from "@/components/ui/elements";
import { exigerPermission } from "@/features/auth/acces";
import { marquerMessage, supprimerMessage } from "@/features/contact/actions";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Messages reçus" };

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lubumbashi",
});

export default async function Messages({ searchParams }: PageProps<"/admin/messages">) {
  await exigerPermission("contenu.modifier");
  const { vue } = await searchParams;
  const traites = vue === "traites";
  const [messages, aTraiter] = await Promise.all([
    db.messageContact.findMany({
      where: { traite: traites },
      orderBy: { creeLe: "desc" },
      take: 100,
    }),
    db.messageContact.count({ where: { traite: false } }),
  ]);

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Messages reçus" }]}
        titre="Messages reçus"
        description="Messages envoyés depuis la page Contact. Répondez par email, puis classez le message."
      />
      <nav aria-label="Filtre des messages" className="mt-6 flex gap-2">
        {[
          { libelle: `À traiter (${aTraiter})`, href: "/admin/messages", actif: !traites },
          { libelle: "Classés", href: "/admin/messages?vue=traites", actif: traites },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            aria-current={f.actif ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              f.actif
                ? "border-encre bg-encre text-white"
                : "border-pierre-300 bg-white text-pierre-700 hover:border-encre",
            )}
          >
            {f.libelle}
          </Link>
        ))}
      </nav>
      {messages.length === 0 ? (
        <div className="mt-6">
          <EtatVide titre={traites ? "Aucun message classé" : "Aucun message en attente"} />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-md border border-pierre-200 bg-white">
              <div className="flex flex-col gap-2 border-b border-pierre-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-encre">{m.nom}</p>
                  <p className="text-sm text-pierre-600">{m.sujet}</p>
                </div>
                <time className="font-mono text-xs text-pierre-500">
                  {formatDate.format(m.creeLe)}
                </time>
              </div>
              <p className="px-5 py-4 leading-relaxed whitespace-pre-line text-pierre-800">
                {m.message}
              </p>
              <div className="flex flex-wrap items-center gap-2 border-t border-pierre-200 px-5 py-3">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Re : ${m.sujet}`)}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-pierre-300 px-3 text-sm font-medium text-encre hover:border-encre"
                >
                  <Mail aria-hidden className="size-4" /> {m.email}
                </a>
                {m.telephone && (
                  <a
                    href={`tel:${m.telephone.replace(/\s/g, "")}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xs px-3 text-sm text-pierre-700 hover:bg-pierre-100"
                  >
                    <Phone aria-hidden className="size-4" /> {m.telephone}
                  </a>
                )}
                <span className="flex-1" />
                <BoutonAction action={marquerMessage.bind(null, m.id, !m.traite)}>
                  {m.traite ? "Rouvrir" : "Classer"}
                </BoutonAction>
                <BoutonAction
                  action={supprimerMessage.bind(null, m.id)}
                  confirmation="Supprimer ?"
                  variante="fantome"
                  className="text-erreur hover:bg-erreur-fond"
                >
                  Supprimer
                </BoutonAction>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
