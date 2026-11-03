import type { Metadata } from "next";
import Link from "next/link";
import { BoutonAction } from "@/components/admin/bouton-action";
import { EnteteAdmin, Panneau } from "@/components/admin/entete-admin";
import { FormulaireAction } from "@/components/admin/formulaire-action";
import { Champ, Liste, Saisie } from "@/components/ui/champs";
import { EtatVide } from "@/components/ui/elements";
import {
  enregistrerCours,
  enregistrerUE,
  supprimerCours,
  supprimerUE,
} from "@/features/academique/actions";
import { semestresDuNiveau } from "@/features/academique/regles";
import { exigerPermission } from "@/features/auth/acces";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

/** Page authentifiée : rendue à chaque requête, sans coquille statique. */
export const instant = false;

export const metadata: Metadata = { title: "Programme des cours" };

function Onglets({
  elements,
  actif,
  lien,
  libelle,
}: {
  elements: { id: string; libelle: string }[];
  actif: string;
  lien: (id: string) => string;
  libelle: string;
}) {
  return (
    <nav aria-label={libelle} className="flex flex-wrap gap-2">
      {elements.map((e) => (
        <Link
          key={e.id}
          href={lien(e.id)}
          aria-current={e.id === actif ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            e.id === actif
              ? "border-encre bg-encre text-white"
              : "border-pierre-300 bg-white text-pierre-700 hover:border-encre",
          )}
        >
          {e.libelle}
        </Link>
      ))}
    </nav>
  );
}

function ChampsUE({
  ue,
  semestres,
  prefixe,
}: {
  ue?: { code: string; intitule: string; semestre: number; credits: number };
  semestres: number[];
  prefixe: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[8rem_1fr_7rem_6rem]">
      <Champ id={`${prefixe}-code`} libelle="Code">
        <Saisie
          id={`${prefixe}-code`}
          name="code"
          defaultValue={ue?.code}
          maxLength={16}
          placeholder="UE-101"
        />
      </Champ>
      <Champ id={`${prefixe}-intitule`} libelle="Intitulé de l'unité">
        <Saisie
          id={`${prefixe}-intitule`}
          name="intitule"
          defaultValue={ue?.intitule}
          maxLength={160}
        />
      </Champ>
      <Champ id={`${prefixe}-semestre`} libelle="Semestre">
        <Liste
          id={`${prefixe}-semestre`}
          name="semestre"
          defaultValue={String(ue?.semestre ?? semestres[0])}
        >
          {semestres.map((s) => (
            <option key={s} value={s}>
              S{s}
            </option>
          ))}
        </Liste>
      </Champ>
      <Champ id={`${prefixe}-credits`} libelle="Crédits">
        <Saisie
          id={`${prefixe}-credits`}
          name="credits"
          inputMode="numeric"
          defaultValue={ue?.credits}
        />
      </Champ>
    </div>
  );
}

function ChampsCours({
  c,
  prefixe,
}: {
  c?: { intitule: string; credits: number; volumeHoraire: number };
  prefixe: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_6rem_8rem]">
      <Champ id={`${prefixe}-intitule`} libelle="Intitulé du cours">
        <Saisie
          id={`${prefixe}-intitule`}
          name="intitule"
          defaultValue={c?.intitule}
          maxLength={160}
        />
      </Champ>
      <Champ id={`${prefixe}-credits`} libelle="Crédits">
        <Saisie
          id={`${prefixe}-credits`}
          name="credits"
          inputMode="numeric"
          defaultValue={c?.credits}
        />
      </Champ>
      <Champ id={`${prefixe}-volume`} libelle="Heures">
        <Saisie
          id={`${prefixe}-volume`}
          name="volumeHoraire"
          inputMode="numeric"
          defaultValue={c?.volumeHoraire}
        />
      </Champ>
    </div>
  );
}

