import "server-only";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { empreinte, jetonAleatoire } from "@/lib/securite";
import { DUREE_SESSION_MS } from "./regles";

export const COOKIE_SESSION = "ispt_session";

async function ipDuClient() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

/** Ouvre une session : le jeton va dans un cookie protégé, son empreinte en base. */
export async function ouvrirSession(utilisateurId: string) {
  const jeton = jetonAleatoire();
  const expireLe = new Date(Date.now() + DUREE_SESSION_MS);
  const h = await headers();
  await db.session.create({
    data: {
      jetonHash: empreinte(jeton),
      utilisateurId,
      expireLe,
      ip: await ipDuClient(),
      agent: h.get("user-agent")?.slice(0, 250) ?? null,
    },
  });
  (await cookies()).set(COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expireLe,
  });
}

export async function fermerSession() {
  const magasin = await cookies();
  const jeton = magasin.get(COOKIE_SESSION)?.value;
  if (jeton) await db.session.deleteMany({ where: { jetonHash: empreinte(jeton) } });
  magasin.delete(COOKIE_SESSION);
}

/** Identifiant de l'utilisateur connecté, ou null. */
export async function lireSession() {
  const jeton = (await cookies()).get(COOKIE_SESSION)?.value;
  if (!jeton) return null;
  const session = await db.session.findUnique({ where: { jetonHash: empreinte(jeton) } });
  if (!session || session.expireLe < new Date()) return null;
  return { sessionId: session.id, utilisateurId: session.utilisateurId };
}

export { ipDuClient };
