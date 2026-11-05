import "server-only";
import { db } from "@/lib/db";
import { nettoyer } from "./nettoyer";

/**
 * Toutes les données personnelles détenues sur un compte (droit d'accès) :
 * identité, scolarité, résultats, finances, documents, candidatures,
 * notifications, appareils connectés et actions tracées.
 */
export async function donneesPersonnelles(utilisateurId: string) {
  const u = await db.utilisateur.findUnique({
    where: { id: utilisateurId },
    include: {
      roles: { select: { role: { select: { code: true, libelle: true } } } },
      profilEnseignant: true,
      sessions: { select: { creeLe: true, expireLe: true, ip: true, agent: true } },
      notifications: { orderBy: { creeLe: "desc" } },
      candidatures: {
        include: {
          campagne: { select: { libelle: true } },
          filiere: { select: { nom: true } },
          pieces: {
            include: {
              pieceExigee: { select: { libelle: true } },
              media: { select: { nomFichier: true, taille: true } },
            },
          },
          historique: true,
        },
      },
    },
  });
  if (!u) return null;
  const etudiant = await db.profilEtudiant.findUnique({
    where: { utilisateurId },
    include: {
      inscriptions: {
        include: { promotion: { include: { filiere: true, niveau: true, annee: true } } },
      },
      notes: {
        where: { evaluation: { statut: "PUBLIEE" } },
        include: {
          evaluation: {
            select: {
              intitule: true,
              type: true,
              ponderation: true,
              date: true,
              coursOffert: { select: { cours: { select: { intitule: true } } } },
            },
          },
        },
      },
      resultats: {
        where: { deliberation: { statut: "PROCLAMEE" } },
        include: {
          deliberation: { select: { periode: true, semestre: true, proclameLe: true } },
        },
      },
      presences: {
        include: {
          seance: {
            select: {
              debut: true,
              coursOffert: { select: { cours: { select: { intitule: true } } } },
            },
          },
        },
      },
      remises: {
        include: {
          devoir: { select: { titre: true } },
          fichier: { select: { nomFichier: true, taille: true } },
        },
      },
      paiements: { include: { annee: { select: { libelle: true } } } },
      exonerations: { include: { annee: { select: { libelle: true } } } },
      demandes: true,
      documents: {
        select: {
          type: true,
          code: true,
          emisLe: true,
          revoqueLe: true,
          motifRevocation: true,
        },
      },
      stages: true,
    },
  });
  const [publications, commentaires, reactions, enregistrements] = await Promise.all([
    db.publication.findMany({
      where: { auteurId: utilisateurId },
      orderBy: { creeLe: "desc" },
      select: {
        contenu: true,
        audience: true,
        statut: true,
        creeLe: true,
        modifieLe: true,
        supprimeLe: true,
        masqueLe: true,
        _count: { select: { medias: true, reactions: true, commentaires: true } },
      },
    }),
    db.commentaire.findMany({
      where: { auteurId: utilisateurId },
      orderBy: { creeLe: "desc" },
      select: { contenu: true, creeLe: true, supprimeLe: true, masqueLe: true },
    }),
    db.reactionPublication.count({ where: { utilisateurId } }),
    db.enregistrementPublication.count({ where: { utilisateurId } }),
  ]);
  const [messages, conversations] = await Promise.all([
    db.message.findMany({
      where: { auteurId: utilisateurId },
      orderBy: { creeLe: "desc" },
      take: 5000,
      select: {
        contenu: true,
        creeLe: true,
        supprimeLe: true,
        masqueLe: true,
        media: { select: { nomFichier: true } },
        conversation: { select: { type: true, titre: true } },
      },
    }),
    db.participantConversation.findMany({
      where: { utilisateurId },
      select: {
        creeLe: true,
        quitteLe: true,
        sourdine: true,
        conversation: { select: { type: true, titre: true } },
      },
    }),
  ]);
  const journal = await db.journalActivite.findMany({
    where: { auteurId: utilisateurId },
    orderBy: { creeLe: "desc" },
    select: { action: true, entite: true, creeLe: true },
    take: 2000,
  });

  const { roles, sessions, notifications, candidatures, profilEnseignant, ...identite } = u;
  return nettoyer({
    document: "Données personnelles détenues par la plateforme de l'ISPT-Bukavu",
    genereLe: new Date(),
    note: "Export établi au titre du droit d'accès. Les notes non encore publiées par le secrétariat académique n'y figurent pas.",
    identite,
    roles: roles.map((r) => r.role.libelle),
    profilEnseignant,
    scolarite: etudiant
      ? {
          matricule: etudiant.matricule,
          sexe: etudiant.sexe,
          dateNaissance: etudiant.dateNaissance,
          lieuNaissance: etudiant.lieuNaissance,
          inscriptions: etudiant.inscriptions.map((i) => ({
            annee: i.promotion.annee.libelle,
            filiere: i.promotion.filiere.nom,
            niveau: i.promotion.niveau.code,
            statut: i.statut,
            inscritLe: i.creeLe,
          })),
          notesPubliees: etudiant.notes.map((n) => ({
            cours: n.evaluation.coursOffert.cours.intitule,
            evaluation: n.evaluation.intitule,
            type: n.evaluation.type,
            ponderation: n.evaluation.ponderation,
            date: n.evaluation.date,
            note: n.valeur,
            absent: n.absent,
          })),
          resultatsProclames: etudiant.resultats.map(({ deliberation, details, ...r }) => ({
            periode:
              deliberation.periode === "ANNUELLE"
                ? "Résultat annuel"
                : `Semestre ${deliberation.semestre}`,
            proclameLe: deliberation.proclameLe,
            ...r,
            cours: details,
          })),
          presences: etudiant.presences.map((p) => ({
            cours: p.seance.coursOffert.cours.intitule,
            seance: p.seance.debut,
            statut: p.statut,
          })),
          devoirs: etudiant.remises.map((r) => ({
            devoir: r.devoir.titre,
            fichier: r.fichier.nomFichier,
            deposeLe: r.deposeLe,
            enRetard: r.enRetard,
            commentaire: r.commentaire,
            note: r.note,
            appreciation: r.appreciation,
            corrigeLe: r.corrigeLe,
          })),
          paiements: etudiant.paiements.map((p) => ({
            annee: p.annee.libelle,
            numeroRecu: p.numeroRecu,
            montant: p.montant,
            devise: p.devise,
            mode: p.mode,
            reference: p.reference,
            payeLe: p.payeLe,
            annuleLe: p.annuleLe,
            motifAnnulation: p.motifAnnulation,
          })),
          exonerations: etudiant.exonerations.map(({ annee, ...e }) => ({
            annee: annee.libelle,
            ...e,
          })),
          demandesDeDocuments: etudiant.demandes,
          documentsOfficiels: etudiant.documents,
          stages: etudiant.stages,
        }
      : null,
    candidatures,
    notifications,
    messagerie: {
      conversations: conversations.map((c) => ({
        type: c.conversation.type,
        groupe: c.conversation.titre,
        depuis: c.creeLe,
        quitteLe: c.quitteLe,
        sourdine: c.sourdine,
      })),
      messagesEnvoyes: messages.map((m) => ({
        conversation: m.conversation.type === "PRIVEE" ? "privée" : m.conversation.titre,
        envoyeLe: m.creeLe,
        contenu: m.supprimeLe ? null : m.contenu,
        pieceJointe: m.media?.nomFichier ?? null,
        supprimeLe: m.supprimeLe,
        masqueLe: m.masqueLe,
      })),
    },
    campus: {
      reglesAccepteesLe: identite.reglesCampusLe,
      publications: publications.map(({ _count, ...p }) => ({
        ...p,
        contenu: p.supprimeLe ? null : p.contenu,
        photos: _count.medias,
        jaimeRecus: _count.reactions,
        commentairesRecus: _count.commentaires,
      })),
      commentaires: commentaires.map((c) => ({ ...c, contenu: c.supprimeLe ? null : c.contenu })),
      jaimeDonnes: reactions,
      publicationsEnregistrees: enregistrements,
    },
    appareilsConnectes: sessions,
    actionsTracees: journal,
  });
}