export default async function Programme({
  searchParams,
}: PageProps<"/admin/academique/programme">) {
  await exigerPermission("academique.structure");
  const { filiere: f, niveau: n } = await searchParams;
  const [filieres, niveaux] = await Promise.all([
    db.filiere.findMany({ orderBy: { ordre: "asc" } }),
    db.niveau.findMany({ orderBy: { ordre: "asc" } }),
  ]);
  const filiere = filieres.find((x) => x.id === f) ?? filieres[0];
  const niveau = niveaux.find((x) => x.id === n) ?? niveaux[0];
  if (!filiere || !niveau) return <EtatVide titre="Aucune filière" />;
  const semestres = semestresDuNiveau(niveau.ordre);
  const ues = await db.uniteEnseignement.findMany({
    where: { filiereId: filiere.id, niveauId: niveau.id },
    include: { cours: { orderBy: { intitule: "asc" } } },
    orderBy: [{ semestre: "asc" }, { code: "asc" }],
  });
  const credits = ues.reduce((t, u) => t + u.credits, 0);

  return (
    <>
      <EnteteAdmin
        ariane={[
          { libelle: "Administration", href: "/admin" },
          { libelle: "Années et promotions", href: "/admin/academique" },
          { libelle: "Programme" },
        ]}
        titre="Programme des cours"
        description="Unités d'enseignement et cours de chaque filière, par niveau, à saisir d'après le programme officiel de l'institut."
      />
      <div className="mt-8 space-y-3">
        <Onglets
          libelle="Filière"
          elements={filieres.map((x) => ({ id: x.id, libelle: x.nomCourt }))}
          actif={filiere.id}
          lien={(id) => `/admin/academique/programme?filiere=${id}&niveau=${niveau.id}`}
        />
        <Onglets
          libelle="Niveau"
          elements={niveaux.map((x) => ({ id: x.id, libelle: x.libelle }))}
          actif={niveau.id}
          lien={(id) => `/admin/academique/programme?filiere=${filiere.id}&niveau=${id}`}
        />
      </div>

      <p className="mt-6 text-sm text-pierre-600">
        {filiere.nom} · {niveau.libelle} (semestres {semestres.join(" et ")}) · {ues.length}{" "}
        unité(s), {credits} crédit(s)
      </p>

      <div className="mt-4 space-y-4">
        {ues.length === 0 && (
          <EtatVide
            titre="Programme non saisi"
            description="Ajoutez les unités d'enseignement de ce niveau, puis leurs cours."
          />
        )}
        {ues.map((ue) => (
          <section key={ue.id} className="rounded-md border border-pierre-200 bg-white">
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-xs text-ispt-600">{ue.code}</span>
                <span className="flex-1 font-medium text-encre">{ue.intitule}</span>
                <span className="text-sm text-pierre-600">
                  S{ue.semestre} · {ue.credits} crédit(s) · {ue.cours.length} cours
                </span>
              </summary>
              <div className="space-y-6 border-t border-pierre-200 p-5">
                <ul className="divide-y divide-pierre-200 border-y border-pierre-200">
                  {ue.cours.map((c) => (
                    <li key={c.id} className="py-3">
                      <details>
                        <summary className="flex cursor-pointer list-none items-center gap-3 text-sm [&::-webkit-details-marker]:hidden">
                          <span className="flex-1 text-pierre-900">{c.intitule}</span>
                          <span className="text-pierre-600">
                            {c.credits} cr. · {c.volumeHoraire} h
                          </span>
                          <span className="text-ispt-600">Modifier</span>
                        </summary>
                        <div className="mt-3 space-y-3">
                          <FormulaireAction
                            action={enregistrerCours.bind(null, c.id, ue.id)}
                            libelleEnvoi="Enregistrer le cours"
                          >
                            <ChampsCours c={c} prefixe={c.id} />
                          </FormulaireAction>
                          <BoutonAction
                            action={supprimerCours.bind(null, c.id)}
                            confirmation="Supprimer ce cours ?"
                            variante="fantome"
                            className="text-erreur hover:bg-erreur-fond"
                          >
                            Supprimer le cours
                          </BoutonAction>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-encre">Ajouter un cours</h3>
                  <div className="mt-3">
                    <FormulaireAction
                      action={enregistrerCours.bind(null, null, ue.id)}
                      libelleEnvoi="Ajouter le cours"
                      viderApresSucces
                    >
                      <ChampsCours prefixe={`nouveau-${ue.id}`} />
                    </FormulaireAction>
                  </div>
                </div>
                <details className="rounded-xs bg-pierre-50 p-4">
                  <summary className="cursor-pointer text-sm text-ispt-600">
                    Modifier ou supprimer l&apos;unité
                  </summary>
                  <div className="mt-4 space-y-3">
                    <FormulaireAction
                      action={enregistrerUE.bind(null, ue.id, filiere.id, niveau.id)}
                      libelleEnvoi="Enregistrer l'unité"
                    >
                      <ChampsUE ue={ue} semestres={semestres} prefixe={`ue-${ue.id}`} />
                    </FormulaireAction>
                    <BoutonAction
                      action={supprimerUE.bind(null, ue.id)}
                      confirmation="Supprimer l'unité et ses cours ?"
                      variante="fantome"
                      className="text-erreur hover:bg-erreur-fond"
                    >
                      Supprimer l&apos;unité
                    </BoutonAction>
                  </div>
                </details>
              </div>
            </details>
          </section>
        ))}
      </div>

      <Panneau className="mt-8" titre="Nouvelle unité d'enseignement">
        <FormulaireAction
          action={enregistrerUE.bind(null, null, filiere.id, niveau.id)}
          libelleEnvoi="Ajouter l'unité"
          viderApresSucces
        >
          <ChampsUE semestres={semestres} prefixe="nouvelle-ue" />
        </FormulaireAction>
      </Panneau>
    </>
  );
}
