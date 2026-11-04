import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { ChampsSession } from "@/components/examens/champs-session";
import { Etiquette, EtatVide } from "@/components/ui/elements";
import { formatJour } from "@/features/actualites/dates";
import { exigerPermission } from "@/features/auth/acces";
import { creerSession } from "@/features/examens/actions";
import { TYPES_SESSION } from "@/features/examens/regles";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Examens" };

export default async function Examens() {
  await exigerPermission("academique.horaires");
  const sessions = await db.sessionExamen.findMany({
    include: { annee: true, _count: { select: { epreuves: true } } },
    orderBy: { debut: "desc" },
  });

  return (
    <>
      <EnteteAdmin
        ariane={[{ libelle: "Administration", href: "/admin" }, { libelle: "Examens" }]}
        titre="Examens"
        description="Sessions d'examens : épreuves, heures, salles et surveillants. Les conflits sont signalés avant la publication ; une fois publié, chaque étudiant voit son calendrier et chaque modification est notifiée."
      />

      <section className="mt-8">
        {sessions.length === 0 ? (
          <EtatVide
            titre="Aucune session d'examens"
            description="Créez la première session ci-dessous."
          />
        ) : (
          <ul className="divide-y divide-pierre-200 overflow-hidden rounded-md border border-pierre-200 bg-white">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/examens/${s.id}`}
                  className="group flex flex-col gap-2 p-5 hover:bg-pierre-50 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-2xl text-encre">{s.libelle}</p>
                    <p className="mt-1 text-sm text-pierre-600">
                      {TYPES_SESSION[s.type]} · {s.annee.libelle} · du {formatJour.format(s.debut)}{" "}
                      au {formatJour.format(s.fin)} · {s._count.epreuves} épreuve
                      {s._count.epreuves > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Etiquette ton={s.statut === "PUBLIEE" ? "succes" : "neutre"}>
                    {s.statut === "PUBLIEE" ? "Publiée" : "Brouillon"}
                  </Etiquette>
                  <ArrowRight
                    aria-hidden
                    className="hidden size-4 text-pierre-500 transition-transform group-hover:translate-x-0.5 sm:block"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Panneau
        className="mt-8"
        titre="Nouvelle session"
        description="Pour l'année académique courante."
      >
        <FormulaireAction action={creerSession} libelleEnvoi="Créer la session">
          <ChampsSession />
        </FormulaireAction>
      </Panneau>
    </>
  );
}
